import {useUser} from "@clerk/nextjs";

type Role = "admin" | "user" | "guest";

export const useRole = (): Role => {
  const {user} = useUser();

  if (!user) {
    return "guest";
  }

  if (user.publicMetadata.role === "admin") {
    return "admin";
  }

  return "user";
};
