"use client";

import React from "react";
import {zodResolver} from "@hookform/resolvers/zod";
import {useForm} from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {toast} from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import {useQuery} from "@tanstack/react-query";

// Type pour les données de pays
interface Country {
  name: {
    common: string;
  };
  cca2: string;
  flags: {
    svg: string;
    png: string;
  };
}

// Fonction pour récupérer les pays
const fetchCountries = async (): Promise<Country[]> => {
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

// Définition du schéma de validation
const formSchema = z.object({
  email: z.string().email({
    message: "Veuillez entrer une adresse email valide.",
  }),
  fullName: z.string().min(2, {
    message: "Le nom et prénom doivent contenir au moins 2 caractères.",
  }),
  country: z.string({
    required_error: "Veuillez sélectionner un pays.",
  }),
  location: z.string().min(2, {
    message: "Le lieu de compétition doit contenir au moins 2 caractères.",
  }),
  eventLink: z.string().url({
    message: "Veuillez entrer une URL valide.",
  }),
});

const NewInscriptionPage = () => {
  const {
    data: countries = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
    staleTime: 1000 * 60 * 60, // 1 heure
    refetchOnWindowFocus: false,
  });

  // Initialisation du formulaire avec React Hook Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      fullName: "",
      country: "",
      location: "",
      eventLink: "",
    },
  });

  // Fonction de soumission du formulaire
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Afficher les valeurs soumises (à remplacer par la logique d'envoi au serveur)
    console.log(values);

    // Trouver le nom du pays sélectionné
    const selectedCountry = countries.find(
      (country) => country.cca2 === values.country
    );
    const countryName = selectedCountry
      ? selectedCountry.name.common
      : values.country;

    toast({
      title: "Demande d'inscription soumise",
      description: `Email: ${values.email}, Nom: ${values.fullName}, Pays: ${countryName}, Lieu: ${values.location}, Lien: ${values.eventLink}`,
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-xl font-semibold text-[#3d7cf2] text-center mb-6">
          Nouvelle Demande d&apos;Inscription
        </h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({field}) => (
                <FormItem>
                  <FormLabel className="text-[#3d7cf2]">
                    Email <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="votre@email.com" {...field} />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fullName"
              render={({field}) => (
                <FormItem>
                  <FormLabel className="text-[#3d7cf2]">
                    Nom et prénom <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Jean Dupont" {...field} />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({field}) => (
                <FormItem>
                  <FormLabel className="text-[#3d7cf2]">
                    Lieu de compétition <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nom de la station" {...field} />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({field}) => (
                <FormItem>
                  <FormLabel className="text-[#3d7cf2]">
                    Pays <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionnez un pays" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[300px]">
                      {isLoading ? (
                        <div className="px-2 py-4 text-center">
                          Chargement des pays...
                        </div>
                      ) : error ? (
                        <div className="px-2 py-4 text-center text-red-500">
                          Erreur de chargement
                        </div>
                      ) : (
                        <>
                          {(() => {
                            const frequentCountryCodes = [
                              "AD",
                              "AR",
                              "AT",
                              "BE",
                              "CL",
                              "CA",
                              "ES",
                              "GB",
                              "DE",
                              "FI",
                              "FR",
                              "IT",
                              "NZ",
                              "NO",
                              "SI",
                              "CH",
                              "SE",
                              "US",
                            ]; // Updated list
                            const frequentCountries = countries
                              .filter((country) =>
                                frequentCountryCodes.includes(country.cca2)
                              )
                              .sort((a, b) =>
                                a.name.common.localeCompare(b.name.common)
                              ); // Sort frequent countries too

                            const otherCountries = countries.filter(
                              (country) =>
                                !frequentCountryCodes.includes(country.cca2)
                            ); // Already sorted alphabetically from fetch

                            return (
                              <>
                                {frequentCountries.length > 0 && (
                                  <SelectGroup>
                                    <SelectLabel className="text-gray-500">
                                      Pays fréquents
                                    </SelectLabel>
                                    {frequentCountries.map((country) => (
                                      <SelectItem
                                        key={country.cca2}
                                        value={country.cca2}
                                        className="flex items-center gap-2"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Image
                                            src={country.flags.svg}
                                            alt={`Drapeau ${country.name.common}`}
                                            width={20}
                                            height={15}
                                            className="rounded"
                                          />
                                          {country.name.common}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                )}
                                <SelectGroup>
                                  <SelectLabel className="text-gray-500">
                                    Autres pays
                                  </SelectLabel>
                                  {otherCountries.map((country) => (
                                    <SelectItem
                                      key={country.cca2}
                                      value={country.cca2}
                                      className="flex items-center gap-2"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Image
                                          src={country.flags.svg}
                                          alt={`Drapeau ${country.name.common}`}
                                          width={20}
                                          height={15}
                                          className="rounded"
                                        />
                                        {country.name.common}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </>
                            );
                          })()}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eventLink"
              render={({field}) => (
                <FormItem>
                  <FormLabel className="text-[#3d7cf2]">
                    Lien évènement <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://beta.fis-ski.com/DB/general/event-details.html"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />

            <div className="flex justify-center mt-6">
              <button
                type="submit"
                className="bg-[#3d7cf2] hover:bg-[#3369d6] text-white px-8 py-2 rounded"
              >
                Soumettre
              </button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default NewInscriptionPage;
