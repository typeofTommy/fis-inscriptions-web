"use client";

import React from "react";
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
import {Button} from "@/components/ui/button";
import {usePermissionToEdit} from "./usePermissionToEdit";
import {InscriptionCoach} from "@/app/types";
import {format} from "date-fns";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";

export const useInscriptionCoaches = (inscriptionId: string) => {
  return useQuery<InscriptionCoach[]>({
    queryKey: ["inscription-coaches", inscriptionId],
    queryFn: async () => {
      const res = await fetch(`/api/inscriptions/${inscriptionId}/coaches`);
      if (!res.ok) throw new Error("Erreur lors du chargement des coaches");
      return res.json();
    },
  });
};

function useDeleteCoach(inscriptionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({coachId}: {coachId: number}) => {
      const res = await fetch(`/api/inscriptions/${inscriptionId}/coaches`, {
        method: "DELETE",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({coachId}),
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression du coach");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["inscription-coaches", inscriptionId],
      });
    },
  });
}

export const Coaches = ({inscriptionId}: {inscriptionId: string}) => {
  const {
    data: coaches = [],
    isPending,
    error,
  } = useInscriptionCoaches(inscriptionId);

  const {data: inscription} = useQuery({
    queryKey: ["inscriptions", inscriptionId],
    queryFn: () =>
      fetch(`/api/inscriptions/${inscriptionId}`).then((r) => r.json()),
  });

  const {mutate: deleteCoach, isPending: deleting} =
    useDeleteCoach(inscriptionId);

  const permissionToEdit = usePermissionToEdit(inscription, "manageCoaches");

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        <p>Chargement des coaches...</p>
      </div>
    );
  }

  if (error) {
    return <div>Erreur lors du chargement des coaches.</div>;
  }

  if (!coaches?.length && !isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
        {inscription?.status !== "open" && (
          <div className="text-xs text-slate-400 italic select-none">
            L&apos;ajout / suppression de coaches n&apos;est possible que lorsque
            l&apos;inscription est <b>ouverte</b>.
          </div>
        )}
        <p>Aucun coach ajouté pour le moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {inscription?.status !== "open" && (
        <div className="text-xs text-slate-400 italic select-none">
          L&apos;ajout / suppression de coaches n&apos;est possible que lorsque
          l&apos;inscription est <b>ouverte</b>.
        </div>
      )}

      {/* Vue desktop - table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prénom</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Équipe</TableHead>
              <TableHead>Premier jour</TableHead>
              <TableHead>Dernier jour</TableHead>
              <TableHead>Ajouté par</TableHead>
              <TableHead>Date d&apos;ajout</TableHead>
              {permissionToEdit && <TableHead>Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {coaches.map((coach) => (
              <TableRow key={coach.id}>
                <TableCell className="font-medium">{coach.firstName}</TableCell>
                <TableCell className="font-medium">{coach.lastName}</TableCell>
                <TableCell>{coach.team || "-"}</TableCell>
                <TableCell>
                  {coach.startDate
                    ? format(new Date(coach.startDate), "dd/MM/yyyy")
                    : "-"}
                </TableCell>
                <TableCell>
                  {coach.endDate
                    ? format(new Date(coach.endDate), "dd/MM/yyyy")
                    : "-"}
                </TableCell>
                <TableCell>{coach.addedByEmail || "-"}</TableCell>
                <TableCell>
                  {coach.createdAt
                    ? format(new Date(coach.createdAt), "dd/MM/yyyy HH:mm")
                    : "-"}
                </TableCell>
                {permissionToEdit && (
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Supprimer le coach"
                          className="cursor-pointer text-red-600 hover:text-red-800 hover:bg-red-50"
                          disabled={inscription?.status !== "open" || deleting}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Supprimer le coach
                          </DialogTitle>
                          <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer le coach{" "}
                            <strong>{coach.firstName} {coach.lastName}</strong> ? Cette action est
                            irréversible.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="ghost">Annuler</Button>
                          </DialogClose>
                          <Button
                            onClick={() => deleteCoach({coachId: coach.id})}
                            className="bg-red-600 hover:bg-red-700 cursor-pointer"
                          >
                            Supprimer
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

      {/* Vue mobile - cartes */}
      <div className="md:hidden space-y-3">
        {coaches.map((coach) => (
          <div
            key={coach.id}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{coach.firstName} {coach.lastName}</h3>
                {coach.team && (
                  <p className="text-sm text-gray-600 mt-1">
                    Équipe: {coach.team}
                  </p>
                )}
                {(coach.startDate || coach.endDate) && (
                  <p className="text-sm text-gray-600 mt-1">
                    Période: {coach.startDate ? format(new Date(coach.startDate), "dd/MM/yyyy") : "?"} - {coach.endDate ? format(new Date(coach.endDate), "dd/MM/yyyy") : "?"}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Ajouté par: {coach.addedByEmail || "-"}
                </p>
                <p className="text-sm text-gray-500">
                  Le:{" "}
                  {coach.createdAt
                    ? format(new Date(coach.createdAt), "dd/MM/yyyy à HH:mm")
                    : "-"}
                </p>
              </div>
              {permissionToEdit && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="cursor-pointer text-red-600 hover:text-red-800 hover:bg-red-50"
                      disabled={inscription?.status !== "open" || deleting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Supprimer le coach</DialogTitle>
                      <DialogDescription>
                        Êtes-vous sûr de vouloir supprimer le coach{" "}
                        <strong>{coach.firstName} {coach.lastName}</strong> ? Cette action est
                        irréversible.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="ghost">Annuler</Button>
                      </DialogClose>
                      <Button
                        onClick={() => deleteCoach({coachId: coach.id})}
                        className="bg-red-600 hover:bg-red-700 cursor-pointer"
                      >
                        Supprimer
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};