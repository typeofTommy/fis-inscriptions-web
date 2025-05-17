import {useRole} from "@/app/lib/useRole";
import {Inscription} from "@/app/types";
import {useUser} from "@clerk/nextjs";

type Type = "actionsBtn" | "manageCompetitorInscriptions";

export const usePermissionToEdit = (
  inscription: Inscription | undefined,
  type: Type
) => {
  const role = useRole();
  const user = useUser();

  if (!inscription) return false;

  if (type === "actionsBtn") {
    return role === "admin";
  }

  if (type === "manageCompetitorInscriptions") {
    return !!user.user;
  }

  return role === "admin" || user.user?.id === inscription.createdBy;
};
