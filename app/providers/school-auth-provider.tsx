"use client";

import React, { createContext, useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useAuthControllerSchoolSelf,
  useAuthControllerSchoolSignIn,
  useAuthControllerSchoolSignOut,
} from "../api";
import { School, SchoolAccount } from "@/types/db";

interface ISchoolAuthContext {
  isAuthenticated: boolean;
  isSigningIn: boolean;
  isLoading: boolean;

  school: School;
  schoolAccount: SchoolAccount;

  // ! fix typing
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshAuthentication: () => void;

  // ! to implement later on
  // redirectIfNotLoggedIn: () => void;
  // redirectIfLoggedIn: () => void;
}

const SchoolAuthContext = createContext<ISchoolAuthContext>({} as ISchoolAuthContext);

export const useSchoolAuth = () => useContext(SchoolAuthContext);

/**
 * Gives access to auth functions to the components inside it.
 *
 * @component
 */
export const SchoolAuthContextProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [school, setSchool] = useState<School>({} as School);
  const [schoolAccount, setSchoolAccount] = useState<SchoolAccount>({} as SchoolAccount);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === "undefined") return false;
    const isAuthed = sessionStorage.getItem("is_authenticated");
    return isAuthed ? JSON.parse(isAuthed) : false;
  });

  // Auth hooks
  const schoolSelf = useAuthControllerSchoolSelf();
  const schoolSignIn = useAuthControllerSchoolSignIn();
  const schoolSignOut = useAuthControllerSchoolSignOut();

  // Save self details on hook
  const loadSelf = async () => {
    const self = await schoolSelf.mutateAsync();
    setSchool((self.school as School) ?? null);
    setSchoolAccount((self.schoolAccount as SchoolAccount) ?? null);
  };

  // Refresh 'self'; will only be work if cookie still exists and is valid (not exactly a 'refresh')
  const refreshAuthentication = async () => {
    setIsLoading(true);
    const self = await schoolSelf.mutateAsync();

    if (self.school && self.schoolAccount) {
      setIsAuthenticated(true);
      await loadSelf();
    }

    setIsLoading(false);
  };

  useEffect(() => {
    schoolSelf.mutateAsync().then(async () => (await loadSelf(), setIsLoading(false)));
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsSigningIn(true);
    const signInResponse = await schoolSignIn.mutateAsync({
      data: {
        email,
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
    const signOutResult = await schoolSignOut.mutateAsync();
    setIsAuthenticated(false);
    setSchool({} as School);
    setSchoolAccount({} as SchoolAccount);
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
    <SchoolAuthContext.Provider
      value={{
        isLoading,
        isSigningIn,
        school,
        schoolAccount,

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
    </SchoolAuthContext.Provider>
  );
};
