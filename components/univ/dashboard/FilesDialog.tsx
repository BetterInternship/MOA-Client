// components/univ/shared/FilesDialog.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ExternalLink, FolderOpen } from "lucide-react";

type FilesDialogProps = {
  files?: string[];
  title?: string;
  /** Optional custom trigger; if omitted, a default "Open files" button is used */
  trigger?: React.ReactNode;
  triggerClassName?: string;
};

function openFilesInNewTabs(files: string[]) {
  // Opening multiple tabs may be blocked by pop-up blockers; keep counts modest.
  for (const f of files) {
    try {
      window.open(f, "_blank", "noopener,noreferrer");
    } catch (e) {
      console.error("Open error:", e);
    }
  }
}

export default function FilesDialog({
  files = [],
  title = "Files",
  trigger,
  triggerClassName,
}: FilesDialogProps) {
  const [open, setOpen] = React.useState(false);

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className={triggerClassName}
      disabled={!files || files.length === 0}
    >
      <FolderOpen className="mr-2 h-4 w-4" />
      Open files
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>

      <DialogContent
        className="max-w-none overflow-hidden p-0"
        style={{ width: "fit-content", maxWidth: "min(95vw, 1200px)", maxHeight: "85vh" }}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <DialogHeader className="bg-background sticky top-0 z-10 border-b px-6 pt-6 pb-3">
            <DialogTitle>
              {title} ({files.length})
            </DialogTitle>
          </DialogHeader>

          {/* Scrollable body */}
          <div className="flex-1 overflow-x-hidden overflow-y-auto px-6 py-4">
            <div className="space-y-3">
              <div className="rounded-md border p-2">
                {files.length === 0 ? (
                  <div className="text-muted-foreground text-sm">No files.</div>
                ) : (
                  <ul className="space-y-2">
                    {files.map((f) => (
                      <li key={f} className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          {/* Make file name a link */}
                          <a
                            href={f}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block truncate break-words underline-offset-2 hover:underline"
                            title="attachment"
                          >
                            attachment
                          </a>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => openFilesInNewTabs([f])}
                          title={`Open attachment`}
                          aria-label={`Open attachment`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
