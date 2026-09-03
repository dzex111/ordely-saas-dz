export type Wilaya = {
  code: string;
  name: string;
  ar: string;
  zone: "north" | "highlands" | "south";
};

// 58 wilayas — official 2019 division. Zones drive delivery ETA & default pricing.
export const WILAYAS: Wilaya[] = [
  { code: "01", name: "Adrar", ar: "أدرار", zone: "south" },
  { code: "02", name: "Chlef", ar: "الشلف", zone: "north" },
  { code: "03", name: "Laghouat", ar: "الأغواط", zone: "highlands" },
  { code: "04", name: "Oum El Bouaghi", ar: "أم البواقي", zone: "highlands" },
  { code: "05", name: "Batna", ar: "باتنة", zone: "highlands" },
  { code: "06", name: "Béjaïa", ar: "بجاية", zone: "north" },
  { code: "07", name: "Biskra", ar: "بسكرة", zone: "highlands" },
  { code: "08", name: "Béchar", ar: "بشار", zone: "south" },
  { code: "09", name: "Blida", ar: "البليدة", zone: "north" },
  { code: "10", name: "Bouira", ar: "البويرة", zone: "north" },
  { code: "11", name: "Tamanrasset", ar: "تمنراست", zone: "south" },
  { code: "12", name: "Tébessa", ar: "تبسة", zone: "highlands" },
  { code: "13", name: "Tlemcen", ar: "تلمسان", zone: "north" },
  { code: "14", name: "Tiaret", ar: "تيارت", zone: "highlands" },
  { code: "15", name: "Tizi Ouzou", ar: "تيزي وزو", zone: "north" },
  { code: "16", name: "Alger", ar: "الجزائر", zone: "north" },
  { code: "17", name: "Djelfa", ar: "الجلفة", zone: "highlands" },
  { code: "18", name: "Jijel", ar: "جيجل", zone: "north" },
  { code: "19", name: "Sétif", ar: "سطيف", zone: "highlands" },
  { code: "20", name: "Saïda", ar: "سعيدة", zone: "highlands" },
  { code: "21", name: "Skikda", ar: "سكيكدة", zone: "north" },
  { code: "22", name: "Sidi Bel Abbès", ar: "سيدي بلعباس", zone: "north" },
  { code: "23", name: "Annaba", ar: "عنابة", zone: "north" },
  { code: "24", name: "Guelma", ar: "قالمة", zone: "north" },
  { code: "25", name: "Constantine", ar: "قسنطينة", zone: "north" },
  { code: "26", name: "Médéa", ar: "المدية", zone: "north" },
  { code: "27", name: "Mostaganem", ar: "مستغانم", zone: "north" },
  { code: "28", name: "M'Sila", ar: "المسيلة", zone: "highlands" },
  { code: "29", name: "Mascara", ar: "معسكر", zone: "north" },
  { code: "30", name: "Ouargla", ar: "ورقلة", zone: "south" },
  { code: "31", name: "Oran", ar: "وهران", zone: "north" },
  { code: "32", name: "El Bayadh", ar: "البيض", zone: "highlands" },
  { code: "33", name: "Illizi", ar: "إليزي", zone: "south" },
  { code: "34", name: "Bordj Bou Arréridj", ar: "برج بوعريريج", zone: "highlands" },
  { code: "35", name: "Boumerdès", ar: "بومرداس", zone: "north" },
  { code: "36", name: "El Tarf", ar: "الطارف", zone: "north" },
  { code: "37", name: "Tindouf", ar: "تندوف", zone: "south" },
  { code: "38", name: "Tissemsilt", ar: "تيسمسيلت", zone: "highlands" },
  { code: "39", name: "El Oued", ar: "الوادي", zone: "south" },
  { code: "40", name: "Khenchela", ar: "خنشلة", zone: "highlands" },
  { code: "41", name: "Souk Ahras", ar: "سوق أهراس", zone: "highlands" },
  { code: "42", name: "Tipaza", ar: "تيبازة", zone: "north" },
  { code: "43", name: "Mila", ar: "ميلة", zone: "north" },
  { code: "44", name: "Aïn Defla", ar: "عين الدفلى", zone: "north" },
  { code: "45", name: "Naâma", ar: "النعامة", zone: "highlands" },
  { code: "46", name: "Aïn Témouchent", ar: "عين تموشنت", zone: "north" },
  { code: "47", name: "Ghardaïa", ar: "غرداية", zone: "south" },
  { code: "48", name: "Relizane", ar: "غليزان", zone: "north" },
  { code: "49", name: "Timimoun", ar: "تيميمون", zone: "south" },
  { code: "50", name: "Bordj Badji Mokhtar", ar: "برج باجي مختار", zone: "south" },
  { code: "51", name: "Ouled Djellal", ar: "أولاد جلال", zone: "south" },
  { code: "52", name: "Béni Abbès", ar: "بني عباس", zone: "south" },
  { code: "53", name: "In Salah", ar: "عين صالح", zone: "south" },
  { code: "54", name: "In Guezzam", ar: "عين قزام", zone: "south" },
  { code: "55", name: "Touggourt", ar: "تقرت", zone: "south" },
  { code: "56", name: "Djanet", ar: "جانت", zone: "south" },
  { code: "57", name: "El M'Ghair", ar: "المغير", zone: "south" },
  { code: "58", name: "El Meniaa", ar: "المنيعة", zone: "south" },
];

export const wilayaByCode = (code: string) => WILAYAS.find((w) => w.code === code);

export const ZONE_ETA: Record<Wilaya["zone"], string> = {
  north: "24–48h",
  highlands: "48–72h",
  south: "3–5 jours",
};

// Algerian mobile: 05 / 06 / 07 + 8 digits. Accept +213 / 00213 prefixes and spaces.
export function normalizePhone(raw: string): string | null {
  let s = raw.replace(/[\s().-]/g, "");
  if (s.startsWith("+213")) s = "0" + s.slice(4);
  else if (s.startsWith("00213")) s = "0" + s.slice(5);
  else if (s.startsWith("213") && s.length === 12) s = "0" + s.slice(3);
  return /^0[567]\d{8}$/.test(s) ? s : null;
}

export function formatPhone(p: string) {
  return p.replace(/(\d{4})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4");
}
