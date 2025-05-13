"use client";

import React, {useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {useCompetitionByCodex} from "@/app/fisApi";
import {useCreateInscription, useCodexCheck} from "./api";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {useUser} from "@clerk/nextjs";
import {useRouter} from "next/navigation";
import {
  Inscription,
  Competition,
  CompetitionItem,
  JuryMember,
  CompetitionInfo,
  CompetitionInfoData,
  CompetitionInfoItem,
} from "@/app/types";
import {Calendar, MapPin, Clock, ExternalLink} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";

// Helper function to format date
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "-";
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  try {
    return new Date(dateString).toLocaleDateString("fr-FR", options);
  } catch {
    return dateString;
  }
};

// Helper function to format time
const formatTime = (timeString: string | undefined): string => {
  if (!timeString) return "-";
  try {
    const date = new Date(timeString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
  } catch {
    return timeString;
  }
};

// Helper function to translate competition status
const translateStatus = (status: string | undefined): string => {
  if (!status) return "-";
  const lowerStatus = status.toLowerCase();
  switch (lowerStatus) {
    case "official results":
      return "Résultats Officiels";
    case "confirmed":
      return "Confirmé";
    case "cancelled":
      return "Annulé";
    case "scheduled":
      return "Programmé";
    case "postponed":
      return "Reporté";
    case "live":
      return "En direct";
    case "rescheduled":
      return "Re-programmé";
    case "provisional":
      return "Provisoire";
    // Add more translations as needed
    default:
      return status; // Return original status if no translation is available
  }
};

// Helper function to translate dynamic titles from API data
const translateDynamicTitle = (title: string | undefined): string => {
  if (!title) return "-";
  const translations: {[key: string]: string} = {
    // Section Titles
    "Technical data": "Données techniques",
    Information: "Informations",
    General: "Général",
    Reports: "Rapports",
    Jury: "Jury",
    // Technical Data Items
    "Start altitude": "Altitude de départ",
    "Finish altitude": "Altitude d'arrivée",
    "Vertical drop": "Dénivelé",
    "Course length": "Longueur du parcours",
    Homologation: "Homologation",
    // Information Items
    "Course name": "Nom du parcours",
    "Course setter": "Traceur",
    Gates: "Portes",
    "Turning gates": "Portes directionnelles",
    "Start time": "Heure de départ",
    // General Items
    Codex: "Codex",
    "Valid for FIS points": "Valide pour points FIS",
    "Valid for Olympic FIS points 2026":
      "Valide pour points FIS Olympiques 2026",
    // Reports Items
    "Timing report": "Rapport de chronométrage",
    // Jury Functions
    "Technical Delegate": "Délégué Technique",
    Referee: "Arbitre",
    "Assistant Referee": "Arbitre Assistant",
    "Chief of Race": "Chef de Piste",
    "Start Referee": "Juge au départ",
    "Finish Referee": "Juge à l'arrivée",
    "Course Chief": "Chef de Piste", // Assuming same as Chief of Race based on context
    // Add more translations as they are identified
  };
  return translations[title] || title; // Return original title if no translation is available
};

export const InscriptionFormWrapper = () => {
  const {user} = useUser();
  const router = useRouter();
  const form = useForm<z.infer<typeof inscriptionFormSchema>>({
    resolver: zodResolver(inscriptionFormSchema),
    defaultValues: {codex: ""},
  });
  const [codexInput, setCodexInput] = useState("");
  const [searchedCodex, setSearchedCodex] = useState<string | null>(null);
  const [genderChoice, setGenderChoice] = useState<
    "men" | "women" | "both" | null
  >(null);
  const {
    data: eventUntyped,
    isLoading,
    error,
  } = useCompetitionByCodex(searchedCodex ? Number(searchedCodex) : 0);
  const {createInscription} = useCreateInscription();
  const {data: codexCheck} = useCodexCheck(searchedCodex ?? "");

  const event = eventUntyped as Competition | null | undefined;

  const isTrainingEvent =
    event &&
    event.categoryCodes?.includes("TRA") &&
    event.categoryCodes.length === 1;

  const isMixte = event && event.genderCodes && event.genderCodes.length > 1;

  const onSubmit = async () => {
    if (!event || isTrainingEvent || !user || (codexCheck && codexCheck.exists))
      return;

    const eventDataForDb = JSON.parse(JSON.stringify(event));

    if (
      eventDataForDb.competitions &&
      Array.isArray(eventDataForDb.competitions)
    ) {
      eventDataForDb.competitions = eventDataForDb.competitions.filter(
        (comp: CompetitionItem) => comp.categoryCode !== "TRA"
      );
    } else {
      eventDataForDb.competitions = [];
    }

    if (
      eventDataForDb.categoryCodes &&
      Array.isArray(eventDataForDb.categoryCodes)
    ) {
      eventDataForDb.categoryCodes = eventDataForDb.categoryCodes.filter(
        (code: string) => code !== "TRA"
      );
    } else {
      eventDataForDb.categoryCodes = [];
    }

    const createdBy = user.id;
    const newInscription = {
      eventId: event.id,
      eventData: eventDataForDb,
      createdBy,
      genderChoice: isMixte ? genderChoice : undefined,
    };
    const returningInscription: {inscription: Inscription} =
      await createInscription.mutateAsync(newInscription);
    router.push(`/inscriptions/${returningInscription.inscription.id}`);
  };

  return (
    <div className="mx-auto max-w-12xl px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="max-w-4xl mx-auto mb-8 text-center">
          <h1 className="text-xl font-semibold text-[#3d7cf2] mb-4">
            Nouvelle Demande d&apos;Inscription
          </h1>
          <p className="text-sm text-gray-500">
            Le formulaire d&apos;inscription sera envoyé à l&apos;organisateur
            au plus tard 36 heures avant le 1er TCM (8 jours pour NJC ou NC,
            délai règlementaire pour une demande d&apos;invitation en NC)
          </p>
        </div>

        <Card className="mb-6 p-4 sm:p-6 max-w-2xl mx-auto">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, (errors, values) => {
                console.log("ZOD ERRORS", errors, values);
              })}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="codex"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Codex</FormLabel>
                    <span className="text-sm text-gray-500 mb-1 block">
                      Veuillez entrer un des codex de l&apos;événement à ajouter
                    </span>
                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                      <FormControl>
                        <Input
                          placeholder="ex: 1234"
                          {...field}
                          value={codexInput}
                          onChange={(e) => {
                            const onlyDigits = e.target.value.replace(
                              /\D/g,
                              ""
                            );
                            setCodexInput(onlyDigits);
                            field.onChange({
                              ...e,
                              target: {
                                ...e.target,
                                value: onlyDigits,
                              },
                            });
                          }}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="max-w-xs w-full"
                        />
                      </FormControl>
                      <button
                        type="button"
                        className="bg-gray-200 px-4 py-2 rounded cursor-pointer border border-gray-300 hover:bg-gray-300 whitespace-nowrap"
                        onClick={() => setSearchedCodex(codexInput)}
                        disabled={isLoading}
                      >
                        Chercher
                      </button>
                    </div>
                    <FormMessage />
                    {searchedCodex &&
                      codexCheck &&
                      codexCheck.exists &&
                      codexCheck.inscriptionId && (
                        <div className="mt-2 text-red-600">
                          Ce codex est déjà présent dans une{" "}
                          <a
                            href={`/inscriptions/${codexCheck.inscriptionId}`}
                            className="underline text-blue-600"
                          >
                            inscription existante
                          </a>
                          .
                        </div>
                      )}
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </Card>

        {event && !isTrainingEvent && isMixte && !codexCheck?.exists && (
          <Card className="mb-6 p-4 sm:p-6">
            <label className="block font-semibold mb-2">
              L&apos;événement est mixte, quels codex souhaitez-vous importer ?
            </label>
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                className={`px-4 py-2 rounded border cursor-pointer ${
                  genderChoice === "men"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
                onClick={() => setGenderChoice("men")}
              >
                Hommes
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded border cursor-pointer ${
                  genderChoice === "women"
                    ? "bg-pink-500 text-white"
                    : "bg-gray-200"
                }`}
                onClick={() => setGenderChoice("women")}
              >
                Femmes
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded border cursor-pointer ${
                  genderChoice === "both"
                    ? "bg-green-500 text-white"
                    : "bg-gray-200"
                }`}
                onClick={() => setGenderChoice("both")}
              >
                Les deux
              </button>
            </div>
          </Card>
        )}

        {event && isTrainingEvent && (
          <p className="text-orange-600 mt-4 mb-6">
            Les compétitions de type &apos;Training&apos; (TRA) uniquement ne
            peuvent pas être sélectionnées pour une inscription.
          </p>
        )}

        {isLoading && <p className="mb-6">Chargement des infos FIS...</p>}
        {error && (
          <p className="text-red-500 mb-6">
            {error instanceof Error && error.message === "Codex non trouvé"
              ? "Codex non trouvé."
              : "Erreur lors de la récupération de l'événement."}
          </p>
        )}

        {event && !isTrainingEvent && !codexCheck?.exists && (
          <div className="mt-0">
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                  {event.name}
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-600 text-sm">
                  <div className="flex items-center gap-1">
                    <MapPin size={16} />
                    <span>
                      {event.place}, {event.placeNationCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    <span>
                      {formatDate(event.startDate)} -{" "}
                      {formatDate(event.endDate)}
                    </span>
                  </div>
                </div>
              </div>
              {event.sponsor?.logoUrl && (
                <div className="flex items-center gap-2">
                  {event.sponsor?.prefix && (
                    <span className="text-sm text-gray-500">
                      {event.sponsor.prefix}
                    </span>
                  )}
                  <a
                    href={event.sponsor.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center cursor-pointer"
                  >
                    <Image
                      src={event.sponsor.logoUrl}
                      alt={event.sponsor.name || "Partenaire"}
                      width={100}
                      height={50}
                      className="h-8 w-auto object-contain"
                    />
                  </a>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {event.seasonCode && (
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800 border-blue-200"
                >
                  Saison {event.seasonCode}
                </Badge>
              )}
              {event.disciplineCode && (
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800 border-blue-200"
                >
                  Discipline: {event.disciplineCode}
                </Badge>
              )}
              {event.genderCodes && event.genderCodes.length > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800 border-blue-200"
                >
                  {event.genderCodes.includes("M") &&
                  event.genderCodes.includes("W")
                    ? "Mixte"
                    : event.genderCodes.includes("M")
                    ? "Hommes"
                    : event.genderCodes.includes("W")
                    ? "Femmes"
                    : "N/A"}
                </Badge>
              )}
            </div>

            <Tabs defaultValue="competitions" className="mb-8 cursor-pointer">
              <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 mb-4">
                <TabsTrigger value="competitions">Compétitions</TabsTrigger>
                <TabsTrigger value="details">Détails techniques</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
              </TabsList>

              <TabsContent value="competitions" className="space-y-4">
                {event.competitions &&
                event.competitions.filter(
                  (c: CompetitionItem) => c.categoryCode !== "TRA"
                ).length > 0 ? (
                  <div className="flex flex-wrap gap-4">
                    {event.competitions
                      .filter((c: CompetitionItem) => c.categoryCode !== "TRA")
                      .map((competition: CompetitionItem, index: number) => (
                        <Card
                          key={competition.id || index}
                          className="overflow-hidden border-gray-200 hover:border-blue-300 transition-colors flex-1 min-w-[350px] md:min-w-[400px]"
                        >
                          <CardHeader className="bg-gray-50 border-b pb-3">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                              <div>
                                <CardTitle className="text-md font-semibold text-blue-700 flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className="bg-blue-600 text-white border-0 text-xs"
                                  >
                                    {String(
                                      competition.displayCodex ||
                                        competition.codex
                                    ).padStart(4, "0")}
                                  </Badge>
                                  {competition.eventDescriptionWithGender ||
                                    competition.eventDescription}
                                </CardTitle>
                                <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs">
                                  <span className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    {formatDate(competition.date)}
                                  </span>
                                  {competition.times &&
                                    competition.times.length > 0 && (
                                      <span className="flex items-center gap-1">
                                        <Clock size={14} />
                                        {formatTime(competition.times[0])}
                                        {competition.times.length > 1 &&
                                          ` - ${formatTime(
                                            competition.times[1]
                                          )}`}
                                      </span>
                                    )}
                                </CardDescription>
                              </div>
                              {competition.status && (
                                <Badge
                                  variant={
                                    competition.status.toLowerCase() ===
                                    "official results"
                                      ? "default"
                                      : "outline"
                                  }
                                  className={`text-xs ${
                                    competition.status.toLowerCase() ===
                                    "official results"
                                      ? "bg-green-100 text-green-700 border-green-200"
                                      : "bg-yellow-100 text-yellow-700 border-yellow-200"
                                  }`}
                                >
                                  {translateStatus(competition.status)}
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="pt-4 text-sm">
                            <Accordion
                              type="single"
                              collapsible
                              className="w-full"
                            >
                              {competition.competitionInfo &&
                                competition.competitionInfo.length > 0 && (
                                  <AccordionItem value="technical-data">
                                    <AccordionTrigger className="text-xs font-medium text-gray-600 hover:text-blue-600">
                                      Données techniques
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      {competition.competitionInfo.map(
                                        (
                                          infoGroup: CompetitionInfo,
                                          infoIdx: number
                                        ) =>
                                          infoGroup.data &&
                                          infoGroup.data.map(
                                            (
                                              dataGroup: CompetitionInfoData,
                                              dgIndex: number
                                            ) => (
                                              <div
                                                key={`${infoIdx}-${dgIndex}`}
                                                className="mb-3 last:mb-0"
                                              >
                                                <h4 className="font-semibold text-gray-700 text-xs mb-1">
                                                  {translateDynamicTitle(
                                                    dataGroup.title
                                                  )}
                                                </h4>
                                                <ul className="space-y-0.5 text-xs">
                                                  {dataGroup.items.map(
                                                    (
                                                      item: CompetitionInfoItem,
                                                      itemIndex: number
                                                    ) => (
                                                      <li
                                                        key={itemIndex}
                                                        className="flex justify-between"
                                                      >
                                                        <span className="text-gray-500">
                                                          {translateDynamicTitle(
                                                            item.title
                                                          )}
                                                          :
                                                        </span>
                                                        <span className="font-medium text-gray-700">
                                                          {item.value}
                                                        </span>
                                                      </li>
                                                    )
                                                  )}
                                                </ul>
                                              </div>
                                            )
                                          )
                                      )}
                                    </AccordionContent>
                                  </AccordionItem>
                                )}
                              {competition.jury &&
                                competition.jury.length > 0 && (
                                  <AccordionItem value="jury">
                                    <AccordionTrigger className="text-xs font-medium text-gray-600 hover:text-blue-600">
                                      Jury
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <ul className="space-y-1 text-xs">
                                        {competition.jury.map(
                                          (
                                            member: JuryMember,
                                            memberIndex: number
                                          ) => (
                                            <li
                                              key={memberIndex}
                                              className="flex justify-between"
                                            >
                                              <span className="text-gray-500">
                                                {translateDynamicTitle(
                                                  member.displayFunction ||
                                                    member.function
                                                )}
                                                :
                                              </span>
                                              <span className="font-medium text-gray-700">
                                                {member.firstName}{" "}
                                                {member.lastName} (
                                                {member.nationCode})
                                              </span>
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    </AccordionContent>
                                  </AccordionItem>
                                )}
                            </Accordion>
                          </CardContent>
                          {(competition.sponsor?.logoUrl ||
                            competition.liveResultsUrl) && (
                            <CardFooter className="bg-gray-50 border-t p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                              {competition.sponsor?.logoUrl && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  {competition.sponsor?.prefix && (
                                    <span>{competition.sponsor.prefix}</span>
                                  )}
                                  <a
                                    href={competition.sponsor.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center cursor-pointer"
                                  >
                                    <Image
                                      src={competition.sponsor.logoUrl}
                                      alt={
                                        competition.sponsor.name || "Partenaire"
                                      }
                                      width={80}
                                      height={30}
                                      className="h-5 w-auto object-contain"
                                    />
                                  </a>
                                </div>
                              )}
                              {competition.liveResultsUrl && (
                                <a
                                  href={competition.liveResultsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                                >
                                  Voir les résultats <ExternalLink size={12} />
                                </a>
                              )}
                            </CardFooter>
                          )}
                        </Card>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    Aucune compétition (hors entraînements) trouvée pour cet
                    événement.
                  </p>
                )}
              </TabsContent>

              <TabsContent value="details">
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-700">
                      Informations détaillées
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                      Détails techniques de l&apos;événement
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {event.disciplineCode && (
                      <div>
                        <h3 className="font-medium text-gray-600 mb-1">
                          Discipline principale
                        </h3>
                        <Badge
                          variant="outline"
                          className="bg-gray-100 text-gray-700"
                        >
                          {event.disciplineCode}
                        </Badge>
                      </div>
                    )}
                    {event.categoryCodes &&
                      event.categoryCodes.filter(
                        (code: string) => code !== "TRA"
                      ).length > 0 && (
                        <div>
                          <h3 className="font-medium text-gray-600 mb-1">
                            Catégories de l&apos;événement (hors TRA)
                          </h3>
                          <div className="flex flex-wrap gap-1">
                            {event.categoryCodes
                              .filter((code: string) => code !== "TRA")
                              .map((code: string) => (
                                <Badge
                                  key={code}
                                  variant="outline"
                                  className="bg-gray-100 text-gray-700"
                                >
                                  {code}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      )}
                    {event.timeZone && (
                      <div>
                        <h3 className="font-medium text-gray-600 mb-1">
                          Fuseau horaire
                        </h3>
                        <p className="text-gray-700">{event.timeZone}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contact">
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-700">
                      Informations de contact
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                      Coordonnées de l&apos;organisateur
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {event.contactInformation ? (
                      <>
                        {(event.contactInformation.line1 ||
                          event.contactInformation.line2 ||
                          event.contactInformation.line4) && (
                          <div>
                            <h3 className="font-medium text-gray-600 mb-1">
                              Adresse
                            </h3>
                            {event.contactInformation.line1 && (
                              <p className="text-gray-700">
                                {event.contactInformation.line1}
                              </p>
                            )}
                            {event.contactInformation.line2 && (
                              <p className="text-gray-700">
                                {event.contactInformation.line2}
                              </p>
                            )}
                            {event.contactInformation.line4 && (
                              <p className="text-gray-700">
                                {event.contactInformation.line4}
                              </p>
                            )}
                          </div>
                        )}
                        {(event.contactInformation.phone ||
                          event.contactInformation.emailGeneral ||
                          event.contactInformation.emailEntries) && (
                          <div>
                            <h3 className="font-medium text-gray-600 mb-1">
                              Contact
                            </h3>
                            {event.contactInformation.phone && (
                              <p className="text-gray-700">
                                Téléphone: {event.contactInformation.phone}
                              </p>
                            )}
                            {event.contactInformation.emailGeneral && (
                              <p className="text-gray-700">
                                Email général:{" "}
                                <a
                                  href={`mailto:${event.contactInformation.emailGeneral}`}
                                  className="text-blue-600 hover:underline"
                                >
                                  {event.contactInformation.emailGeneral}
                                </a>
                              </p>
                            )}
                            {event.contactInformation.emailEntries && (
                              <p className="text-gray-700">
                                Email inscriptions:{" "}
                                <a
                                  href={`mailto:${event.contactInformation.emailEntries}`}
                                  className="text-blue-600 hover:underline"
                                >
                                  {event.contactInformation.emailEntries}
                                </a>
                              </p>
                            )}
                          </div>
                        )}
                        {event.contactInformation.website && (
                          <div>
                            <h3 className="font-medium text-gray-600 mb-1">
                              Liens
                            </h3>
                            <p>
                              <a
                                href={event.contactInformation.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                Site web <ExternalLink size={12} />
                              </a>
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-500">
                        Aucune information de contact disponible pour cet
                        événement.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
        {event && !isTrainingEvent && !codexCheck?.exists && (
          <div className="flex justify-center mt-6">
            <button
              type="button"
              onClick={onSubmit}
              className="bg-[#3d7cf2] hover:bg-[#3369d6] text-white px-8 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              disabled={
                isLoading ||
                !event ||
                isTrainingEvent ||
                (codexCheck && codexCheck.exists) ||
                (isMixte && !isTrainingEvent && !genderChoice)
              }
            >
              Créer la compétition
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const inscriptionFormSchema = z.object({
  codex: z
    .string()
    .min(1, {message: "Le codex est requis."})
    .regex(/^[\d]+$/, {
      message: "Le codex doit contenir uniquement des chiffres.",
    }),
});
