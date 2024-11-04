"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, MapPin, Loader2, Globe } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { WeatherResponse } from "@/types/types";

// Move cities data to a separate constants file
import { popularCities, worldCities } from '@/constants/cities';

// Add interface for city search results
interface CitySearchResult {
  city: string;
  country: string;
  display_name?: string;
  state?: string;
  importance?: number;
  arabic?: string;
  address?: {
    city?: string;
    state?: string;
    country?: string;
    countryCode?: string;
  };
}

// Add interface for error handling
interface GeocodeError extends Error {
  name: string;
}

export function ChangeLocationComponent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<CitySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Add state for filtered cities
  const [filteredPredefinedCities, setFilteredPredefinedCities] = useState<CitySearchResult[]>([]);
  const [nominatimResults, setNominatimResults] = useState<CitySearchResult[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Optimized local search function
  const searchLocalCities = useCallback((query: string) => {
    if (query.length < 2) {
      setFilteredPredefinedCities([]);
      return;
    }

    const searchLower = query.toLowerCase();
    const results: CitySearchResult[] = [];

    // Search in popular cities first (higher priority)
    popularCities.forEach(city => {
      if (
        city.city.toLowerCase().includes(searchLower) ||
        (city.arabic && city.arabic.toLowerCase().includes(searchLower))
      ) {
        results.push({
          city: city.city,
          country: city.country,
          importance: 1,
          arabic: city.arabic
        });
      }
    });

    // Search in world cities
    worldCities.forEach(city => {
      if (city.city.toLowerCase().includes(searchLower)) {
        results.push({
          city: city.city,
          country: city.country,
          importance: 0.5
        });
      }
    });

    setFilteredPredefinedCities(results);
  }, []);

  // Optimized remote search function
  const searchRemoteCities = useCallback(async (query: string) => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` + 
        new URLSearchParams({
          format: 'json',
          q: query,
          limit: '5',
          'accept-language': 'en',
          addressdetails: '1',
          featuretype: 'city'
        }),
        { signal: abortControllerRef.current.signal }
      );
      
      if (!response.ok) throw new Error('Failed to search cities');
      
      const data = await response.json();
      
      const results = data
        .filter((item: any) => 
          item.type === 'city' || 
          item.type === 'administrative' ||
          item.type === 'town'
        )
        .map((item: any): CitySearchResult => ({
          city: item.address?.city || item.name,
          country: item.address?.country_code?.toUpperCase() || '',
          state: item.address?.state,
          display_name: item.display_name,
          importance: 0.3,
          address: {
            city: item.address?.city,
            state: item.address?.state,
            country: item.address?.country,
            countryCode: item.address?.country_code?.toUpperCase()
          }
        }));

      setNominatimResults(results);
    } catch (error) {
      const err = error as GeocodeError;
      if (err.name !== 'AbortError') {
        console.error('Error searching cities:', err);
      }
    }
  }, [filteredPredefinedCities]);

  // Debounced search handler
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setIsSearching(true);

    // Immediately search local cities
    searchLocalCities(value);

    // Debounce remote search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchRemoteCities(value);
      }, 300);
    } else {
      setNominatimResults([]);
    }

    setIsSearching(false);
  }, [searchLocalCities, searchRemoteCities]);

  // Combine results for rendering
  const combinedResults = useMemo(() => {
    return [...filteredPredefinedCities, ...nominatimResults]
      .sort((a, b) => {
        if (a.importance !== b.importance) {
          return (b.importance ?? 0) - (a.importance ?? 0);
        }
        return a.city.localeCompare(b.city);
      })
      .slice(0, 8);
  }, [filteredPredefinedCities, nominatimResults]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchWeatherData = async (lat: number, lon: number): Promise<WeatherResponse> => {
    try {
      const response = await fetch(
        `/api/weather?lat=${lat}&lon=${lon}`
      );
      
      if (!response.ok) {
        console.warn('Weather API not available, using default data');
        return {
          temp: 20,
          condition: 'Unknown',
          conditionAr: 'غير معروف',
          icon: '❓'
        };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('Weather fetch failed, using default data');
      return {
        temp: 20,
        condition: 'Unknown',
        conditionAr: 'غير معروف',
        icon: '❓'
      };
    }
  };

  const handleGetCurrentLocation = async () => {
    setIsLoading(true);
    setLocationError(null);
    
    try {
      if (!("geolocation" in navigator)) {
        throw new Error("Geolocation is not supported by your browser");
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      });

      const { latitude, longitude } = position.coords;
      
      // Get weather data
      const weatherData = await fetchWeatherData(latitude, longitude);
      
      // Get detailed location information using OpenStreetMap's Nominatim
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
        );
        
        if (!response.ok) {
          throw new Error('Failed to get location details');
        }

        const data = await response.json();

        // Try to get the most specific location name
        const locationName = data.address?.city || 
                           data.address?.town || 
                           data.address?.village || 
                           data.address?.suburb ||
                           data.address?.municipality ||
                           data.address?.county ||
                           data.address?.state ||
                           'Unknown Location';

        const country = data.address?.country_code?.toUpperCase();
        
        // Get state/region if available
        const state = data.address?.state || data.address?.region;
        
        // Create a more detailed location string
        const detailedLocation = state 
          ? `${locationName}, ${state}`
          : locationName;
        
        localStorage.setItem('prayerLocation', JSON.stringify({ 
          type: 'coordinates',
          data: { 
            latitude, 
            longitude,
            city: detailedLocation,
            country,
            weather: weatherData,
            // Store additional location details if needed
            address: {
              city: locationName,
              state,
              country: data.address?.country,
              countryCode: country
            }
          }
        }));
        
        toast.success(`Location updated to ${detailedLocation}`);
      } catch (error) {
        console.error('Error getting location details:', error);
        // If reverse geocoding fails, try an alternative service
        try {
          const backupResponse = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          if (backupResponse.ok) {
            const backupData = await backupResponse.json();
            const cityName = backupData.city || 
                           backupData.locality || 
                           backupData.principalSubdivision ||
                           'Unknown Location';
                           
            localStorage.setItem('prayerLocation', JSON.stringify({ 
              type: 'coordinates',
              data: { 
                latitude, 
                longitude,
                city: cityName,
                country: backupData.countryCode,
                weather: weatherData
              }
            }));
            
            toast.success(`Location updated to ${cityName}`);
          } else {
            throw new Error('Backup geocoding failed');
          }
        } catch (backupError) {
          // If both services fail, save coordinates only
          localStorage.setItem('prayerLocation', JSON.stringify({ 
            type: 'coordinates',
            data: { 
              latitude, 
              longitude,
              city: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
              weather: weatherData
            }
          }));
          toast.success("Location updated using coordinates");
        }
      }
      
      router.push('/');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to get location";
      setLocationError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCity = async (city: string, country: string) => {
    setIsLoading(true);
    try {
      // Get coordinates for the city using OpenStreetMap's Nominatim service
      const geocodingResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(city)}&country=${country}&format=json&limit=1`
      );
      
      if (!geocodingResponse.ok) {
        throw new Error("Failed to get city coordinates");
      }

      const geocodingData = await geocodingResponse.json();
      
      if (!geocodingData.length) {
        throw new Error("City not found");
      }

      const { lat, lon } = geocodingData[0];
      
      // Get weather data for the city
      const weatherData = await fetchWeatherData(parseFloat(lat), parseFloat(lon));

      // Store city info with weather in localStorage
      localStorage.setItem('prayerLocation', JSON.stringify({ 
        type: 'city',
        data: { 
          city,
          country,
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          weather: weatherData
        }
      }));
      
      toast.success("Location updated successfully");
      router.push('/');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update location";
      setLocationError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" passHref>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">
              Change Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {locationError && (
              <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
                {locationError}
              </div>
            )}
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for any city..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Live Search Results */}
            {searchQuery.length >= 2 && (
              <div className="space-y-2">
                {isSearching && (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
                
                {combinedResults.length > 0 ? (
                  <div className="space-y-1">
                    {combinedResults.map((location, index) => (
                      <Button
                        key={`${location.city}-${location.country}-${index}`}
                        variant="outline"
                        className="w-full justify-start text-left"
                        onClick={() => handleSelectCity(location.city, location.country)}
                        disabled={isLoading}
                      >
                        <MapPin className="mr-2 h-4 w-4 shrink-0" />
                        <div className="flex flex-col items-start overflow-hidden">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium">{location.city}</span>
                            {location.arabic !== undefined && (
                              <span className="text-sm text-muted-foreground">
                                {location.arabic}
                              </span>
                            )}
                          </div>
                          {location.state && (
                            <span className="text-xs text-muted-foreground truncate">
                              {location.state}, {location.country}
                            </span>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No cities found
                  </p>
                )}
              </div>
            )}

            {/* Popular Islamic Cities */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Popular Islamic Cities</h3>
              <div className="grid grid-cols-2 gap-2">
                {popularCities.map((location) => (
                  <Button
                    key={`${location.city}-${location.country}`}
                    variant="outline"
                    className="justify-start text-left"
                    onClick={() => handleSelectCity(location.city, location.country)}
                    disabled={isLoading}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    <div className="flex flex-col items-start">
                      <span>{location.city}</span>
                      <span className="text-xs text-gray-500">{location.arabic}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Major World Cities */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Major World Cities</h3>
              <div className="grid grid-cols-2 gap-2">
                {worldCities.map((location) => (
                  <Button
                    key={`${location.city}-${location.country}`}
                    variant="outline"
                    className="justify-start"
                    onClick={() => handleSelectCity(location.city, location.country)}
                    disabled={isLoading}
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    <span>{location.city}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Current Location Button */}
            <Button 
              className="w-full" 
              onClick={handleGetCurrentLocation}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="mr-2 h-4 w-4" />
              )}
              Use Current Location
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
