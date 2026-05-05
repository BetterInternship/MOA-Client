"use client";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { FormGroupStudentsDetail } from "./FormGroupStudentsDetail";
import type { FormGroupMember } from "./StudentsTable";
import type { FormGroup } from "./types";

export function MobileFormGroupDrawer({
  open,
  onOpenChange,
  formGroup,
  members,
  onCopyAccessCode,
  onRefreshMemberList,
  isRefreshingMemberList,
  onResetAccessCode,
  onClearMemberList,
  onRemoveMember,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formGroup: FormGroup | null;
  members: FormGroupMember[];
  onCopyAccessCode: (code: string) => void | Promise<void>;
  onRefreshMemberList: () => void | Promise<void>;
  isRefreshingMemberList?: boolean;
  onResetAccessCode: () => void;
  onClearMemberList: () => void;
  onRemoveMember: (formGroupId: string, memberId: string) => void | Promise<void>;
}) {
  return (
    <Drawer open={open && Boolean(formGroup)} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="h-[100svh] max-h-[100svh] min-h-[100svh] rounded-none! data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-[100svh] data-[vaul-drawer-direction=bottom]:rounded-none">
        {formGroup && (
          <>
            <DrawerHeader className="sr-only">
              <DrawerTitle>{formGroup.description}</DrawerTitle>
              <DrawerDescription>Students with access to this form group.</DrawerDescription>
            </DrawerHeader>
            <div className="min-h-0 flex-1 overflow-hidden p-4 pt-5">
              <FormGroupStudentsDetail
                formGroup={formGroup}
                members={members}
                onCopyAccessCode={onCopyAccessCode}
                onRefreshStudentList={onRefreshMemberList}
                isRefreshingStudentList={isRefreshingMemberList}
                onResetAccessCode={onResetAccessCode}
                onClearStudentList={onClearMemberList}
                onRemoveMember={onRemoveMember}
              />
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
