"use client";

import {
  QueryClient,
  QueryClientProvider,
  isServer,
} from "@tanstack/react-query";
import * as React from "react";
import {Toaster} from "@/components/ui/toaster";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import {get, set} from "idb-keyval";

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

      // Configure simple persistence
      if (typeof window !== "undefined") {
        const restoreFromStorage = async () => {
          try {
            const persistedData = await get("react-query-cache");
            if (persistedData) {
              browserQueryClient!.setQueryData(["persisted"], persistedData);
            }
          } catch (error) {
            console.warn("Failed to restore query cache:", error);
          }
        };

        restoreFromStorage();

        // Save cache periodically
        setInterval(() => {
          try {
            const cache = browserQueryClient!.getQueryCache().getAll();
            const successfulQueries = cache.filter(
              (query) => query.state.status === "success"
            );
            if (successfulQueries.length > 0) {
              set(
                "react-query-cache",
                successfulQueries.map((q) => ({
                  queryKey: q.queryKey,
                  queryHash: q.queryHash || "",
                  state: q.state,
                }))
              );
            }
          } catch (error) {
            console.warn("Failed to persist query cache:", error);
          }
        }, 30000); // Save every 30 seconds
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
