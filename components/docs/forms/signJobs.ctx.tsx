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

// A resolved row often stops matching whatever status-tab filter surfaced it
// (e.g. "Needs signing" once *your* party is signed) — settling first lets
// the resolved content actually be seen; exiting is the collapse before the
// row is finally dropped from the held set.
const SETTLE_MS = 700;
const EXIT_MS = 220;

type HeldPhase = "settling" | "exiting";

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
  heldPhase: Record<string, HeldPhase>;
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

  const [heldPhase, setHeldPhase] = useState<Record<string, HeldPhase>>({});
  const holdTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const beginHold = useCallback((formProcessId: string) => {
    clearTimeout(holdTimers.current[formProcessId]);
    setHeldPhase((prev) => ({ ...prev, [formProcessId]: "settling" }));
    holdTimers.current[formProcessId] = setTimeout(() => {
      setHeldPhase((prev) => ({ ...prev, [formProcessId]: "exiting" }));
      holdTimers.current[formProcessId] = setTimeout(() => {
        setHeldPhase((prev) => {
          if (!(formProcessId in prev)) return prev;
          const next = { ...prev };
          delete next[formProcessId];
          return next;
        });
        delete holdTimers.current[formProcessId];
      }, EXIT_MS);
    }, SETTLE_MS);
  }, []);

  useEffect(() => {
    const timers = holdTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

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
  // polling) it — mirrors fillout's reconciliation. A tab's status filter
  // (e.g. "Needs signing") typically stops matching the row in this same
  // tick, which would otherwise yank it out instantly — `beginHold` keeps it
  // rendered a little longer so `useHeldFormProcessIds` can hold the row in
  // view while it settles into its new state, then collapses out.
  useEffect(() => {
    for (const job of jobs) {
      const row = myForms.forms.find(
        (form) => form.form_process_id === job.formProcessId,
      );
      const party = row?.signing_parties.find(
        (party) => party._id === job.signingPartyId,
      );
      if (party?.signed) {
        beginHold(job.formProcessId);
        untrack(job.jobId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myForms.forms]);

  const api = useMemo<SignJobsApi>(
    () => ({ jobs, heldPhase, track, untrack }),
    [jobs, heldPhase, track, untrack],
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

/**
 * `formProcessId`s with a sign job currently tracked — for row-level
 * "this whole row is mid-signature" styling, as opposed to
 * `useSignJobForProcess`'s per-cell detailed status.
 *
 * Deliberately keyed on *tracked*, not the job's own polled `isPending` —
 * the job itself flips to `done` as soon as the server finishes signing,
 * which is faster than the separate `my-forms` refetch that actually
 * updates this row's `signing_parties`. Reading `isPending` here left a gap
 * where the job already reports done but the row's own data hasn't caught
 * up yet, so callers would evaluate the *old* data and could render the
 * pre-signature state for a moment. `jobs` (tracked) stays true across that
 * whole gap by design — untracking only happens once the fresh data lands.
 */
export const usePendingSignFormProcessIds = (): Set<string> => {
  const { jobs } = useSignJobsApi();
  return useMemo(
    () => new Set(jobs.map((job) => job.formProcessId)),
    [jobs],
  );
};

/**
 * `formProcessId`s that just resolved and should still render even though
 * they may no longer match whatever filter surfaced them (settling, so the
 * resolved state is visible; exiting, mid-collapse) — union this into a
 * status-tab's filtered rows so the row doesn't just vanish.
 */
export const useHeldFormProcessIds = (): Set<string> => {
  const { heldPhase } = useSignJobsApi();
  return useMemo(() => new Set(Object.keys(heldPhase)), [heldPhase]);
};

/** `formProcessId`s currently in their collapse-out animation. */
export const useExitingFormProcessIds = (): Set<string> => {
  const { heldPhase } = useSignJobsApi();
  return useMemo(
    () =>
      new Set(
        Object.entries(heldPhase)
          .filter(([, phase]) => phase === "exiting")
          .map(([formProcessId]) => formProcessId),
      ),
    [heldPhase],
  );
};
