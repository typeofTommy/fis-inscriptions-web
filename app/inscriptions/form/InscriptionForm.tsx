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
import {Inscription} from "@/app/types";
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
    data: event,
    isLoading,
    error,
  } = useCompetitionByCodex(searchedCodex ? Number(searchedCodex) : 0);
  const {createInscription} = useCreateInscription();
  const {data: codexCheck} = useCodexCheck(searchedCodex ?? "");

  const isMixte = event && event.genderCodes && event.genderCodes.length > 1;

  const onSubmit = async () => {
    if (!event || !user || (codexCheck && codexCheck.exists)) return;
    const createdBy = user.id;
    const newInscription = {
      eventId: event.id,
      eventData: event,
      createdBy,
      genderChoice: isMixte ? genderChoice : undefined,
    };
    const returningInscription: {inscription: Inscription} =
      await createInscription.mutateAsync(newInscription);
    router.push(`/inscriptions/${returningInscription.inscription.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-xl font-semibold text-[#3d7cf2] text-center mb-6">
          Nouvelle Demande d&apos;Inscription
        </h1>
        <p className="text-lg text-gray-500 mb-6 flex justify-center">
          Le formulaire d&apos;inscription sera envoyé à l&apos;organisateur au
          plus tard 36 heures avant le 1er TCM (8 jours pour NJC ou NC, délai
          règlementaire pour une demande d&apos;invitation en NC)
        </p>
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
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="ex: 1234"
                        {...field}
                        value={codexInput}
                        onChange={(e) => {
                          const onlyDigits = e.target.value.replace(/\D/g, "");
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
                      />
                    </FormControl>
                    <button
                      type="button"
                      className="bg-gray-200 px-4 py-2 rounded cursor-pointer border border-gray-300 hover:bg-gray-300"
                      onClick={() => setSearchedCodex(codexInput)}
                      disabled={codexInput.length < 3 || isLoading}
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
            {event && isMixte && !codexCheck.exists && (
              <div className="mt-4">
                <label className="block font-semibold mb-2">
                  L&apos;événement est mixte, quels codex souhaitez-vous
                  importer ?
                </label>
                <div className="flex gap-4">
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
              </div>
            )}
            {isLoading && <p>Chargement des infos FIS...</p>}
            {error && (
              <p className="text-red-500">
                {error.message === "Codex non trouvé"
                  ? "Codex non trouvé."
                  : "Erreur lors de la récupération de l'événement."}
              </p>
            )}
            {event && (
              <div className="border rounded p-4 bg-gray-50 mt-4">
                <div>
                  <b>Codexes :</b>{" "}
                  {event.competitions.map((c) => c.codex).join(", ")}
                </div>
                <div>
                  <b>Nom :</b> {event.name}
                </div>
                <div>
                  <b>Lieu :</b> {event.place}
                </div>
                <div>
                  <b>Pays :</b> {event.placeNationCode}
                </div>
                <div>
                  <b>Date :</b> {event.startDate} - {event.endDate}
                </div>
                <div>
                  <b>Catégorie :</b> {event.categoryCodes?.join(", ")}
                </div>
                <div>
                  <b>Discipline :</b> {event.disciplineCode}
                </div>
                <div>
                  <b>Sexe :</b> {event.genderCodes?.join(", ") || "-"}
                </div>
                <div>
                  <b>Types de courses :</b> {event.categoryCodes?.join(", ")}
                </div>
              </div>
            )}
            <div className="flex justify-center mt-6">
              <button
                type="submit"
                className="bg-[#3d7cf2] hover:bg-[#3369d6] text-white px-8 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={
                  isLoading ||
                  !event ||
                  (codexCheck && codexCheck.exists) ||
                  (isMixte && !genderChoice)
                }
              >
                Créer la compétition
              </button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

const inscriptionFormSchema = z.object({
  codex: z.string().min(3, {message: "Le codex est requis."}).regex(/^\d+$/, {
    message: "Le codex doit contenir uniquement des chiffres.",
  }),
});
