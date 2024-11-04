interface City {
  city: string;
  country: string;
  arabic?: string;
}

export const popularCities: City[] = [
  { city: "Mecca", country: "SA", arabic: "مكة المكرمة" },
  { city: "Medina", country: "SA", arabic: "المدينة المنورة" },
  { city: "Istanbul", country: "TR", arabic: "إسطنبول" },
  { city: "Cairo", country: "EG", arabic: "القاهرة" },
  { city: "Dubai", country: "AE", arabic: "دبي" },
  { city: "Kuwait City", country: "KW", arabic: "مدينة الكويت" },
  { city: "Riyadh", country: "SA", arabic: "الرياض" },
  { city: "Doha", country: "QA", arabic: "الدوحة" },
];

export const worldCities: City[] = [
  { city: "London", country: "GB" },
  { city: "Paris", country: "FR" },
  { city: "New York", country: "US" },
  { city: "Tokyo", country: "JP" },
  { city: "Sydney", country: "AU" },
  { city: "Toronto", country: "CA" },
  { city: "Singapore", country: "SG" },
  { city: "Berlin", country: "DE" },
]; 