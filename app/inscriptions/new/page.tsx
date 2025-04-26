"use client";

import React, {useEffect, useState} from "react";
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
  SelectItem,
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
import {type inscriptions as InscriptionsTableType} from "@/drizzle/schemaInscriptions";
import {useRouter} from "next/navigation";
import {useUser} from "@clerk/nextjs";
import {Combobox, ComboboxOption} from "@/components/ui/combobox";
import {CheckCircle2, XCircle, Loader2} from "lucide-react";

const inscriptionFormSchema = z.object({
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
        number: z
          .string()
          .regex(/^[0-9]+$/, {message: "Chaque codex doit être un nombre."}),
        sex: z.enum(["M", "F"], {required_error: "Le sexe est requis."}),
        discipline: z.string().min(1, {message: "La discipline est requise."}),
        raceLevel: z
          .string()
          .min(1, {message: "Le niveau de course est requis."}),
      })
    )
    .min(1, {message: "Au moins un codex est requis."}),
  firstRaceDate: z.date({
    required_error: "La date de la première course est requise.",
  }),
  lastRaceDate: z.date({
    required_error: "La date de la dernière course est requise.",
  }),
  customStation: z.string().optional(),
});

// Define discipline options
const disciplines = [
  {id: "SL", label: "SL"},
  {id: "GS", label: "GS"},
  {id: "SG", label: "SG"},
  {id: "DH", label: "DH"},
  {id: "AC", label: "AC"},
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

// Hook utilitaire pour debounce
function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  React.useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

// Hook pour vérifier un codex
function useCodexCheck(codex: string) {
  const debouncedCodex = useDebouncedValue(codex, 400);
  const query = useQuery({
    queryKey: ["codex-check", debouncedCodex],
    queryFn: async () => {
      if (!debouncedCodex || debouncedCodex.length < 3) return {exists: false};
      const res = await fetch(
        `/api/codex/check?number=${encodeURIComponent(debouncedCodex)}`
      );
      if (!res.ok) throw new Error("Erreur API");
      return res.json();
    },
    enabled: !!debouncedCodex && debouncedCodex.length >= 3,
    staleTime: 1000 * 60,
  });
  return {...query, debouncedCodex};
}

// Composant enfant pour un champ codex
function CodexField({
  index,
  form,
  onDuplicateChange,
  remove,
  fieldsLength,
}: {
  index: number;
  form: any;
  onDuplicateChange: (index: number, isDuplicate: boolean) => void;
  remove: (index: number) => void;
  fieldsLength: number;
}) {
  const codex = form.watch(`codexNumbers.${index}.number`);
  const {
    data: codexCheck,
    isLoading: codexChecking,
    debouncedCodex,
  } = useCodexCheck(codex);
  useEffect(() => {
    onDuplicateChange(
      index,
      !!(debouncedCodex && debouncedCodex.length >= 3 && codexCheck?.exists)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedCodex, codexCheck, index]);
  return (
    <div className="border p-2 rounded-md bg-gray-50">
      <div className="flex justify-between items-end w-full">
        <div className="flex items-center gap-x-6 flex-wrap">
          <FormField
            control={form.control}
            name={`codexNumbers.${index}.number`}
            render={({field: itemField}) => (
              <FormItem className="flex-1 relative">
                <FormLabel>Codex</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input placeholder="ex: 1234" {...itemField} />
                    {/* Indicateur visuel à droite */}
                    <span className="absolute right-2 top-1/2 -translate-y-1/2">
                      {codexChecking ? (
                        <Loader2 className="animate-spin text-gray-400 w-5 h-5" />
                      ) : debouncedCodex && debouncedCodex.length >= 3 ? (
                        codexCheck?.exists ? (
                          <XCircle className="text-red-500 w-5 h-5" />
                        ) : (
                          <CheckCircle2 className="text-green-500 w-5 h-5" />
                        )
                      ) : null}
                    </span>
                  </div>
                </FormControl>
                <FormMessage className="text-red-500 text-sm" />
                {/* Message d'erreur + lien si doublon */}
                {debouncedCodex &&
                  debouncedCodex.length >= 3 &&
                  codexCheck?.exists &&
                  codexCheck.inscriptionId && (
                    <div className="text-red-600 text-xs mt-1">
                      Ce codex est déjà présent dans une{" "}
                      <a
                        href={`/inscriptions/${codexCheck.inscriptionId}`}
                        className="underline text-blue-600"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        autre l&apos;inscription
                      </a>
                    </div>
                  )}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`codexNumbers.${index}.sex`}
            render={({field: sexField}) => (
              <FormItem className="flex-1">
                <FormLabel>Sexe</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={sexField.onChange}
                    value={sexField.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sexe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="F">F</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage className="text-red-500 text-sm" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`codexNumbers.${index}.discipline`}
            render={({field: disciplineField}) => (
              <FormItem className="flex-1">
                <FormLabel>Discipline</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={disciplineField.onChange}
                    value={disciplineField.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Discipline" />
                    </SelectTrigger>
                    <SelectContent>
                      {disciplines.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage className="text-red-500 text-sm" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`codexNumbers.${index}.raceLevel`}
            render={({field: raceLevelField}) => (
              <FormItem className="flex-1">
                <FormLabel>Race Level</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={raceLevelField.onChange}
                    value={raceLevelField.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Race Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {raceLevels.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage className="text-red-500 text-sm" />
              </FormItem>
            )}
          />
        </div>
        {fieldsLength > 1 && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="flex items-center gap-2 text-red-700 border-red-500 hover:bg-red-50 cursor-pointer"
            onClick={() => remove(index)}
          >
            <MinusCircleIcon className="h-5 w-5 text-red-500 " />
            Supprimer
          </Button>
        )}
      </div>
    </div>
  );
}

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

  const {user} = useUser();

  const {
    data: stations = [],
    isLoading: stationsLoading,
    error: stationsError,
  } = useQuery({
    queryKey: ["stations"],
    queryFn: () => fetch("/api/stations").then((res) => res.json()),
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
      codexNumbers: [
        {number: "", sex: "M", discipline: "SL", raceLevel: "FIS"},
      ],
      firstRaceDate: undefined,
      lastRaceDate: undefined,
      customStation: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.setValue("email", user.emailAddresses[0].emailAddress || "");
      form.setValue("fullName", user.fullName || "");
    }
  }, [user, form]);

  // Hook for managing dynamic codex fields
  const {fields, append, remove} = useFieldArray({
    control: form.control,
    name: "codexNumbers",
  });

  // Etat pour suivre les doublons codex
  const [codexDuplicates, setCodexDuplicates] = useState<boolean[]>([]);
  // Callback pour mettre à jour l'état de doublon d'un champ
  const handleCodexDuplicateChange = (index: number, isDuplicate: boolean) => {
    setCodexDuplicates((prev) => {
      const arr = [...prev];
      arr[index] = isDuplicate;
      return arr;
    });
  };

  // Use form.watch to get the current location value
  const locationValue = form.watch("location");
  const isOtherStation = locationValue === "__autre__";

  // When submitting, if 'Autre' is selected, use customStation from form values
  async function onSubmit(
    values: z.infer<typeof inscriptionFormSchema> & {customStation?: string}
  ) {
    try {
      const locationValue =
        values.location === "__autre__"
          ? values.customStation || ""
          : values.location || "";
      const newInscription = {
        email: values.email,
        fullName: values.fullName,
        country: values.country,
        location: locationValue,
        eventLink: values.eventLink,
        codexData: values.codexNumbers,
        firstRaceDate: values.firstRaceDate.toISOString(),
        lastRaceDate: values.lastRaceDate.toISOString(),
      };

      const {inscription: returnedInscription} = await createInscription(
        newInscription
      );

      toast({
        title: "Demande d'inscription enregistrée",
        description: "Votre demande a été sauvegardée avec succès.",
      });
      form.reset();
      router.push(`/inscriptions/${returnedInscription.id}`);
      queryClient.invalidateQueries({queryKey: ["inscriptions"]});
      queryClient.invalidateQueries({queryKey: ["stations"]});
    } catch (err) {
      console.error("Failed to insert inscription:", err);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la demande. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  }

  // State for country search
  const [countrySearch] = React.useState("");

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
          <form
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
              console.log("ZOD ERRORS", errors);
            })}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="location"
              render={({field}) => (
                <FormItem>
                  <FormLabel className="text-base text-[#3d7cf2]">
                    Lieu de compétition <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        if (val !== "__autre__") {
                          // Préremplir le pays selon la station sélectionnée
                          const selectedStation = stations.find(
                            (s: {id: number; name: string; country: string}) =>
                              s.name === val
                          );
                          if (selectedStation && selectedStation.country) {
                            form.setValue("country", selectedStation.country);
                          }
                          (form.setValue as any)("customStation", "");
                        } else {
                          // Si "Autre" est choisi, vider le pays
                          form.setValue("country", "");
                        }
                      }}
                      value={field.value}
                      defaultValue={field.value}
                      disabled={!!stationsLoading || !!stationsError}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            stationsLoading
                              ? "Chargement..."
                              : "Sélectionnez une station"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {stationsLoading ? (
                          <div className="px-2 py-4 text-center">
                            Chargement des stations...
                          </div>
                        ) : stationsError ? (
                          <div className="px-2 py-4 text-center text-red-500">
                            Erreur de chargement
                          </div>
                        ) : (
                          <>
                            {stations
                              .slice()
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map((station: {id: number; name: string}) => (
                                <SelectItem
                                  key={station.id}
                                  value={station.name}
                                >
                                  {station.name.charAt(0).toUpperCase() +
                                    station.name.slice(1)}
                                </SelectItem>
                              ))}
                            <SelectItem value="__autre__">Autre...</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  {isOtherStation && (
                    <FormField
                      control={form.control}
                      name="customStation"
                      render={({field}) => (
                        <FormItem className="mt-2">
                          <FormControl>
                            <Input
                              placeholder="Nom de la station"
                              {...field}
                              required
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({field}) => {
                // Prépare les options pour la Combobox
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
                ];
                const filterFn = (country: Country) =>
                  country.name.common
                    .toLowerCase()
                    .includes(countrySearch.toLowerCase());
                const frequentCountries = countries
                  .filter((country) =>
                    frequentCountryCodes.includes(country.cca2)
                  )
                  .filter(filterFn)
                  .sort((a, b) => a.name.common.localeCompare(b.name.common));
                const otherCountries = countries
                  .filter(
                    (country) => !frequentCountryCodes.includes(country.cca2)
                  )
                  .filter(filterFn);
                // Construit la liste des options (avec un séparateur virtuel)
                const options: ComboboxOption[] = [
                  ...frequentCountries.map((country) => ({
                    value: country.name.common,
                    label: country.name.common,
                    icon: (
                      <Image
                        src={country.flags.svg}
                        alt={country.name.common}
                        width={20}
                        height={15}
                        className="rounded"
                      />
                    ),
                  })),
                  ...(frequentCountries.length && otherCountries.length
                    ? [{value: "__separator__", label: "", icon: null}]
                    : []),
                  ...otherCountries.map((country) => ({
                    value: country.cca2,
                    label: country.name.common,
                    icon: (
                      <Image
                        src={country.flags.svg}
                        alt={country.name.common}
                        width={20}
                        height={15}
                        className="rounded"
                      />
                    ),
                  })),
                ];
                return (
                  <FormItem>
                    <FormLabel className="text-base text-[#3d7cf2]">
                      Pays <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Combobox
                        options={options.filter(
                          (o) => o.value !== "__separator__"
                        )}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Sélectionnez un pays"
                        disabled={isLoading || !!error}
                        renderOption={(option) => (
                          <div className="flex items-center gap-2">
                            {option.icon}
                            {option.label}
                          </div>
                        )}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm" />
                  </FormItem>
                );
              }}
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
                <CodexField
                  key={field.id}
                  index={index}
                  form={form}
                  onDuplicateChange={handleCodexDuplicateChange}
                  remove={remove}
                  fieldsLength={fields.length}
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

            {/* Bouton Ajouter un autre codex sous la liste */}
            <div className="flex justify-center mt-2">
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-2 text-green-700 border-green-500 hover:bg-green-50  cursor-pointer"
                onClick={() =>
                  append({
                    number: "",
                    sex: "M",
                    discipline: "SL",
                    raceLevel: "FIS",
                  })
                }
              >
                <PlusCircleIcon className="h-5 w-5 text-green-500" />
                Ajouter un autre codex
              </Button>
            </div>

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
                            format(field.value, "dd/MM/yyyy")
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
                        fromDate={new Date()}
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                        weekStartsOn={1}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />
            {/* End Date Picker */}

            {/* Last Race Date Picker */}
            <FormField
              control={form.control}
              name="lastRaceDate"
              render={({field}) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-base text-[#3d7cf2]">
                    Date de la dernière course{" "}
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
                            format(field.value, "dd/MM/yyyy")
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
                        fromDate={form.watch("firstRaceDate")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-red-500 text-sm" />
                </FormItem>
              )}
            />
            {/* End Last Race Date Picker */}

            {/* Info text about next step */}
            <p className="text-base text-center text-gray-600 mt-4 mb-2">
              La liste des coureurs sera renseignée à la prochaine étape.
            </p>

            <div className="flex justify-center mt-6">
              <button
                type="submit"
                className="bg-[#3d7cf2] hover:bg-[#3369d6] text-white px-8 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={isPending || codexDuplicates.some(Boolean)}
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
