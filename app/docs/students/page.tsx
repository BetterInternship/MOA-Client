"use client";

import { useEffect, useMemo, useState } from "react";
import { Users2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSignatoryProfile } from "../auth/provider/signatory.ctx";
import { useIsMobile } from "@/hooks/use-mobile";
import { FormGroupList } from "@/components/docs/students/FormGroupList";
import { FormGroupStudentsDetail } from "@/components/docs/students/FormGroupStudentsDetail";
import { MobileFormGroupDrawer } from "@/components/docs/students/MobileFormGroupDrawer";
import type { Student } from "@/components/docs/students/StudentsTable";
import type { FormGroup } from "@/components/docs/students/types";
import { useSignatoryControllerGetSignatoryFormGroups } from "@/app/api";

const formGroups: FormGroup[] = [{ id: "", description: "Test Forms", forms: [], code: "ABC123" }];
const students: Student[] = [];
const detailEnterTransition = {
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1] as const,
};
const detailExitTransition = {
  duration: 0.16,
  ease: [0.4, 0, 1, 1] as const,
};

export default function DocsStudentsPage() {
  const profile = useSignatoryProfile();
  const router = useRouter();
  const isMobile = useIsMobile();
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
  const loading = useMemo(() => isLoading || isFetching, [isLoading, isFetching]);

  const selectedFormGroup = useMemo(() => {
    return formGroups.find((group) => group.id === selectedFormGroupId) ?? null;
  }, [formGroups, selectedFormGroupId]);

  useEffect(() => {
    if (!profile.loading && isLoggedIn && !profile.coordinatorId) {
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

  const resetAccessCode = () => {
    toast.success("Access code reset.");
  };

  const clearStudentList = () => {
    toast.success("Student list cleared.");
  };

  if (profile.loading || !isLoggedIn || !profile.coordinatorId) {
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
                  students={students}
                  onCopyAccessCode={copyAccessCode}
                  onResetAccessCode={resetAccessCode}
                  onClearStudentList={clearStudentList}
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
        students={students}
        onCopyAccessCode={copyAccessCode}
        onResetAccessCode={resetAccessCode}
        onClearStudentList={clearStudentList}
      />
    </>
  );
}
