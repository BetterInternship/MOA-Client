"use client";

import { useState } from "react";
import { type IFormSubscriber } from "@betterinternship/core/forms";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { validateEmail } from "@/lib/validators";
import { toast } from "sonner";
import { toastPresets } from "@/components/sonner-toaster";

interface SubscribersPanelProps {
  subscribers: IFormSubscriber[];
  onSubscribersChange: (subscribers: IFormSubscriber[]) => void;
}

export const SubscribersPanel = ({ subscribers, onSubscribersChange }: SubscribersPanelProps) => {
  const safeSubscribers = Array.isArray(subscribers) ? subscribers : [];
  const [emailErrors, setEmailErrors] = useState<Record<number, string | null>>({});

  const handleEmailChange = (index: number, email: string) => {
    const updated = [...safeSubscribers];
    updated[index] = { ...updated[index], email };
    onSubscribersChange(updated);
    setEmailErrors((prev) => ({ ...prev, [index]: null }));
  };

  const handleEmailBlur = (index: number) => {
    const value = (safeSubscribers[index]?.email || "").trim();
    const validation = validateEmail(value);
    if (!validation.valid) {
      const errorMessage = validation.error || "Invalid email";
      setEmailErrors((prev) => ({ ...prev, [index]: errorMessage }));
      toast.error(errorMessage, toastPresets.error);
      return;
    }
    setEmailErrors((prev) => ({ ...prev, [index]: null }));
  };

  const handleDeleteSubscriber = (index: number) => {
    const updated = safeSubscribers.filter((_, i) => i !== index);
    onSubscribersChange(updated);
    setEmailErrors((prev) => {
      const next: Record<number, string | null> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const numericKey = Number(k);
        if (numericKey < index) next[numericKey] = v;
        if (numericKey > index) next[numericKey - 1] = v;
      });
      return next;
    });
  };

  const handleAddSubscriber = () => {
    const newSubscriber: IFormSubscriber = { email: "" } as IFormSubscriber;
    onSubscribersChange([...safeSubscribers, newSubscriber]);
  };

  return (
    <div className="w-full">
      {safeSubscribers.length === 0 ? (
        <Card className="border border-dashed border-slate-300 p-6 text-center">
          <p className="text-sm text-slate-500">No subscribers yet</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {safeSubscribers.map((subscriber, index) => {
            const emailError = emailErrors[index];

            return (
              <Card
                key={`subscriber-${index}`}
                className="gap-0 border border-slate-200 bg-white px-3 py-3 transition-all duration-150"
              >
                <div className="grid grid-cols-[1fr_auto] items-start gap-2.5">
                  <div className="min-w-0">
                    <label className="mb-1 block text-xs text-slate-600">Email</label>
                    <input
                      type="email"
                      value={subscriber.email || ""}
                      onChange={(e) => handleEmailChange(index, e.target.value)}
                      onBlur={() => handleEmailBlur(index)}
                      placeholder="email@example.com"
                      className="h-8 w-full rounded-[0.33em] border border-slate-300 bg-white px-2 text-sm transition-colors focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
                    />
                    {emailError && <div className="mt-1 text-xs text-red-600">{emailError}</div>}
                  </div>
                  <div className="mt-5 flex flex-shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSubscriber(index)}
                      className="h-8 w-8 p-0 text-red-500 hover:bg-red-100 hover:text-red-700"
                      title="Delete subscriber"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Button
        onClick={handleAddSubscriber}
        size="sm"
        className="mt-2 w-full gap-2 border border-slate-300 bg-slate-100 text-slate-700 hover:border-slate-400 hover:bg-slate-100"
        variant="outline"
      >
        <Plus className="h-4 w-4" />
        Add subscriber
      </Button>
    </div>
  );
};
