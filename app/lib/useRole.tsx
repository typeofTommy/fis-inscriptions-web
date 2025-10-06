import {useUser} from "@clerk/nextjs";

type Role = "super-admin" | "admin" | "user" | "guest";

export const useRole = (): Role => {
  const {user} = useUser();

  if (!user) {
    return "guest";
  }

  if (user.publicMetadata.role === "super-admin") {
    return "super-admin";
  }

  if (user.publicMetadata.role === "admin") {
    return "admin";
  }

  return "user";
};
