import {useCountries} from "@/app/inscriptions/form/api";
import {alpha3ToAlpha2} from "@/app/lib/countryMapper";
import type {Country} from "@/app/types";

interface CountryInfo {
  flagUrl?: string;
  countryLabel: string;
}

export const useCountryInfo = (countryCode?: string | null): CountryInfo => {
  const {data: countries} = useCountries();

  if (!countryCode || countryCode === "Non renseigné" || !countries) {
    return {countryLabel: countryCode || "Non renseigné"};
  }

  const alpha2 = alpha3ToAlpha2(countryCode) ?? countryCode;
  const foundCountry = countries.find((c: Country) => c.cca2 === alpha2);

  return {
    flagUrl: foundCountry?.flags?.svg,
    countryLabel: foundCountry?.name?.common || countryCode,
  };
};
