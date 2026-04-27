"use client";

import { HeaderIcon, HeaderText } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Users2 } from "lucide-react";
import { useSignatoryProfile } from "../auth/provider/signatory.ctx";
import StudentsTable from "@/components/docs/students/StudentsTable";
import type { Student } from "@/components/docs/students/StudentsTable";
import { useRouter } from "next/navigation";

export default function DocsStudentsPage() {
  const profile = useSignatoryProfile();
  const router = useRouter();
  const isLoggedIn = Boolean(profile?.email);
  const students: Student[] = [];

  if (!profile.coordinatorId) { 
    router.push('/dashboard')
    return <></>
  }

  if (profile.loading || !isLoggedIn) {
    return null;
  }

  return (
    <div className="max-w-8xl container mx-auto flex h-full min-h-0 flex-col gap-6 overflow-hidden px-4 pt-6 pb-4 sm:px-10 sm:pt-16 sm:pb-6">
      <div className="shrink-0 space-y-2">
        <div className="flex items-center gap-3">
          <HeaderIcon icon={Users2} />
          <HeaderText>My Students</HeaderText>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <Card className="min-h-0 flex-1 p-3">
          <StudentsTable students={students} />
        </Card>
      </div>
    </div>
  );
}
