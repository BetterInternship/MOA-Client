// components/univ/moa-requests/CompanyHistoryTree.tsx
"use client";

import FilesDialog from "@/components/univ/dashboard/FilesDialog";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Paperclip, ChevronDown, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Message, MoaRequest } from "@/types/db";
import { useMoaRequests, useRequestThread } from "@/app/api/entity.api";
import { Badge } from "@/components/ui/badge";
import { formatWhen } from "@/lib/format";
import { Loader } from "@/components/ui/loader";
import CustomCard from "@/components/shared/CustomCard";
import { useState } from "react";
import MoaRequestResponseActions from "@/components/univ/entity-requests/MOARequestForResponse";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/ui/file-upload";
import { fi } from "zod/v4/locales";

interface EntityConversationProps {
  req?: MoaRequest;
}

/**
 * Displays a history of the messages between the company and the uni for a given negotiated MOA.
 * Repeat: for a given negotiated MOA.
 *
 * @component
 */
export const EntitySchoolConversation = ({ req }: EntityConversationProps) => {
  const moaRequests = useMoaRequests();
  const [loading, setLoading] = useState(false);
  const thread = useRequestThread(req?.thread_id);
  const messages: Message[] = thread.messages ?? [];

  if (thread.isLoading) return <Loader />;
  if (!messages.length) {
    return (
      <CustomCard>
        <li className="text-muted-foreground text-sm">No history yet.</li>
      </CustomCard>
    );
  }

  return (
    <>
      <div className="p flex max-h-full flex-1 flex-col-reverse justify-between overflow-auto px-4">
        <ol className="mt-4 space-y-4">
          {messages
            .toSorted((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
            .map((message, i) => {
              const isSchool = message.source_type === "school";
              const timestampFormatted = formatWhen(message.timestamp);

              return (
                <li
                  key={`${timestampFormatted}-${i}`}
                  className={cn("flex", !isSchool ? "justify-end" : "justify-start")}
                >
                  <ChatBubble
                    sender={message.source_type}
                    timestamp={timestampFormatted}
                    text={message.text ?? ""}
                    action={message.action}
                    document={message.moa_document}
                    attachments={(message.attachments as unknown as string[]) ?? []}
                  />
                </li>
              );
            })}
        </ol>
      </div>
      <MoaRequestResponseActions
        onRespond={async (message, file) => {
          console.log(message, file);
          setLoading(true);
          await moaRequests.respond({
            id: req?.id,
            data: {
              message,
              revised_moa: file,
            },
          });
          await thread.refetch();
          setLoading(false);
        }}
        loading={loading}
        allowUpload={true}
      />
    </>
  );
};

/**
 * Component for a single message.
 *
 * @component
 */
function ChatBubble({
  sender,
  timestamp,
  text,
  action,
  attachments,
  document,
}: {
  sender: string;
  timestamp: string;
  text: string;
  action?: string | null;
  attachments?: string[];
  document?: string | null;
}) {
  const isSchool = sender === "school";
  const hasAttachments = !!attachments?.length;

  return (
    <Collapsible
      className={cn(
        "max-w-[min(42rem,85%)]",
        !isSchool ? "items-end" : "items-start",
        "flex flex-col gap-1"
      )}
    >
      <div className="flex flex-row items-center gap-2">
        <Badge type={isSchool ? "primary" : "supportive"}>{isSchool ? "School" : "You"}</Badge>
        <time className="text-left text-xs text-gray-400">{timestamp}</time>
      </div>
      <div
        className={cn(
          "flex",
          isSchool
            ? "border-l-primary justify-start border border-l-2 text-left"
            : "border-r-supportive justify-end border border-r-2 text-right",
          "bg-white/80 transition",
          "focus-within:shadow-md hover:cursor-pointer hover:shadow-xs",
          "px-3 py-1"
        )}
      >
        <div className="mb-1 flex items-start justify-between gap-4">
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
              {(document || hasAttachments) && (
                <div className="flex flex-row gap-1">
                  {document && (
                    <Button
                      variant="outline"
                      className=""
                      scheme={action === "sign-approve" ? "supportive" : "secondary"}
                    >
                      <a href={document} target="_blank">
                        <div className="flex flex-row items-center gap-1">
                          <Download />
                          {action === "sign-approve" ? <>Approved MOA</> : <>Revised MOA</>}
                        </div>
                      </a>
                    </Button>
                  )}
                  {hasAttachments && (
                    <Button variant="outline">
                      <a href="#" target="_blank">
                        <div className="flex flex-row items-center gap-1">
                          <Download />
                          "Additional Attachments"
                        </div>
                      </a>
                    </Button>
                  )}
                </div>
              )}
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

export default EntitySchoolConversation;
