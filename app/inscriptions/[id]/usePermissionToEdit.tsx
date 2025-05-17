import {useRole} from "@/app/lib/useRole";
import {Inscription} from "@/app/types";
import {useUser} from "@clerk/nextjs";

export const usePermissionToEdit = (inscription: Inscription | undefined) => {
  const role = useRole();
  const user = useUser();

  console.log({role, user, inscription});

  if (!inscription) return false;

  return role === "admin" || user.user?.id === inscription.createdBy;
};
