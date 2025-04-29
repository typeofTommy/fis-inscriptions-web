"use client";

import {toast} from "@/components/ui/use-toast";
import {useUser} from "@clerk/nextjs";
import {zodResolver} from "@hookform/resolvers/zod";
import {useQueryClient} from "@tanstack/react-query";
import React, {useEffect, useState} from "react";
import {useFieldArray, useForm, Controller} from "react-hook-form";
import {z} from "zod";
import {
  useCountries,
  useCreateInscription,
  useStations,
  useUpdateInscription,
} from "./api";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {Combobox, ComboboxOption} from "@/components/ui/combobox";
import Image from "next/image";
import {Button} from "@/components/ui/button";
import {CodexField} from "./CodexField";
import {CalendarIcon, PlusCircleIcon, Loader2} from "lucide-react";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {cn} from "@/lib/utils";
import {format} from "date-fns";
import {Calendar} from "@/components/ui/calendar";
import {useRouter} from "next/navigation";
import {Inscription, Station} from "@/app/types";
import {Country} from "@/app/types";
import {parseLocalDate} from "@/app/lib/dates";

export const InscriptionFormWrapper = ({
  mode,
  inscription,
  onSuccess,
  ...props
}:
  | {mode: "edit"; inscription: Inscription; onSuccess?: () => void}
  | {mode: "new"; inscription?: never; onSuccess?: never}) => {
  const isEdit = mode === "edit";

  const {
    data: stations,
    isLoading: stationsLoading,
    error: stationsError,
  } = useStations();

  const {
    data: countries,
    isLoading: countriesLoading,
    error: countriesError,
  } = useCountries();

  if (stationsLoading || countriesLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <p>Chargement des données du formulaire...</p>
      </div>
    );
  }
  return (
    <InscriptionFormInner
      key={isEdit ? "edit " + inscription?.id : "new"}
      mode={mode}
      inscription={inscription}
      stations={stations}
      stationsLoading={stationsLoading}
      stationsError={stationsError}
      countries={countries || []}
      countriesLoading={countriesLoading}
      countriesError={countriesError}
      onSuccess={onSuccess}
      {...props}
    />
  );
};

const InscriptionFormInner = ({
  mode,
  inscription,
  stations,
  stationsLoading,
  stationsError,
  countries,
  countriesLoading,
  countriesError,
  onSuccess,
}: {
  mode: "edit" | "new";
  inscription: Inscription | undefined;
  stations: Station[];
  stationsLoading: boolean;
  stationsError: Error | null;
  countries: Country[];
  countriesLoading: boolean;
  countriesError: Error | null;
  onSuccess?: () => void;
}) => {
  const {user, isLoaded} = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const {createInscription} = useCreateInscription();
  const {updateInscription} = useUpdateInscription();
  const isEdit = mode === "edit";

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
      createdBy: user?.id || "",
    },
  });

  // Mise à jour des valeurs du formulaire quand l'inscription est chargée
  useEffect(() => {
    if (isEdit && inscription && !stationsLoading) {
      // Vérifier si la station existe dans la liste
      const stationExists = stations.some(
        (s) => s.name.toLowerCase() === inscription.location.toLowerCase()
      );
      const matchingStation = stations.find(
        (s) => s.name.toLowerCase() === inscription.location.toLowerCase()
      );
      const locationValue = matchingStation
        ? matchingStation.name?.toLowerCase()
        : inscription.location.toLowerCase();

      form.reset({
        email: inscription.email,
        fullName: inscription.fullName,
        createdBy: inscription.createdBy,
        country: inscription.country,
        eventLink: inscription.eventLink,
        codexNumbers: Array.isArray(inscription.codexData)
          ? inscription.codexData
          : [inscription.codexData],
        firstRaceDate: parseLocalDate(inscription.firstRaceDate),
        lastRaceDate: parseLocalDate(inscription.lastRaceDate),
        location: stationExists
          ? locationValue.toLowerCase()
          : inscription.location.toLowerCase() || "__autre__",
        customStation: stationExists ? "" : inscription.location.toLowerCase(),
      });
    }
  }, [isEdit, inscription, stations, stationsLoading, form]);

  // Effet pour mettre à jour le champ createdBy quand l'utilisateur est chargé
  useEffect(() => {
    if (user?.id) {
      form.setValue("createdBy", user.id);
      form.setValue("fullName", user.fullName!);
      form.setValue("email", user.emailAddresses[0].emailAddress);
    }
  }, [user, form]);

  const onSubmit = async (
    values: z.infer<typeof inscriptionFormSchema> & {customStation?: string}
  ) => {
    try {
      let finalLocation = values.location.toLowerCase();
      if (values.location === "__autre__") {
        if (!values.customStation || values.customStation.trim().length < 2) {
          toast({
            title: "Erreur",
            description: "Merci de renseigner un nom de station valide.",
            variant: "destructive",
          });
          return;
        }
        finalLocation = values.customStation.trim().toLowerCase();
      }

      const newInscription = {
        email: values.email,
        fullName: values.fullName,
        country: values.country,
        location: finalLocation.toLowerCase(),
        eventLink: values.eventLink,
        codexData: values.codexNumbers,
        firstRaceDate: values.firstRaceDate.toISOString(),
        lastRaceDate: values.lastRaceDate.toISOString(),
        createdBy: values.createdBy,
        id: inscription?.id,
      };

      let returnedInscription;

      if (isEdit) {
        returnedInscription = await updateInscription.mutateAsync(
          newInscription
        );
        queryClient.setQueryData(
          ["inscriptions", inscription?.id],
          returnedInscription
        );
      } else {
        returnedInscription = await createInscription.mutateAsync(
          newInscription
        );
      }

      toast({
        title: isEdit
          ? "Demande d'inscription mise à jour"
          : "Demande d'inscription enregistrée",
        description: "Votre demande a été sauvegardée avec succès.",
      });

      form.reset();
      queryClient.invalidateQueries({queryKey: ["inscriptions"]});

      if (!isEdit) {
        queryClient.invalidateQueries({queryKey: ["stations"]});
        router.push(`/inscriptions/${returnedInscription.inscription.id}`);
      }

      onSuccess?.();
    } catch (err) {
      console.error("Failed to insert inscription:", err);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la demande. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const [codexDuplicates, setCodexDuplicates] = useState<boolean[]>([]);

  const handleCodexDuplicateChange = (index: number, isDuplicate: boolean) => {
    setCodexDuplicates((prev) => {
      const arr = [...prev];
      arr[index] = isDuplicate;
      return arr;
    });
  };

  useEffect(() => {
    if (isLoaded && !user) {
      router.replace("/");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <p>Chargement de la session utilisateur...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl mt-10 text-center text-lg text-red-500">
        Vous devez être connecté pour accéder à la création de demande.
      </div>
    );
  }

  if (stationsLoading || countriesLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <p>Chargement des données du formulaire...</p>
      </div>
    );
  }

  if (stationsError || countriesError) {
    return (
      <div className="mx-auto max-w-2xl mt-10 text-center text-lg text-red-500">
        Une erreur est survenue lors du chargement des données. Veuillez
        rafraîchir la page.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="bg-white p-6 rounded-lg shadow">
        {isEdit ? (
          <h1 className="text-xl font-semibold text-[#3d7cf2] text-center mb-6">
            Modifier la demande d&apos;inscription
          </h1>
        ) : (
          <h1 className="text-xl font-semibold text-[#3d7cf2] text-center mb-6">
            Nouvelle Demande d&apos;Inscription
          </h1>
        )}
        {!isEdit && (
          <p className="text-lg text-gray-500 mb-6 flex justify-center">
            Le formulaire d&apos;inscription sera envoyé à l&apos;organisateur
            au plus tard 36 heurs avant le 1er TCM (8 jours pour NJC ou NC,
            délai règlementaire pour une demande d&apos;invitation en NC)
          </p>
        )}

        <Form {...form} key={inscription?.id || "new"}>
          <form
            onSubmit={form.handleSubmit(onSubmit, (errors, values) => {
              console.log("ZOD ERRORS", errors, values);
            })}
            className="space-y-6"
          >
            <Controller
              name="location"
              control={form.control}
              render={({field}) => (
                <FormItem>
                  <FormLabel className="text-base text-[#3d7cf2]">
                    Lieu de compétition <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Select
                      value={field.value.toLowerCase()}
                      onValueChange={(value) => {
                        field.onChange(value?.toLowerCase()); // 🛡️ Propage dans RHF
                        const selectedStation = stations
                          .map((s) => ({
                            ...s,
                            name: s.name.toLowerCase(),
                          }))
                          .find((s) => s.name === value.toLowerCase());
                        if (selectedStation) {
                          form.setValue("country", selectedStation.country);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une station" />
                      </SelectTrigger>
                      <SelectContent>
                        {stations
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((station) => (
                            <SelectItem
                              key={station.id}
                              value={station.name.toLowerCase()}
                            >
                              {station.name[0].toUpperCase() +
                                station.name.slice(1)}
                            </SelectItem>
                          ))}
                        <SelectItem value="__autre__">Autre...</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>

                  <FormField
                    name="customStation"
                    control={form.control}
                    render={({field}) => (
                      <div
                        className={
                          form.watch("location") === "__autre__" ? "" : "hidden"
                        }
                      >
                        <Input
                          {...field}
                          placeholder="Nom de la station"
                          value={field.value?.toLowerCase() || ""}
                        />
                      </div>
                    )}
                  />
                  <FormMessage />
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

                const frequentCountries = (countries || [])
                  .filter((country: Country) =>
                    frequentCountryCodes.includes(country.cca2)
                  )
                  .sort((a: Country, b: Country) =>
                    a.name.common.localeCompare(b.name.common)
                  );
                const otherCountries = (countries || []).filter(
                  (country: Country) =>
                    !frequentCountryCodes.includes(country.cca2)
                );
                // Construit la liste des options (avec un séparateur virtuel)
                const options: ComboboxOption[] = [
                  ...frequentCountries.map((country: Country) => ({
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
                  ...otherCountries.map((country: Country) => ({
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
                        placeholder={
                          countriesLoading
                            ? "Chargement..."
                            : "Sélectionnez un pays"
                        }
                        disabled={
                          countriesLoading ||
                          !!countriesError ||
                          form.watch("location") !== "__autre__"
                        }
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
            <CodexFields
              key={
                inscription?.id ||
                "new-" + (inscription?.codexData?.length || 1)
              }
              form={form}
              inscription={inscription}
              onDuplicateChange={handleCodexDuplicateChange}
            />
            {/* End Codex Dynamic Fields */}

            {/* Date Picker */}
            <div className="flex justify-evenly">
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
                          fromDate={
                            isEdit
                              ? new Date(
                                  inscription?.firstRaceDate || new Date()
                                )
                              : new Date()
                          }
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
            </div>
            {/* End Last Race Date Picker */}

            {/* Info text about next step */}
            <p className="text-base text-center text-gray-600 mt-4 mb-2">
              La liste des coureurs sera renseignée à la prochaine étape.
            </p>

            <div className="flex justify-center mt-6">
              <button
                type="submit"
                className="bg-[#3d7cf2] hover:bg-[#3369d6] text-white px-8 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={
                  createInscription.isPending || codexDuplicates.some(Boolean)
                }
              >
                {createInscription.isPending || updateInscription.isPending
                  ? "Soumission en cours..."
                  : "Soumettre"}
              </button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

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
  createdBy: z.string(),
});

function CodexFields({
  form,
  inscription,
  onDuplicateChange,
}: {
  form: any;
  inscription: any;
  onDuplicateChange: (index: number, isDuplicate: boolean) => void;
}) {
  const {fields, append, remove} = useFieldArray({
    control: form.control,
    name: "codexNumbers",
  });
  return (
    <div className="space-y-2">
      <FormLabel className="text-base text-[#3d7cf2]">
        Codex <span className="text-red-500">*</span>
      </FormLabel>
      {fields.map((field, index) => (
        <CodexField
          key={field.id}
          index={index}
          form={form}
          onDuplicateChange={onDuplicateChange}
          remove={remove}
          fieldsLength={fields.length}
          inscriptionId={inscription?.id?.toString() || ""}
        />
      ))}
      <FormDescription className="text-base mt-1">
        Préciser <span className="font-bold">tous les CODEX</span> de
        l&apos;évènement qui concernent la demande
      </FormDescription>
      <FormField
        control={form.control}
        name="codexNumbers"
        render={() => <FormMessage className="text-red-500 text-sm" />}
      />
      <div className="flex justify-center mt-2">
        <Button
          type="button"
          variant="outline"
          className="flex items-center gap-2 text-green-700 border-green-500 hover:bg-green-50 cursor-pointer"
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
    </div>
  );
}
