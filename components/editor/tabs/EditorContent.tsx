"use client";

import { useFormEditor } from "@/app/contexts/form-editor.context";
import { FormEditorTab } from "@/components/editor/tab-panels/FormEditorTab";
import { FormPreviewTab } from "@/components/editor/tab-panels/FormPreviewTab";
import { FormMetadataTab } from "@/components/editor/tab-panels/FormMetadataTab";
import { SigningPartiesTab } from "@/components/editor/tab-panels/SigningPartiesTab";
import { SubscribersTab } from "@/components/editor/tab-panels/SubscribersTab";
import { FormSettingsTab } from "@/components/editor/tab-panels/FormSettingsTab";

export function EditorContent() {
  const { activeTab } = useFormEditor();

  return (
    <div className="h-full w-full">
      {activeTab === "editor" && <FormEditorTab />}
      {activeTab === "preview" && <FormPreviewTab />}
      {activeTab === "metadata" && <FormMetadataTab />}
      {activeTab === "parties" && <SigningPartiesTab />}
      {activeTab === "subscribers" && <SubscribersTab />}
      {activeTab === "settings" && <FormSettingsTab />}
    </div>
  );
}
