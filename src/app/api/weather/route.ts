import { NextResponse } from 'next/server';
import { weatherTranslations } from '@/constants/weather';
import type { WeatherCondition } from '@/constants/weather';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const WEATHER_API_KEY = '55a13a82e437a864ef233a560ae54408';

  if (!lat || !lon) {
    return NextResponse.json(
      { error: 'Latitude and longitude are required' },
      { status: 400 }
    );
  }

  try {
    console.log(`Fetching weather for lat: ${lat}, lon: ${lon}`);
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`,
      { next: { revalidate: 300 } }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Weather API Error:', errorData);
      throw new Error('Weather API failed');
    }

    const data = await response.json();
    console.log('Weather API Response:', data);

    const condition = data.weather[0].main as WeatherCondition;
    const translation = weatherTranslations[condition] || {
      ar: "غير معروف",
      icon: "❓"
    };

    const weatherData = {
      temp: Math.round(data.main.temp),
      condition,
      conditionAr: translation.ar,
      icon: translation.icon
    };
    
    console.log('Formatted Weather Data:', weatherData);
    return NextResponse.json(weatherData);
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { 
        temp: 20, 
        condition: 'Unknown',
        conditionAr: 'غير معروف',
        icon: '❓'
      },
      { status: 200 }
    );
  }
} 