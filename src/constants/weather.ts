export const weatherTranslations = {
  Clear: { ar: "صافِ", icon: "☀️" },
  Clouds: { ar: "غائم", icon: "☁️" },
  Rain: { ar: "مطر", icon: "🌧️" },
  Drizzle: { ar: "رذاذ", icon: "🌦️" },
  Thunderstorm: { ar: "عاصف", icon: "⛈️" },
  Snow: { ar: "ثلج", icon: "🌨️" },
  Mist: { ar: "ضباب", icon: "🌫️" },
  Smoke: { ar: "دخان", icon: "🌫️" },
  Haze: { ar: "ضباب", icon: "🌫️" },
  Dust: { ar: "غبار", icon: "🌫️" },
  Fog: { ar: "ضباب", icon: "🌫️" },
  Sand: { ar: "رمل", icon: "🌫️" },
  Ash: { ar: "رماد", icon: "🌫️" },
  Squall: { ar: "عاصفة", icon: "🌪️" },
  Tornado: { ar: "إعصار", icon: "🌪️" },
};

export type WeatherCondition = keyof typeof weatherTranslations; 