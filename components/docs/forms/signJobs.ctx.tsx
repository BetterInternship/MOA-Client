/**
 * @ Description:
 *
 * Tracks in-flight `docs.sign` jobs across navigation (plan
 * DOCS_SIGNING_RABBITMQ_MIGRATION_PLAN.md §8.1) — mirrors
 * `Client/hooks/forms/filloutFormProcess.tsx`'s `FilloutJobsProvider`, with
 * one adaptation: a signing row already exists in `my-forms` (you're signing
 * an *existing* form process), so completion is an in-progress state on that
 * existing row rather than a synthetic extra row. `FormActionButtons` opens
 * the success modal immediately on submit (S9) and just tracks the job; this
 * provider is what resolves it — refetching `my-forms` once the job lands so
 * the row's own `signed` flag catches up, and toasting once per job either
 * way. A failed job (S10) just untracks: the row was never optimistically
 * mutated, so it's already back to "unsigned" the moment tracking stops.
 */
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMQJobs } from "@betterinternship/components";
import { toast } from "sonner";
import { toastPresets } from "@/components/sonner-toaster";
import { useMyForms } from "./myforms.ctx";

const STORAGE_KEY = "bi.mq-jobs.docs-sign";

interface SignJobResult {
  formProcessId: string;
  signingPartyId: string;
  documentId: string | null;
  documentUrl: string;
}

interface TrackedSignJob {
  jobId: string;
  formProcessId: string;
  signingPartyId: string;
  label: string;
  timestamp: string;
}

interface SignJobsApi {
  jobs: TrackedSignJob[];
  track: (
    jobId: string,
    formProcessId: string,
    signingPartyId: string,
    label: string,
  ) => void;
  untrack: (jobId: string) => void;
}

const SignJobsContext = createContext<SignJobsApi | null>(null);

const readStoredJobs = (): TrackedSignJob[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TrackedSignJob[]) : [];
  } catch {
    return [];
  }
};

/** Mount once near the root, inside `<MQJobsProvider>` and `<MyFormsContextProvider>`. */
export const SignJobsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [jobs, setJobs] = useState<TrackedSignJob[]>(readStoredJobs);
  const notified = useRef<Set<string>>(new Set());
  const refetchedFor = useRef<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const myForms = useMyForms();

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    } catch {
      // Best-effort; a full storage quota shouldn't break the signing flow.
    }
  }, [jobs]);

  const track = useCallback(
    (
      jobId: string,
      formProcessId: string,
      signingPartyId: string,
      label: string,
    ) => {
      setJobs((prev) =>
        prev.some((job) => job.jobId === jobId)
          ? prev
          : [
              ...prev,
              {
                jobId,
                formProcessId,
                signingPartyId,
                label,
                timestamp: new Date().toISOString(),
              },
            ],
      );
    },
    [],
  );

  const untrack = useCallback((jobId: string) => {
    notified.current.delete(jobId);
    refetchedFor.current.delete(jobId);
    setJobs((prev) => prev.filter((job) => job.jobId !== jobId));
  }, []);

  const jobIds = useMemo(() => jobs.map((job) => job.jobId), [jobs]);
  const polled = useMQJobs<SignJobResult>(jobIds);

  // Toast once per job, and get `my-forms` refetching the moment a job
  // completes — its own `signing_parties` won't show the new signature
  // until that refetch lands.
  useEffect(() => {
    for (const entry of polled) {
      if (!entry.isDone && !entry.isFailed) continue;
      const tracked = jobs.find((job) => job.jobId === entry.jobId);
      const label = tracked?.label ?? "form";

      if (!notified.current.has(entry.jobId)) {
        notified.current.add(entry.jobId);
        if (entry.isDone) {
          toast.success(`Signed ${label}`, {
            id: entry.jobId,
            duration: 2000,
            ...toastPresets.success,
          });
        } else {
          toast.error(`Could not sign ${label}: ${entry.error}`, {
            id: entry.jobId,
            duration: 2000,
            ...toastPresets.destructive,
          });
        }
      }

      if (entry.isFailed) {
        // S10: nothing was optimistically mutated, so untracking alone
        // returns the row to its normal (unsigned) rendering.
        untrack(entry.jobId);
        continue;
      }

      if (entry.isDone && !refetchedFor.current.has(entry.jobId)) {
        refetchedFor.current.add(entry.jobId);
        void queryClient.refetchQueries({ queryKey: ["my-forms"] });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polled]);

  // Once the refetched row shows this party signed, stop tracking (and
  // polling) it — mirrors fillout's reconciliation.
  useEffect(() => {
    for (const job of jobs) {
      const row = myForms.forms.find(
        (form) => form.form_process_id === job.formProcessId,
      );
      const party = row?.signing_parties.find(
        (party) => party._id === job.signingPartyId,
      );
      if (party?.signed) untrack(job.jobId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myForms.forms]);

  const api = useMemo<SignJobsApi>(
    () => ({ jobs, track, untrack }),
    [jobs, track, untrack],
  );

  return (
    <SignJobsContext.Provider value={api}>{children}</SignJobsContext.Provider>
  );
};

const useSignJobsApi = () => {
  const ctx = useContext(SignJobsContext);
  if (!ctx)
    throw new Error("Sign job hooks must be used within a <SignJobsProvider>.");
  return ctx;
};

export const useTrackSignJob = () => {
  const { track } = useSignJobsApi();
  return track;
};

/** Is this form process's next signature currently in flight? */
export const useSignJobForProcess = (formProcessId: string) => {
  const { jobs } = useSignJobsApi();
  const job = jobs.find((job) => job.formProcessId === formProcessId);
  const jobIds = useMemo(() => (job ? [job.jobId] : []), [job]);
  const polled = useMQJobs<SignJobResult>(jobIds);
  return job ? (polled[0] ?? null) : null;
};
