"use client";

import React, {useState, useEffect} from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {Loader2, Trash2} from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {Badge} from "@/components/ui/badge";
import {colorBadgePerDiscipline} from "@/app/lib/colorMappers";
import {usePermissionToEdit} from "./usePermissionToEdit";
import {Discipline, InscriptionCompetitor} from "@/app/types";
import {format} from "date-fns";

export const useInscriptionCompetitors = (
  inscriptionId: string,
  codexNumber: string,
  discipline: Discipline
) => {
  return useQuery<InscriptionCompetitor[]>({
    queryKey: [
      "inscription-competitors",
      inscriptionId,
      codexNumber,
      discipline,
    ],
    queryFn: async () => {
      const res = await fetch(
        `/api/inscriptions/${inscriptionId}/competitors?codexNumber=${codexNumber}&discipline=${discipline}`
      );
      if (!res.ok) throw new Error("Erreur lors du chargement des coureurs");
      return res.json();
    },
  });
};

function useRemoveCompetitor(inscriptionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      competitorId,
      codexNumbers,
    }: {
      competitorId: number;
      codexNumbers: string[];
    }) => {
      const res = await fetch(
        `/api/inscriptions/${inscriptionId}/competitors`,
        {
          method: "DELETE",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({competitorId, codexNumbers}),
        }
      );
      if (!res.ok) throw new Error("Erreur lors de la désinscription");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      // Invalider tous les codex concernés
      (variables.codexNumbers || []).forEach((codexNumber) => {
        queryClient.invalidateQueries({
          queryKey: ["inscription-competitors", inscriptionId, codexNumber],
        });
      });
      // Invalider la liste des inscriptions du compétiteur (onglet Compétiteurs)
      if (variables && variables.competitorId) {
        queryClient.invalidateQueries({
          queryKey: ["competitor-inscriptions", variables.competitorId],
        });
      }
      // Invalider la liste globale des compétiteurs de l'inscription
      queryClient.invalidateQueries({
        queryKey: ["inscription-competitors-all", inscriptionId],
      });
    },
  });
}

export const Competitors = ({
  inscriptionId,
  codexNumber,
  discipline,
}: {
  inscriptionId: string;
  codexNumber: string;
  discipline: Discipline;
}) => {
  const {
    data: competitors = [],
    isPending,
    error,
  } = useInscriptionCompetitors(inscriptionId, codexNumber, discipline);

  const {data: inscription} = useQuery({
    queryKey: ["inscriptions", inscriptionId],
    queryFn: () =>
      fetch(`/api/inscriptions/${inscriptionId}`).then((r) => r.json()),
  });

  // Dialog state
  const [openDialog, setOpenDialog] = React.useState<null | number>(null); // competitorId
  const [selectedCodex, setSelectedCodex] = React.useState<string[]>([]);
  const {mutate: removeCompetitor, isPending: removing} =
    useRemoveCompetitor(inscriptionId);

  const permissionToEdit = usePermissionToEdit(inscription);

  // Quand on ouvre le dialog, on coche par défaut le codex courant
  React.useEffect(() => {
    if (openDialog !== null) {
      setSelectedCodex([codexNumber]);
    }
  }, [openDialog, codexNumber]);

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        <p>Chargement des compétiteurs...</p>
      </div>
    );
  }
  if (error) {
    return <div>Erreur lors du chargement des compétiteurs.</div>;
  }

  if (!competitors?.length && !isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        {inscription?.status !== "open" && (
          <div className="text-xs text-slate-400 italic select-none">
            L&apos;inscription / désincription n&apos;est possible que lorsque
            l&apos;inscription est <b>ouverte</b>.
          </div>
        )}
        <p>Aucun compétiteur présent pour ce codex pour le moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {inscription?.status !== "open" && (
        <div className="text-xs text-slate-400 italic select-none">
          L&apos;inscription / désincription n&apos;est possible que lorsque
          l&apos;inscription est <b>ouverte</b>.
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Prénom</TableHead>
            <TableHead>Club</TableHead>
            <TableHead>Année de naissance</TableHead>
            <TableHead>Points FIS ({discipline})</TableHead>
            <TableHead>Ajouté par</TableHead>
            {permissionToEdit && <TableHead>Action</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {(competitors || [])
            .sort((a, b) => {
              const aPoints = a.points;
              const bPoints = b.points;
              const aNoPoints =
                aPoints === null ||
                aPoints === undefined ||
                String(aPoints) === "" ||
                String(aPoints) === "-";
              const bNoPoints =
                bPoints === null ||
                bPoints === undefined ||
                String(bPoints) === "" ||
                String(bPoints) === "-";
              if (aNoPoints && bNoPoints) return 0;
              if (aNoPoints) return 1;
              if (bNoPoints) return -1;
              return Number(aPoints) - Number(bPoints);
            })
            .map((c) => (
              <TableRow key={c.competitorId}>
                <TableCell>{c.lastname}</TableCell>
                <TableCell>{c.firstname}</TableCell>
                <TableCell>{c.skiclub}</TableCell>
                <TableCell>
                  {c.birthdate ? format(new Date(c.birthdate), "yyyy") : ""}
                </TableCell>
                <TableCell>
                  {c.points === null ||
                  c.points === undefined ||
                  String(c.points) === "" ||
                  String(c.points) === "-"
                    ? "-"
                    : c.points}
                </TableCell>
                <TableCell>{c.addedByEmail || "-"}</TableCell>
                {permissionToEdit && (
                  <TableCell>
                    <Dialog
                      open={openDialog === c.competitorid}
                      onOpenChange={(o) =>
                        setOpenDialog(o ? c.competitorid : null)
                      }
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Désinscrire"
                          className="cursor-pointer"
                          disabled={inscription?.status !== "open"}
                        >
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Confirmer la désinscription de {c.firstname}{" "}
                            {c.lastname} ?
                          </DialogTitle>
                        </DialogHeader>
                        <DesinscriptionCodexList
                          inscriptionId={inscriptionId}
                          competitorId={c.competitorid}
                          selectedCodex={selectedCodex}
                          setSelectedCodex={setSelectedCodex}
                          currentCodex={codexNumber}
                        />
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="ghost" className="cursor-pointer">
                              Annuler
                            </Button>
                          </DialogClose>
                          <Button
                            onClick={() => {
                              removeCompetitor({
                                competitorId: c.competitorid,
                                codexNumbers: selectedCodex,
                              });
                              setOpenDialog(null);
                            }}
                            disabled={removing || selectedCodex.length === 0}
                            variant="destructive"
                            className="cursor-pointer"
                          >
                            {removing ? "Suppression..." : "Confirmer"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                )}
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
};

// Composant pour afficher la liste des codex où le compétiteur est inscrit
function DesinscriptionCodexList({
  inscriptionId,
  competitorId,
  selectedCodex,
  setSelectedCodex,
  currentCodex,
}: {
  inscriptionId: string;
  competitorId: number;
  selectedCodex: string[];
  setSelectedCodex: (v: string[]) => void;
  currentCodex: string;
}) {
  const [codexList, setCodexList] = useState<
    {number: string; discipline: string; sex: string}[]
  >([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    fetch(
      `/api/inscriptions/${inscriptionId}/competitors?competitorId=${competitorId}`
    )
      .then((r) => r.json())
      .then((data) => {
        setCodexList(data);
        // Par défaut, coche uniquement le codex courant
        setSelectedCodex(
          data.some((c: any) => c.number === currentCodex) ? [currentCodex] : []
        );
      })
      .finally(() => setLoading(false));
  }, [inscriptionId, competitorId, setSelectedCodex, currentCodex]);

  if (loading) return <div>Chargement des codex...</div>;
  if (!codexList.length)
    return <div>Aucun codex trouvé pour ce compétiteur.</div>;
  return (
    <div className="space-y-2">
      <div className="mb-2">Sur quels codex ?</div>
      <div className="flex flex-wrap gap-2">
        {codexList.map((codex) => (
          <label key={codex.number} className="flex items-center gap-2">
            <Checkbox
              checked={selectedCodex.includes(codex.number)}
              onCheckedChange={(checked) => {
                setSelectedCodex(
                  checked
                    ? [...selectedCodex, codex.number]
                    : selectedCodex.filter((n: string) => n !== codex.number)
                );
              }}
            />
            {codex.number}
            <Badge
              className={`ml-1 text-xs px-2 py-1 ${
                colorBadgePerDiscipline[codex.discipline] || ""
              }`}
            >
              {codex.discipline}
            </Badge>
          </label>
        ))}
      </div>
    </div>
  );
}
