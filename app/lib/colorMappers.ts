export const colorBadgePerDiscipline: Record<string, string> = {
  SL: "bg-blue-500 text-white",
  GS: "bg-pink-500 text-white",
  SG: "bg-green-500 text-white",
  DH: "bg-yellow-300 text-black",
  AC: "bg-black text-white",
};

export const pdfHeaderColorPerDiscipline: Record<string, string> = {
  SL: "bg-blue-100 text-blue-800",
  GS: "bg-pink-100 text-pink-800",
  SG: "bg-green-100 text-green-800",
  DH: "bg-yellow-100 text-yellow-800",
  AC: "bg-gray-200 text-gray-800",
};

export const colorBadgePerRaceLevel: Record<string, string> = {
  FIS: "bg-black text-white",
  CIT: "bg-orange-500 text-white",
  NJR: "bg-yellow-500 text-black",
  NJC: "bg-red-500 text-white",
  NC: "bg-red-500 text-white",
  SAC: "bg-indigo-600 text-white",
  ANC: "bg-gray-500 text-white",
  ENL: "bg-purple-500 text-white",
  WC: "bg-yellow-700 text-white",
  SACK: "bg-green-600 text-white", // Ajout de SACK
  FIZZ: "bg-cyan-600 text-white",  // Ajout de FIZZ (qui pourrait être une variante)
};

export const colorBadgePerGender: Record<"M" | "W", string> = {
  M: "bg-blue-900",
  W: "bg-purple-500",
};
