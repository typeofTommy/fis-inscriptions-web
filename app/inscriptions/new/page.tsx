"use client";

import React from "react";
import {zodResolver} from "@hookform/resolvers/zod";
import {useForm, useFieldArray} from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
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
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {Button} from "@/components/ui/button";
import {MinusCircleIcon, PlusCircleIcon} from "lucide-react";
import {format} from "date-fns";
import {Calendar as CalendarIcon} from "lucide-react";
import {cn} from "@/lib/utils";
import {Calendar} from "@/components/ui/calendar";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Checkbox} from "@/components/ui/checkbox";
import {type inscriptions as InscriptionsTableType} from "@/drizzle/schemaInscriptions";
import {useRouter} from "next/navigation";

export const inscriptionFormSchema = z.object({
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
  codexNumbers: z
    .array(
      z.object({
        value: z
          .string()
          .regex(/^\d+$/, {message: "Chaque codex doit être un nombre."}),
      })
    )
    .min(1, {message: "Au moins un codex est requis."}),
  firstRaceDate: z.date({
    required_error: "La date de la première course est requise.",
  }),
  disciplines: z
    .array(z.string())
    .refine((value) => value.some((item) => item), {
      message: "Vous devez sélectionner au moins une discipline.",
    }),
  raceLevels: z
    .array(z.string())
    .refine((value) => value.some((item) => item), {
      message: "Vous devez sélectionner au moins un niveau de course.",
    }),
});

// Define discipline options
const disciplines = [
  {id: "SL", label: "Slalom (SL)"},
  {id: "GS", label: "Giant Slalom (GS)"},
  {id: "SG", label: "Super-G (SG)"},
  {id: "DH", label: "Downhill (DH)"},
  {id: "AC", label: "Alpine Combined (AC)"},
] as const; // Use 'as const' for stricter typing

// Define race level options
const raceLevels = [
  {id: "FIS", label: "FIS"},
  {id: "CIT", label: "CIT"},
  {id: "NJR", label: "NJR"},
  {id: "NJC", label: "NJC"},
  {id: "NC", label: "NC"},
  {id: "SAC", label: "SAC"},
  {id: "ANC", label: "ANC"},
  {id: "ENL", label: "ENL"},
] as const;

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

const NewInscriptionPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
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

  const {mutateAsync: createInscription, isPending} = useMutation({
    mutationFn: async (
      inscription: Omit<
        typeof InscriptionsTableType.$inferInsert,
        "id" | "createdAt"
      >
    ) => {
      const response = await fetch("/api/inscriptions", {
        method: "POST",
        body: JSON.stringify(inscription),
      });
      if (!response.ok) {
        throw new Error("Erreur lors de l'enregistrement de l'inscription");
      }
      return response.json();
    },
  });
  // Initialisation du formulaire avec React Hook Form
  const form = useForm<z.infer<typeof inscriptionFormSchema>>({
    resolver: zodResolver(inscriptionFormSchema),
    defaultValues: {
      email: "",
      fullName: "",
      country: "",
      location: "",
      eventLink: "",
      codexNumbers: [{value: ""}],
      firstRaceDate: undefined,
      disciplines: [],
      raceLevels: [],
    },
  });

  // Hook for managing dynamic codex fields
  const {fields, append, remove} = useFieldArray({
    control: form.control,
    name: "codexNumbers",
  });

  // Fonction de soumission du formulaire
  async function onSubmit(values: z.infer<typeof inscriptionFormSchema>) {
    try {
      const newInscription: Omit<
        typeof InscriptionsTableType.$inferInsert,
        "id" | "createdAt"
      > = {
        email: values.email,
        fullName: values.fullName,
        country: values.country,
        location: values.location,
        eventLink: values.eventLink,
        codexNumbers: values.codexNumbers.map((c) => c.value),
        firstRaceDate: values.firstRaceDate.toISOString(),
        disciplines: values.disciplines,
        raceLevels: values.raceLevels,
      };

      await createInscription(newInscription);

      toast({
        title: "Demande d'inscription enregistrée",
        description: "Votre demande a été sauvegardée avec succès.",
      });
      form.reset();
      router.push("/"); //todo redirect to the newly created inscription
      queryClient.invalidateQueries({queryKey: ["inscriptions"]});
    } catch (err) {
      console.error("Failed to insert inscription:", err);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la demande. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-xl font-semibold text-[#3d7cf2] text-center mb-6">
          Nouvelle Demande d&apos;Inscription
        </h1>
        <p className="text-lg text-gray-500 mb-6 flex justify-center">
          Le formulaire d&apos;inscription sera envoyé à l&apos;organisateur au
          plus tard 36 heurs avant le 1er TCM (8 jours pour NJC ou NC, délai
          règlementaire pour une demande d&apos;invitation en NC)
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({field}) => (
                <FormItem>
                  <FormLabel className="text-base text-[#3d7cf2]">
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
                  <FormLabel className="text-base text-[#3d7cf2]">
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
                  <FormLabel className="text-base text-[#3d7cf2]">
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
                  <FormLabel className="text-base text-[#3d7cf2]">
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
                  <FormLabel className="text-base text-[#3d7cf2]">
                    Lien évènement <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="ex: https://beta.fis-ski.com/DB/general/event-details.html?sectorcode=AL&eventid=54647&seasoncode=2024"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />

            {/* Codex Dynamic Fields */}
            <div className="space-y-2">
              <FormLabel className="text-base text-[#3d7cf2]">
                Codex <span className="text-red-500">*</span>
              </FormLabel>
              {fields.map((field, index) => (
                <FormField
                  key={field.id}
                  control={form.control}
                  name={`codexNumbers.${index}.value`}
                  render={({field: itemField}) => (
                    <FormItem>
                      <div className="flex items-center space-x-2">
                        <FormControl>
                          <Input placeholder="1234" {...itemField} />
                        </FormControl>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                          >
                            <MinusCircleIcon className="h-5 w-5 text-red-500" />
                          </Button>
                        )}
                        {index === fields.length - 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => append({value: ""})}
                          >
                            <PlusCircleIcon className="h-5 w-5 text-green-500" />
                          </Button>
                        )}
                      </div>
                      <FormMessage className="text-red-500 text-sm" />
                    </FormItem>
                  )}
                />
              ))}
              {/* Move description outside the loop to appear only once */}
              <FormDescription className="text-base mt-1">
                Préciser <span className="font-bold">tous les CODEX</span> de
                l&apos;évènement qui concernent la demande
              </FormDescription>
              {/* Display top-level error message for the array field if necessary */}
              <FormField
                control={form.control}
                name="codexNumbers"
                render={() => <FormMessage className="text-red-500 text-sm" />}
              />
            </div>
            {/* End Codex Dynamic Fields */}

            {/* Date Picker */}
            <FormField
              control={form.control}
              name="firstRaceDate"
              render={({field}) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-base text-[#3d7cf2]">
                    Date de la 1ère course{" "}
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Choisissez une date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />
            {/* End Date Picker */}

            {/* Disciplines Checkboxes */}
            <FormField
              control={form.control}
              name="disciplines"
              render={({field}) => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base text-[#3d7cf2]">
                      Disciplines demandées{" "}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormDescription className="text-base">
                      Sélectionnez les disciplines concernées.
                    </FormDescription>
                  </div>
                  {/* Flex container for the checkboxes */}
                  <div className="flex flex-row flex-wrap gap-x-6 gap-y-3">
                    {disciplines.map((item) => (
                      // Each checkbox is its own FormItem for layout/accessibility
                      <FormItem
                        key={item.id}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([
                                    ...(field.value || []),
                                    item.id,
                                  ])
                                : field.onChange(
                                    (field.value || []).filter(
                                      (value) => value !== item.id
                                    )
                                  );
                            }}
                          />
                        </FormControl>
                        {/* Use a standard label associated with the checkbox */}
                        <FormLabel className="font-normal text-base">
                          {" "}
                          {/* Adjusted font size */}
                          {item.id}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </div>
                  {/* Error message for the group */}
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />
            {/* End Disciplines Checkboxes */}

            {/* Race Level Checkboxes */}
            <FormField
              control={form.control}
              name="raceLevels"
              render={({field}) => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base text-[#3d7cf2]">
                      Level Race <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormDescription className="text-base">
                      Précisez bien car il peut y avoir plusieurs niveaux dans
                      le même évènement... ex: FIS+NJR
                    </FormDescription>
                  </div>
                  {/* Flex container for the checkboxes */}
                  <div className="flex flex-row flex-wrap gap-x-6 gap-y-3">
                    {raceLevels.map((item) => (
                      <FormItem
                        key={item.id}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([
                                    ...(field.value || []),
                                    item.id,
                                  ])
                                : field.onChange(
                                    (field.value || []).filter(
                                      (value) => value !== item.id
                                    )
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal text-base">
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </div>
                  {/* Error message for the group */}
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />
            {/* End Race Level Checkboxes */}

            {/* Info text about next step */}
            <p className="text-base text-center text-gray-600 mt-4 mb-2">
              La liste des coureurs sera renseignée à la prochaine étape.
            </p>

            <div className="flex justify-center mt-6">
              <button
                type="submit"
                className="bg-[#3d7cf2] hover:bg-[#3369d6] text-white px-8 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={isPending}
              >
                {isPending ? "Soumission en cours..." : "Soumettre"}
              </button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default NewInscriptionPage;
