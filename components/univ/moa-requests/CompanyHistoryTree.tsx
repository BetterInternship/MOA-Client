// components/univ/moa-requests/CompanyHistoryTree.tsx
"use client";

import FilesDialog from "@/components/univ/dashboard/FilesDialog";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Paperclip, ChevronDown, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Message, MoaRequest } from "@/types/db";
import { useRequestThread } from "@/app/api/school.api";
import { Badge } from "@/components/ui/badge";
import { formatWhen } from "@/lib/format";

/**
 * Displays a history of the messages between the company and the uni for a given negotiated MOA.
 * Repeat: for a given negotiated MOA.
 *
 * @component
 */
export default function CompanyHistoryTree({ req }: { req?: MoaRequest }) {
  const thread = useRequestThread(req?.thread_id);
  const messages: Message[] = thread.messages ?? [];

  return (
    <>
      <ol className="space-y-4">
        {messages.map((message, i) => {
          const isSchool = message.source_type === "school";
          const timestampFormatted = formatWhen(message.timestamp);

          return (
            <li
              key={`${timestampFormatted}-${i}`}
              className={cn("flex", isSchool ? "justify-end" : "justify-start")}
            >
              <ChatBubble
                sender={message.source_type}
                timestamp={timestampFormatted}
                text={message.text ?? ""}
                attachments={(message.attachments as unknown as string[]) ?? []}
              />
            </li>
          );
        })}

        {messages.length === 0 && (
          <li className="text-muted-foreground text-sm">No history yet.</li>
        )}
      </ol>
    </>
  );
}

/**
 * Component for a single message.
 *
 * @component
 */
function ChatBubble({
  sender,
  timestamp,
  text,
  attachments,
}: {
  sender: string;
  timestamp: string;
  text: string;
  attachments?: string[];
}) {
  const isSchool = sender === "school";
  const hasAttachments = !!attachments?.length;

  return (
    <Collapsible
      className={cn(
        "max-w-[min(42rem,85%)]",
        isSchool ? "items-end" : "items-start",
        "flex flex-col gap-1"
      )}
    >
      <div className="flex flex-row items-center gap-2">
        <Badge type={!isSchool ? "primary" : "supportive"}>{isSchool ? "You" : "Entity"}</Badge>
        <time className="text-left text-xs text-gray-400">{timestamp}</time>
      </div>
      <div
        className={cn(
          !isSchool
            ? "border-l-primary border border-l-2"
            : "border-r-supportive border border-r-2",
          "bg-white/80 transition",
          "focus-within:shadow-md hover:cursor-pointer hover:shadow-xs",
          "px-3 py-1"
        )}
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex justify-between gap-2">
              <div className="text-muted-foreground mb-1 flex items-center gap-2 text-xs">
                {attachments?.length ? (
                  <span className="inline-flex items-center gap-1">
                    <Paperclip className="h-3.5 w-3.5" />
                    {attachments.length}
                  </span>
                ) : null}
              </div>

              {hasAttachments ? (
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground h-7 w-7 shrink-0"
                    aria-label="Toggle details"
                  >
                    <ChevronDown className="h-4 w-4 transition data-[state=open]:rotate-180" />
                  </Button>
                </CollapsibleTrigger>
              ) : null}
            </div>

            {/* short header */}
            <div className="flex flex-col gap-2">
              <p className="text-foreground min-w-0 text-sm break-words">{text}</p>
              <div className="flex flex-row gap-1">
                <Button className="" scheme="secondary">
                  <a href="" target="_blank">
                    <div className="flex flex-row items-center gap-1">
                      <Download />
                      MOA Document
                    </div>
                  </a>
                </Button>
                <Button variant="outline" disabled={!hasAttachments}>
                  <a href="#" target="_blank">
                    <div className="flex flex-row items-center gap-1">
                      <Download />
                      {hasAttachments ? "Attachments" : "No Additional Attachments"}
                    </div>
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* long body (collapsible) */}
        {hasAttachments && (
          <CollapsibleContent className="border-t pt-2 text-sm">
            {text ? <p className="text-foreground mb-2 whitespace-pre-line">{text}</p> : null}
            {attachments?.length ? (
              <div className="flex items-center gap-2">
                <Paperclip className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground">
                  {attachments.length} file{attachments.length > 1 ? "s" : ""}
                </span>
                <FilesDialog
                  files={attachments}
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      title={`View files (1)`}
                    >
                      View files
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="text-muted-foreground">No attachments</div>
            )}
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
}
