import { auth, clerkClient } from "@clerk/nextjs/server";

export type Role = "super-admin" | "admin" | "user" | "guest";

export const getCurrentUserRole = async (): Promise<Role> => {
  const { userId } = await auth();

  if (!userId) {
    return "guest";
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = user.publicMetadata.role as string | undefined;

    if (role === "super-admin") return "super-admin";
    if (role === "admin") return "admin";
    return "user";
  } catch {
    return "guest";
  }
};

export const isSuperAdmin = async (): Promise<boolean> => {
  const role = await getCurrentUserRole();
  return role === "super-admin";
};

export const isAdmin = async (): Promise<boolean> => {
  const role = await getCurrentUserRole();
  return role === "admin" || role === "super-admin";
};

export const requireSuperAdmin = async () => {
  const role = await getCurrentUserRole();
  if (role !== "super-admin") {
    throw new Error("Super admin access required");
  }
};

export const requireAdmin = async () => {
  const role = await getCurrentUserRole();
  if (role !== "admin" && role !== "super-admin") {
    throw new Error("Admin access required");
  }
};
