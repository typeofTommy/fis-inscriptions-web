"use client";

import {
  QueryClient,
  QueryClientProvider,
  isServer,
} from "@tanstack/react-query";
import * as React from "react";
import {Toaster} from "@/components/ui/toaster";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import {
  persistQueryClient,
  removeOldestQuery,
} from "@tanstack/query-sync-storage-persister";
import {get, set, del} from "idb-keyval";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: true,
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
      
      // Configure persistence
      if (typeof window !== "undefined") {
        persistQueryClient({
          queryClient: browserQueryClient,
          persister: {
            persistClient: async (client) => {
              await set("react-query-cache", client);
            },
            restoreClient: async () => {
              return await get("react-query-cache");
            },
            removeClient: async () => {
              await del("react-query-cache");
            },
          },
          maxAge: 1000 * 60 * 60 * 24, // 24 hours
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => {
              return query.state.status === "success";
            },
          },
        });
      }
    }
    return browserQueryClient;
  }
}

export function Providers(props: {children: React.ReactNode}) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
      <Toaster />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
