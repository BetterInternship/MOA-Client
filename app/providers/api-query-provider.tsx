"use client";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import {
  persistQueryClient,
  PersistQueryClientProvider,
} from "@tanstack/react-query-persist-client";

// Default expiry times are 1 day
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000, // ! lol change this back to 1 day eventually
      staleTime: 1000, // ! lol change this back to 1 day eventually
    },
  },
});

// This is basically localStorage
const asyncStoragePersister = createAsyncStoragePersister({
  storage: typeof window === "undefined" ? undefined : AsyncStorage,
});

persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
  maxAge: 1000, // ! lol change this back to 1 day eventually
});

/**
 * Allows us to use tanstack queries anywhere in the app.
 *
 * @provider
 */
export default function ApiQueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        maxAge: 24 * 60 * 60 * 1000,
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
