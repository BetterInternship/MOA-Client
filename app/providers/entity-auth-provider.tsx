"use client";

import React, { createContext, useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useAuthControllerEntitySelf,
  useAuthControllerSchoolSelf,
  useAuthControllerSchoolSignIn,
  useAuthControllerSchoolSignOut,
  useAuthControllerSignIn,
  useAuthControllerSignOut,
} from "../api";
import { Entity } from "@/types/db";

interface IEntityAuthContext {
  isAuthenticated: boolean;
  isSigningIn: boolean;
  isLoading: boolean;
  entity: Entity;

  // ! fix typing
  signIn: (legal_entity_name: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshAuthentication: () => void;

  // ! to implement later on
  // redirectIfNotLoggedIn: () => void;
  // redirectIfLoggedIn: () => void;
}

const EntityAuthContext = createContext<IEntityAuthContext>({} as IEntityAuthContext);

export const useEntityAuth = () => useContext(EntityAuthContext);

/**
 * Gives access to auth functions to the components inside it.
 *
 * @component
 */
export const EntityAuthContextProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [entity, setEntity] = useState<Entity>({} as Entity);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  // ! change this in the future, no need to rely on session storage?
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === "undefined") return false;
    const isAuthed = sessionStorage.getItem("entityIsAuthenticated");
    return isAuthed ? JSON.parse(isAuthed) : false;
  });

  // Auth hooks
  const entitySelf = useAuthControllerEntitySelf();
  const entitySignIn = useAuthControllerSignIn();
  const entitySignOut = useAuthControllerSignOut();

  // Save self details on hook
  const loadSelf = async () => {
    const self = await entitySelf.mutateAsync();
    // ! fix this type error, it probably has something to do with the generated orval
    setEntity((self as Entity) ?? null);
  };

  // Refresh 'self'; will only be work if cookie still exists and is valid (not exactly a 'refresh')
  const refreshAuthentication = async () => {
    setIsLoading(true);
    const self = await entitySelf.mutateAsync();

    if (self.entity) {
      setIsAuthenticated(true);
      await loadSelf();
    }

    setIsLoading(false);
  };

  useEffect(() => {
    entitySelf.mutateAsync().then(async () => (await loadSelf(), setIsLoading(false)));
  }, []);

  const signIn = async (legal_entity_name: string, password: string) => {
    setIsSigningIn(true);
    const signInResponse = await entitySignIn.mutateAsync({
      data: {
        legal_entity_name,
        password,
      },
    });

    if (signInResponse.success) {
      await setIsAuthenticated(true);
      await loadSelf();
    } else {
      setIsAuthenticated(false);
    }

    setIsSigningIn(false);
    setIsLoading(false);
    return signInResponse;
  };

  const signOut = async () => {
    const signOutResult = await entitySignOut.mutateAsync();
    setIsAuthenticated(false);
    setEntity({} as Entity);
  };

  // ! to implement
  // const redirectIfNotLoggedIn = () =>
  //   useEffect(() => {
  //     if (!isLoading && !isAuthenticated) router.push("/login");
  //   }, [isAuthenticated, isLoading]);

  // const redirectIfLoggedIn = () =>
  //   useEffect(() => {
  //     if (!isLoading && isAuthenticated) router.push("/search");
  //   }, [isAuthenticated, isLoading]);

  return (
    <EntityAuthContext.Provider
      value={{
        isLoading,
        isSigningIn,
        entity: entity,

        signIn,
        signOut,
        refreshAuthentication,
        isAuthenticated,
        // ! to implement
        // redirectIfNotLoggedIn,
        // redirectIfLoggedIn,
      }}
    >
      {children}
    </EntityAuthContext.Provider>
  );
};
