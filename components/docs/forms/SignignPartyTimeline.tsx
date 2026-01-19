import { IFormSigningParty } from "@betterinternship/core/forms";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import { useFormProcess } from "./form-process.ctx";

interface SigningPartyTimelineProps {
  signingParties?: IFormSigningParty[];
}

export const SigningPartyTimeline = ({ signingParties }: SigningPartyTimelineProps) => {
  const formProcess = useFormProcess();

  if (!signingParties || signingParties.length === 0) {
    return null;
  }

  // Find the index of the current user
  const currentUserIndex = signingParties.findIndex(
    (party) => party._id === formProcess.my_signing_party_id
  );

  return (
    <Timeline>
      {signingParties.map((party, index) => {
        // Find the source party's title if signatory_source exists
        let sourceTitle = "";
        if (party.signatory_source?._id) {
          const sourceParty = signingParties.find((p) => p._id === party.signatory_source?._id);
          sourceTitle = sourceParty?.signatory_title.trim() || "";
        }

        // Check if this party is "You" (the person who initiated/sent the form)
        const isYou = party._id === formProcess.my_signing_party_id;
        const isSourceFromYou = party.signatory_source?._id === formProcess.my_signing_party_id;
        const isCompleted = index < currentUserIndex; // Parties before current user are completed
        const isCurrent = isYou; // Current signatory

        let displayTitle = party.signatory_title;
        if (isYou) {
          displayTitle = "You";
        }

        return (
          <TimelineItem
            key={party._id}
            number={isCompleted ? -1 : party.order} // Show checkmark for completed parties
            title={
              isCurrent ? (
                <div className="flex items-center gap-2 align-middle">
                  <span className="text-primary rounded bg-blue-100 px-2 py-1 text-sm font-medium">
                    {displayTitle}
                  </span>
                  <span className="bg-warning rounded-full px-2 py-0.5 text-xs font-semibold text-white">
                    Current
                  </span>
                </div>
              ) : isCompleted ? (
                <span className="rounded bg-emerald-50 px-2 py-1 text-sm font-medium text-emerald-700">
                  {displayTitle}
                </span>
              ) : (
                displayTitle
              )
            }
            subtitle={
              sourceTitle && (
                <div className={`flex items-center gap-2 ${isCompleted ? "text-emerald-600" : ""}`}>
                  <span>
                    email coming from{" "}
                    {isSourceFromYou ? (
                      <span className="text-primary rounded bg-blue-100 px-1.5 text-xs font-medium">
                        You
                      </span>
                    ) : isCompleted ? (
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
                        {sourceTitle}
                      </span>
                    ) : (
                      sourceTitle
                    )}
                  </span>
                </div>
              )
            }
            isLast={index === signingParties.length - 1}
          />
        );
      })}
    </Timeline>
  );
};
