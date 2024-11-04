"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { Settings, MapPin, Info, Menu, Moon, Sun } from "lucide-react";
import Image from "next/image";
import { useMediaQuery } from "react-responsive";
import { useRouter } from "next/navigation";
import type { PrayerTimeDetails, DateInfo, WeatherResponse, TimingsResponse } from "@/types/types";
import { useCountdown } from '@/hooks/useCountdown';
import { useSettings } from '@/contexts/settings-context';
import { usePrayerTimeMonitor } from '@/hooks/usePrayerTimeMonitor';

export function PrayerTimes() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimeDetails[]>([]);
  const [nextPrayer, setNextPrayer] = useState<string>("");
  const [nextPrayerTime, setNextPrayerTime] = useState<Date>(new Date());
  const [weather, setWeather] = useState<WeatherResponse>({ temp: 22, condition: "Clear sky" });
  const [cityName, setCity] = useState<string>("Paris");
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    type: 'city' | 'coordinates';
    data: any;
  } | null>(null);
  const timeRemaining = useCountdown(nextPrayerTime);
  const [dateInfo, setDateInfo] = useState<DateInfo | null>(null);
  const { settings } = useSettings();
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [formattedCurrentTime, setFormattedCurrentTime] = useState<string>('');

  // Add a ref to track if we've already fetched prayer times
  const hasFetchedRef = useRef(false);

  const formatPrayerTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateNextPrayer = useCallback((times: PrayerTimeDetails[]) => {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeInMinutes = currentHours * 60 + currentMinutes;

    const prayerTimesList = times.map(prayer => {
      const [time, period] = prayer.time.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return {
        name: prayer.name,
        timeInMinutes: hours * 60 + minutes,
        originalTime: prayer.time
      };
    });

    const nextPrayerTime = prayerTimesList.find(
      prayer => prayer.timeInMinutes > currentTimeInMinutes
    );

    if (nextPrayerTime) {
      setNextPrayer(nextPrayerTime.name);
      const [time, period] = nextPrayerTime.originalTime.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      const nextTime = new Date();
      let adjustedHours = hours;
      if (period === 'PM' && hours !== 12) adjustedHours += 12;
      if (period === 'AM' && hours === 12) adjustedHours = 0;
      nextTime.setHours(adjustedHours, minutes, 0, 0);
      setNextPrayerTime(nextTime);
    } else {
      setNextPrayer(times[0].name);
      const [time, period] = times[0].time.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      const nextTime = new Date();
      nextTime.setDate(nextTime.getDate() + 1);
      let adjustedHours = hours;
      if (period === 'PM' && hours !== 12) adjustedHours += 12;
      if (period === 'AM' && hours === 12) adjustedHours = 0;
      nextTime.setHours(adjustedHours, minutes, 0, 0);
      setNextPrayerTime(nextTime);
    }
  }, []);

  const fetchPrayerTimes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const date = new Date();
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
      
      let url: string;
      let params = new URLSearchParams({
        method: settings.calculationMethod.toString(),
        school: settings.school.toString(),
        latitudeAdjustmentMethod: "3",
        midnightMode: "0",
      });

      if (location?.type === 'coordinates') {
        const { latitude, longitude } = location.data;
        params.append('latitude', latitude.toString());
        params.append('longitude', longitude.toString());
        url = `https://api.aladhan.com/v1/timings/${formattedDate}`;
      } else {
        const { city, country } = location?.data || { city: "Paris", country: "FR" };
        params.append('city', city);
        params.append('country', country);
        url = `https://api.aladhan.com/v1/timingsByCity/${formattedDate}`;
      }

      const response = await fetch(`${url}?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch prayer times');
      }

      const data: TimingsResponse = await response.json();

      if (data.code === 200) {
        const formattedTimes: PrayerTimeDetails[] = [
          { name: "Fajr", nameAr: "الفجر", time: formatPrayerTime(data.data.timings.Fajr) },
          { name: "Sunrise", nameAr: "الشروق", time: formatPrayerTime(data.data.timings.Sunrise) },
          { name: "Dhuhr", nameAr: "الظهر", time: formatPrayerTime(data.data.timings.Dhuhr) },
          { name: "Asr", nameAr: "العصر", time: formatPrayerTime(data.data.timings.Asr) },
          { name: "Maghrib", nameAr: "المغرب", time: formatPrayerTime(data.data.timings.Maghrib) },
          { name: "Isha", nameAr: "العشاء", time: formatPrayerTime(data.data.timings.Isha) },
        ];

        setPrayerTimes(formattedTimes);
        calculateNextPrayer(formattedTimes);
        setDateInfo({
          gregorian: {
            weekday: data.data.date.gregorian.weekday.en,
            date: data.data.date.gregorian.date,
          },
          hijri: {
            date: data.data.date.hijri.date,
            month: {
              en: data.data.date.hijri.month.en,
              ar: data.data.date.hijri.month.ar,
            },
            weekday: {
              en: data.data.date.hijri.weekday.en,
              ar: data.data.date.hijri.weekday.ar,
            },
          },
        });
        
        setCity(location?.data?.city || "Current Location");
      }
    } catch (error) {
      console.error("Error fetching prayer times:", error);
      setError("Failed to fetch prayer times. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [location, settings, calculateNextPrayer, formatPrayerTime]);

  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    if (isWeatherLoading) return; // Prevent concurrent weather fetches
    
    try {
      setIsWeatherLoading(true);
      const weatherResponse = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      if (weatherResponse.ok) {
        const weatherData = await weatherResponse.json();
        console.log('Weather API Response:', weatherData);
        setWeather(weatherData);
        
        // Update location with new weather data
        if (location) {
          const updatedLocation = {
            ...location,
            data: {
              ...location.data,
              weather: weatherData
            }
          };
          localStorage.setItem('prayerLocation', JSON.stringify(updatedLocation));
          localStorage.setItem('lastWeatherUpdate', Date.now().toString());
        }
      }
    } catch (error) {
      console.error('Failed to update weather:', error);
    } finally {
      setIsWeatherLoading(false);
    }
  }, [location, isWeatherLoading]);

  // Initial setup effect
  useEffect(() => {
    setMounted(true);
    const savedLocation = localStorage.getItem('prayerLocation');
    if (savedLocation) {
      const parsedLocation = JSON.parse(savedLocation);
      setLocation(parsedLocation);
      // Set weather from cached data
      if (parsedLocation.data.weather) {
        setWeather(parsedLocation.data.weather);
      }
    }
  }, []);

  // Location and weather effect
  useEffect(() => {
    if (!mounted || !location || hasFetchedRef.current) return;

    const fetchData = async () => {
      hasFetchedRef.current = true;
      
      // Fetch prayer times
      await fetchPrayerTimes();

      // Check if we need to fetch weather
      const lastWeatherUpdate = localStorage.getItem('lastWeatherUpdate');
      const weatherIsStale = !lastWeatherUpdate || 
        (Date.now() - parseInt(lastWeatherUpdate)) > 30 * 60 * 1000; // 30 minutes

      if (!location.data.weather || weatherIsStale) {
        const { latitude, longitude } = location.data;
        await fetchWeather(latitude, longitude);
      }
    };

    fetchData();

    // Set up daily update interval
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const timeToMidnight = midnight.getTime() - Date.now();

    // Set timeout for the first midnight update
    const midnightTimeout = setTimeout(() => {
      fetchData();
      // Then set up daily interval
      const dailyInterval = setInterval(fetchData, 24 * 60 * 60 * 1000);
      return () => clearInterval(dailyInterval);
    }, timeToMidnight);

    return () => clearTimeout(midnightTimeout);
  }, [mounted, location]);

  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      setCurrentTime(now);
      setFormattedCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      );
    };

    updateCurrentTime();
    const timer = setInterval(updateCurrentTime, 1000);

    return () => clearInterval(timer);
  }, []);

  // Add the prayer time monitor
  usePrayerTimeMonitor(prayerTimes);

  if (!mounted) {
    return null;
  }

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  const MenuItems = () => (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start"
        onClick={() => handleNavigate("/settings")}
      >
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start"
        onClick={() => handleNavigate("/location")}
      >
        <MapPin className="h-4 w-4 mr-2" />
        Change Location
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start"
        onClick={() => handleNavigate("/about")}
      >
        <Info className="h-4 w-4 mr-2" />
        About
      </Button>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Card className="overflow-hidden border-none shadow-xl bg-white/80 backdrop-blur-sm">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-red-500">
              {error}
            </div>
          ) : (
            <>
              <div className="md:flex">
                <div className="md:w-1/2 relative">
                  <Image
                    src="/hero.jpg"
                    width={800}
                    height={600}
                    alt="Mosque silhouette"
                    className="w-full h-[200px] md:h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex flex-col justify-end p-4 md:p-6 text-white">
                    <h1 className="text-xl md:text-3xl font-bold mb-2 break-words">
                      {cityName}
                    </h1>
                    <div className="text-lg md:text-2xl font-medium mb-2 font-mono">
                      {formattedCurrentTime}
                    </div>
                    {dateInfo && (
                      <div className="flex flex-col md:flex-row gap-1 mb-4 text-xs md:text-sm">
                        <span className="opacity-90">
                          {dateInfo.gregorian.weekday}, {dateInfo.gregorian.date}
                        </span>
                        <span className="hidden md:inline opacity-90">•</span>
                        <span className="opacity-90">
                          {dateInfo.hijri.date} {dateInfo.hijri.month.en} ({dateInfo.hijri.month.ar})
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                      <div className="flex items-center">
                        <Sun className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                        <span className="font-medium text-sm md:text-base">
                          {weather?.temp ?? '--'}°C
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {weather?.icon && (
                          <span className="text-lg md:text-xl">{weather.icon}</span>
                        )}
                        <div className="flex flex-col md:flex-row md:gap-x-2">
                          <span className="text-xs md:text-sm">
                            {weather?.condition ?? 'Unknown'}
                          </span>
                          <span className="text-xs md:text-sm text-white/80 font-arabic">
                            {weather?.conditionAr ?? 'غير معروف'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="md:w-1/2 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold">Prayer Times</h2>
                    {isMobile ? (
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Menu className="h-6 w-6" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </SheetTrigger>
                        <SheetContent>
                          <SheetTitle>Menu</SheetTitle>
                          <SheetDescription>
                            Access prayer times settings and location options
                          </SheetDescription>
                          <div className="flex flex-col gap-4 mt-6">
                            <MenuItems />
                          </div>
                        </SheetContent>
                      </Sheet>
                    ) : (
                      <div className="flex gap-2">
                        <MenuItems />
                      </div>
                    )}
                  </div>
                  <div className="grid gap-4 mb-6">
                    {prayerTimes.map((prayer, index) => (
                      <div
                        key={prayer.name}
                        className={`flex items-center justify-between py-3 ${
                          index !== prayerTimes.length - 1 ? 'border-b' : ''
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-base font-medium">{prayer.name}</span>
                          <span className="text-sm text-muted-foreground">{prayer.nameAr}</span>
                        </div>
                        <span className="text-base font-semibold tabular-nums">{prayer.time}</span>
                      </div>
                    ))}
                  </div>
                  <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold mb-2">Next Prayer</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold">{nextPrayer}</span>
                      <span className="text-3xl font-bold tabular-nums">{timeRemaining}</span>
                    </div>
                    <p className="text-sm text-white/80 mt-2">
                      {nextPrayerTime.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </Card>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
