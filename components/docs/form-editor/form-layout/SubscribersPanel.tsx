"use client";

import { useState } from "react";
import { type IFormSubscriber } from "@betterinternship/core/forms";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/docs/forms/EditForm";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { validateEmail } from "@/lib/validators";

interface SubscribersPanelProps {
  subscribers: IFormSubscriber[];
  onSubscribersChange: (subscribers: IFormSubscriber[]) => void;
}

export const SubscribersPanel = ({ subscribers, onSubscribersChange }: SubscribersPanelProps) => {
  // Safeguard against undefined subscribers
  const safeSubscribers = subscribers || [];
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<IFormSubscriber>>({});
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleStartEdit = (subscriber: IFormSubscriber) => {
    setEditingId(subscriber.account_id);
    setEditValues(subscriber);
    setEmailError(null);
  };

  const handleSaveEdit = () => {
    if (!editingId) return;

    // Validate email before saving
    const validation = validateEmail(editValues.email || "");
    if (!validation.valid) {
      setEmailError(validation.error || "Invalid email");
      return;
    }

    const updatedSubscribers = safeSubscribers.map((s) =>
      s.account_id === editingId ? ({ ...s, ...editValues } as IFormSubscriber) : s
    );
    onSubscribersChange(updatedSubscribers);
    setEditingId(null);
    setEditValues({});
    setEmailError(null);
  };

  const handleCancelEdit = () => {
    // If the edited subscriber has no email, remove it
    if (editingId) {
      const subscriber = safeSubscribers.find((s) => s.account_id === editingId);
      if (subscriber && !subscriber.email) {
        handleDeleteSubscriber(editingId);
      }
    }
    setEditingId(null);
    setEditValues({});
    setEmailError(null);
  };

  const handleDeleteSubscriber = (accountId: string) => {
    const updatedSubscribers = safeSubscribers.filter((s) => s.account_id !== accountId);
    onSubscribersChange(updatedSubscribers);
  };

  const handleAddSubscriber = () => {
    const newSubscriber: IFormSubscriber = {
      account_id: `subscriber-${Date.now()}`,
      name: "New Subscriber",
      email: "",
    };
    onSubscribersChange([...safeSubscribers, newSubscriber]);
    setEditingId(newSubscriber.account_id);
    setEditValues(newSubscriber);
  };

  return (
    <div className="space-y-4">
      {/* Instruction card and Add button */}
      <Card className="border border-amber-200 bg-amber-50/50 p-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-amber-800">
            Add email addresses that will receive notifications when this form is submitted or
            signed.
          </p>
          <Button
            onClick={handleAddSubscriber}
            size="sm"
            className="flex-shrink-0 gap-2 bg-amber-600 text-white hover:bg-amber-700"
          >
            <Plus className="h-4 w-4" />
            Add Subscriber
          </Button>
        </div>
      </Card>

      {safeSubscribers.length === 0 ? (
        <Card className="border border-dashed border-slate-300 p-8 text-center">
          <p className="text-sm text-slate-500">No subscribers yet</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {safeSubscribers.map((subscriber) => (
            <Card
              key={subscriber.account_id}
              className={`border p-3 transition-colors ${
                editingId === subscriber.account_id
                  ? "border-amber-300 bg-amber-50"
                  : "border-slate-200 bg-white hover:bg-slate-50/50"
              }`}
            >
              {editingId === subscriber.account_id ? (
                // Edit Mode
                <div className="space-y-1">
                  <FormInput
                    label="Email"
                    type="email"
                    value={editValues.email || ""}
                    setter={(value) => {
                      setEditValues({ ...editValues, email: value });
                      setEmailError(null); // Clear error on change
                    }}
                    placeholder="subscriber@example.com"
                    required={false}
                  />
                  {emailError && <div className="text-xs text-red-600">{emailError}</div>}

                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="gap-1"
                    >
                      <X className="mt-0.5 h-3.5 w-3.5" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                // Display Mode
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {subscriber.email}
                    </p>
                  </div>

                  <div className="flex flex-shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(subscriber)}
                      className="h-8 w-8 p-0"
                      title="Edit subscriber"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSubscriber(subscriber.account_id)}
                      className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-700"
                      title="Delete subscriber"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
