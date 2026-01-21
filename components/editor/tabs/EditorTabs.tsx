"use client";

import { useFormEditor, type EditorTab } from "@/app/contexts/form-editor.context";
import { FileText, Eye, FileJson, Users, Mail, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const TAB_CONFIG: Array<{
  id: EditorTab;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}> = [
  {
    id: "editor",
    label: "Form Editor",
    shortLabel: "Editor",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "preview",
    label: "Form Preview",
    shortLabel: "Preview",
    icon: <Eye className="h-5 w-5" />,
  },
  {
    id: "metadata",
    label: "Form Metadata",
    shortLabel: "Metadata",
    icon: <FileJson className="h-5 w-5" />,
  },
  {
    id: "parties",
    label: "Signing Parties",
    shortLabel: "Parties",
    icon: <Users className="h-5 w-5" />,
  },
  {
    id: "subscribers",
    label: "Subscribers",
    shortLabel: "Subscribers",
    icon: <Mail className="h-5 w-5" />,
  },
  {
    id: "settings",
    label: "Form Settings",
    shortLabel: "Settings",
    icon: <Settings className="h-5 w-5" />,
  },
];

export function EditorTabs() {
  const { activeTab, setActiveTab } = useFormEditor();

  return (
    <div className="bg-card flex w-20 flex-col border-r pt-2">
      <div className="flex flex-col gap-1 px-2">
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 rounded-md px-1.5 py-3 transition-all duration-200",
              activeTab === tab.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
            title={tab.label}
          >
            {tab.icon}
            <span className="max-w-[60px] text-center text-[10px] leading-tight font-medium">
              {tab.shortLabel}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
