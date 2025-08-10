import { useQuery } from "@tanstack/react-query";

export const useUserEmail = (userId: string | null | undefined) => {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        return userId; // Fallback to ID if user not found
      }
      
      const data = await response.json();
      return data.email;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};