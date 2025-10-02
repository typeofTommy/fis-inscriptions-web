"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

type Locale = "en" | "fr" | "es";

const locales: { value: Locale; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "fr", label: "Français", flag: "🇫🇷" },
  { value: "es", label: "Español", flag: "🇪🇸" },
];

const getDefaultLocale = (): Locale => {
  // Read from cookie
  if (typeof document !== "undefined") {
    const cookieValue = document.cookie
      .split("; ")
      .find((row) => row.startsWith("locale="))
      ?.split("=")[1];
    if (cookieValue && ["en", "fr", "es"].includes(cookieValue)) {
      return cookieValue as Locale;
    }
  }
  return "en";
};

export const LanguageSwitcher = () => {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const currentLocale = getDefaultLocale();

  const handleLocaleChange = (newLocale: string) => {
    // Set cookie
    document.cookie = `locale=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`; // 1 year

    // Refresh the page to apply the new locale
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <Select value={currentLocale} onValueChange={handleLocaleChange}>
      <SelectTrigger className="w-[160px] cursor-pointer">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((locale) => (
          <SelectItem
            key={locale.value}
            value={locale.value}
            className="cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span>{locale.flag}</span>
              <span>{locale.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
