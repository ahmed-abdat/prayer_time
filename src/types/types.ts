export interface PrayerTime {
  name: string;
  nameAr: string;
  time: string;
}

export interface Location {
  id: number;
  name: string;
}

export interface TimingsResponse {
  code: number;
  status: string;
  data: {
    timings: {
      Fajr: string;
      Sunrise: string;
      Dhuhr: string;
      Asr: string;
      Sunset: string;
      Maghrib: string;
      Isha: string;
      Imsak: string;
      Midnight: string;
    };
    date: {
      readable: string;
      timestamp: string;
      gregorian: {
        date: string;
        format: string;
        day: string;
        weekday: {
          en: string;
        };
        month: {
          number: number;
          en: string;
        };
        year: string;
      };
      hijri: {
        date: string;
        format: string;
        day: string;
        weekday: {
          en: string;
          ar: string;
        };
        month: {
          number: number;
          en: string;
          ar: string;
        };
        year: string;
        holidays: string[];
      };
    };
    meta: {
      latitude: number;
      longitude: number;
      timezone: string;
      method: {
        id: number;
        name: string;
        params: {
          Fajr: number;
          Isha: string;
        };
      };
      latitudeAdjustmentMethod: string;
      midnightMode: string;
      school: string;
      offset: {
        [key: string]: string;
      };
    };
  };
}

export interface WeatherResponse {
  temp: number;
  condition: string;
  conditionAr?: string;
  icon?: string;
}

export interface PrayerTimeDetails {
  name: string;
  nameAr: string;
  time: string;
  isNext?: boolean;
}

export interface DateInfo {
  gregorian: {
    weekday: string;
    date: string;
  };
  hijri: {
    date: string;
    month: {
      en: string;
      ar: string;
    };
    weekday: {
      en: string;
      ar: string;
    };
  };
}

export interface LocationData {
  city?: string;
  country?: string;
  latitude: number;
  longitude: number;
  weather?: WeatherResponse;
  address?: {
    city?: string;
    state?: string;
    country?: string;
    countryCode?: string;
  };
}

export interface LocationState {
  type: 'city' | 'coordinates';
  data: LocationData;
}

export type AdhanMuezzin = 'default' | 'makkah' | 'madinah' | 'alaqsa';

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  calculationMethod: number;
  school: 0 | 1;
  notifications: boolean;
  adhan: boolean;
  notificationTimes: {
    beforePrayer: number;
    fajrNotification: boolean;
    dhuhrNotification: boolean;
    asrNotification: boolean;
    maghribNotification: boolean;
    ishaNotification: boolean;
  };
  adhanSettings: {
    volume: number;
    muezzin: AdhanMuezzin;
    playAthan: boolean;
  };
}

export interface CalculationMethod {
  id: number;
  name: string;
  description?: string;
} 