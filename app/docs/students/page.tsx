"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Users2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useSignatoryProfile } from "../auth/provider/signatory.ctx";
import { useIsMobile } from "@/hooks/use-mobile";
import { FormGroupList } from "@/components/docs/students/FormGroupList";
import { FormGroupStudentsDetail } from "@/components/docs/students/FormGroupStudentsDetail";
import { MobileFormGroupDrawer } from "@/components/docs/students/MobileFormGroupDrawer";
import type { FormGroupMember } from "@/components/docs/students/StudentsTable";
import type { FormGroup } from "@/components/docs/students/types";
import {
  getSignatoryControllerGetSignatoryFormGroupMembersQueryKey,
  getSignatoryControllerGetSignatoryFormGroupsQueryKey,
  signatoryControllerClearFormGroupMembers,
  signatoryControllerRemoveFormGroupMember,
  signatoryControllerResetFormGroupCode,
  type SignatoryControllerGetSignatoryFormGroupMembersQueryResult,
  type SignatoryControllerGetSignatoryFormGroupsQueryResult,
  useSignatoryControllerGetSignatoryFormGroupMembers,
  useSignatoryControllerGetSignatoryFormGroups,
} from "@/app/api";
import { Loader } from "@/components/ui/loader";

const detailEnterTransition = {
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1] as const,
};
const detailExitTransition = {
  duration: 0.16,
  ease: [0.4, 0, 1, 1] as const,
};

function getRequestErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message.replace(/^Error:\s*/, "");
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }

  return fallback;
}

export default function DocsStudentsPage() {
  const profile = useSignatoryProfile();
  const router = useRouter();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const isLoggedIn = Boolean(profile?.email);
  const {
    data: { formGroups } = { formGroups: [] },
    isLoading,
    isFetching,
  } = useSignatoryControllerGetSignatoryFormGroups();
  const [selectedFormGroupId, setSelectedFormGroupId] = useState<string | null>(null);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
  const sortedFormGroups = formGroups.toSorted((a, b) =>
    a.description.localeCompare(b.description)
  );
  const { data: { formGroupMembers } = { formGroupMembers: [] } } =
    useSignatoryControllerGetSignatoryFormGroupMembers(selectedFormGroupId);
  const loading = useMemo(() => isLoading || isFetching, [isLoading, isFetching]);

  const selectedFormGroup = useMemo(() => {
    return formGroups.find((group) => group.id === selectedFormGroupId) ?? null;
  }, [formGroups, selectedFormGroupId]);

  useEffect(() => {
    if (!loading && !profile.loading && isLoggedIn && !profile.coordinatorId) {
      router.push("/dashboard");
    }
  }, [isLoggedIn, profile.coordinatorId, profile.loading, router]);

  useEffect(() => {
    if (!isMobile) {
      setIsMobileDetailOpen(false);
    }
  }, [isMobile]);

  const handleSelectFormGroup = (formGroup: FormGroup) => {
    setSelectedFormGroupId(formGroup.id);
    if (isMobile) {
      setIsMobileDetailOpen(true);
    }
  };

  const copyAccessCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Access code copied.");
    } catch {
      toast.error("Failed to copy access code.");
    }
  };

  const resetAccessCode = useCallback(async () => {
    if (!selectedFormGroupId) return toast.error("No form group selected.");

    try {
      const response = await signatoryControllerResetFormGroupCode({
        formGroupId: selectedFormGroupId,
      });

      if (!response.success) {
        toast.error(response.message || "Failed to reset access code.");
        return;
      }

      const code = response.code;

      // This updates the cached value so it reflects properly
      // This is a very common pattern, so find a way to make this easy to replicate
      queryClient.setQueryData<SignatoryControllerGetSignatoryFormGroupsQueryResult>(
        getSignatoryControllerGetSignatoryFormGroupsQueryKey(),
        (current) => {
          if (!current) return current;

          return {
            ...current,
            formGroups: current.formGroups.map((formGroup) =>
              formGroup.id === selectedFormGroupId ? { ...formGroup, code } : formGroup
            ),
          };
        }
      );

      toast.success("Access code reset.");
    } catch (error) {
      toast.error(getRequestErrorMessage(error, "Failed to reset access code."));
    }
  }, [queryClient, selectedFormGroupId]);

  const clearStudentList = useCallback(async () => {
    if (!selectedFormGroupId) return toast.error("No form group selected.");

    try {
      const response = await signatoryControllerClearFormGroupMembers({
        formGroupId: selectedFormGroupId,
      });

      if (!response.success) {
        toast.error(response.message || "Failed to clear student list.");
        return;
      }

      queryClient.setQueryData<SignatoryControllerGetSignatoryFormGroupMembersQueryResult>(
        getSignatoryControllerGetSignatoryFormGroupMembersQueryKey(selectedFormGroupId),
        (current) => {
          if (!current) return current;

          return {
            ...current,
            formGroupMembers: [],
          };
        }
      );

      toast.success("Student list cleared.");
    } catch (error) {
      toast.error(getRequestErrorMessage(error, "Failed to clear student list."));
    }
  }, [queryClient, selectedFormGroupId]);

  const removeFormGroupMember = useCallback(
    async (formGroupId: string, userId: string) => {
      try {
        const response = await signatoryControllerRemoveFormGroupMember({
          formGroupId,
          userId,
        });

        if (!response.success) {
          toast.error(response.message || "Failed to remove student.");
          return;
        }

        queryClient.setQueryData<SignatoryControllerGetSignatoryFormGroupMembersQueryResult>(
          getSignatoryControllerGetSignatoryFormGroupMembersQueryKey(formGroupId),
          (current) => {
            if (!current) return current;

            return {
              ...current,
              formGroupMembers: current.formGroupMembers.filter((member) => member.id !== userId),
            };
          }
        );

        toast.success("Student removed.");
      } catch (error) {
        toast.error(getRequestErrorMessage(error, "Failed to remove student."));
      }
    },
    [queryClient]
  );

  if (loading || profile.loading) {
    return <Loader>Loading...</Loader>;
  }

  if (!isLoggedIn || !profile.coordinatorId) {
    return null;
  }

  return (
    <>
      <div className="grid h-full min-h-0 w-full grid-rows-[minmax(0,1fr)] overflow-hidden bg-gray-50 md:grid-cols-[clamp(260px,32vw,420px)_minmax(0,1fr)]">
        <FormGroupList
          formGroups={sortedFormGroups as FormGroup[]}
          selectedFormGroupId={selectedFormGroupId}
          onSelectFormGroup={handleSelectFormGroup}
          onCopyAccessCode={copyAccessCode}
        />

        <section className="hidden min-h-0 flex-col gap-3 overflow-hidden p-3 sm:p-4 md:flex">
          <AnimatePresence mode="wait" initial={false}>
            {selectedFormGroup ? (
              <motion.div
                key={selectedFormGroup.id}
                className="flex min-h-0 flex-1 flex-col will-change-transform"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0, transition: detailEnterTransition }}
                exit={{ opacity: 0, y: -8, transition: detailExitTransition }}
              >
                <FormGroupStudentsDetail
                  formGroup={selectedFormGroup as FormGroup}
                  members={formGroupMembers as FormGroupMember[]}
                  onCopyAccessCode={copyAccessCode}
                  onResetAccessCode={resetAccessCode}
                  onClearStudentList={clearStudentList}
                  onRemoveMember={removeFormGroupMember}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                className="flex min-h-0 flex-1 items-center justify-center bg-white p-6 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: detailEnterTransition }}
                exit={{ opacity: 0, y: -8, transition: detailExitTransition }}
              >
                <div className="flex max-w-sm flex-col items-center gap-3 text-gray-500">
                  <Users2 className="h-12 w-12 opacity-40" />
                  <p className="text-sm">No form group selected.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      <MobileFormGroupDrawer
        open={isMobileDetailOpen}
        onOpenChange={setIsMobileDetailOpen}
        formGroup={selectedFormGroup as FormGroup | null}
        students={formGroupMembers as FormGroupMember[]}
        onCopyAccessCode={copyAccessCode}
        onResetAccessCode={resetAccessCode}
        onClearStudentList={clearStudentList}
        onRemoveMember={removeFormGroupMember}
      />
    </>
  );
}
