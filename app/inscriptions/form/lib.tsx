import {Country} from "@/app/types";
import {useEffect, useState} from "react";

// Fonction pour récupérer les pays
export const fetchCountries = async (): Promise<Country[]> => {
  const response = await fetch(
    "https://restcountries.com/v3.1/all?fields=name,flags,cca2"
  );
  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des pays");
  }
  const data = await response.json();
  // Trier les pays par ordre alphabétique
  return data.sort((a: Country, b: Country) =>
    a.name.common.localeCompare(b.name.common)
  );
};

// Hook utilitaire pour debounce
export const useDebouncedValue = <T,>(value: T, delay: number) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
};
