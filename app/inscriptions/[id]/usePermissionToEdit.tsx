import {useRole} from "@/app/lib/useRole";
import {inscriptions} from "@/drizzle/schemaInscriptions";
import {useUser} from "@clerk/nextjs";

export const usePermissionToEdit = (
  inscription: typeof inscriptions.$inferSelect | undefined
) => {
  const role = useRole();
  const user = useUser();

  if (!inscription) return false;

  return role === "admin" || user.user?.id === inscription.createdBy;
};
