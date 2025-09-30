"use client";

import { useQuery } from "@tanstack/react-query";

type OrganizationConfig = {
  id: number;
  code: string;
  name: string;
  country: string;
  baseUrl: string;
  fromEmail: string;
  logo?: string;
  emails: {
    all_races: Array<{ email: string; name: string; reason: string }>;
    women: Array<{ email: string; name: string; reason: string }>;
    men: Array<{ email: string; name: string; reason: string }>;
  };
  contacts: {
    responsible_for_entry: {
      address: string;
      men: {
        name: string;
        phone: string;
        email: string;
      };
      women: {
        name: string;
        phone: string;
        email: string;
      };
    };
    signature: {
      name: string;
      title: string;
    };
  };
  createdAt?: Date;
  updatedAt?: Date;
};

const fetchOrganization = async (code: string): Promise<OrganizationConfig> => {
  const response = await fetch(`/api/config/organization?code=${code}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch organization: ${response.statusText}`);
  }

  return response.json();
};

export const useOrganization = (code: string = "FFS") => {
  return useQuery({
    queryKey: ["organization", code],
    queryFn: () => fetchOrganization(code),
    staleTime: 10 * 60 * 1000, // 10 minutes - config rarely changes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
};