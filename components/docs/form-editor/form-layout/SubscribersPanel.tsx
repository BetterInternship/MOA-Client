"use client";

import { useState, useRef } from "react";
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

const generateId = () => `sub-${Math.random().toString(36).substr(2, 9)}`;

export const SubscribersPanel = ({ subscribers, onSubscribersChange }: SubscribersPanelProps) => {
  const safeSubscribers = Array.isArray(subscribers) ? subscribers : [];
  
  // Use a ref to track IDs consistently across renders
  const idMapRef = useRef<Map<string, string>>(new Map());

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<string | null>(null);

  // Get or create an ID for a subscriber
  const getSubscriberId = (subscriber: IFormSubscriber, index: number): string => {
    const key = `${index}-${subscriber.email || "new"}`;
    if (!idMapRef.current.has(key)) {
      idMapRef.current.set(key, generateId());
    }
    return idMapRef.current.get(key)!;
  };

  const handleStartEdit = (subscriber: IFormSubscriber, index: number) => {
    const id = getSubscriberId(subscriber, index);
    setEditingId(id);
    setEditingEmail(subscriber.email || "");
    setEmailError(null);
  };

  const handleSaveEdit = (index: number) => {
    if (!editingId) return;

    const validation = validateEmail(editingEmail || "");
    if (!validation.valid) {
      setEmailError(validation.error || "Invalid email");
      return;
    }

    // Update the subscriber at the current index
    const updated = [...safeSubscribers];
    updated[index] = { ...updated[index], email: editingEmail };
    onSubscribersChange(updated);

    setEditingId(null);
    setEditingEmail("");
    setEmailError(null);
  };

  const handleCancelEdit = (index: number) => {
    // Remove empty new subscribers when canceling
    if (!editingEmail && safeSubscribers[index]?.email === "") {
      handleDeleteSubscriber(index);
    }
    setEditingId(null);
    setEditingEmail("");
    setEmailError(null);
  };

  const handleDeleteSubscriber = (index: number) => {
    const updated = safeSubscribers.filter((_, i) => i !== index);
    onSubscribersChange(updated);
  };

  const handleAddSubscriber = () => {
    const newSubscriber: IFormSubscriber = { email: "" } as IFormSubscriber;
    const newArray = [...safeSubscribers, newSubscriber];
    onSubscribersChange(newArray);
    
    // Immediately enter edit mode for the new subscriber
    setTimeout(() => {
      setEditingId(getSubscriberId(newSubscriber, newArray.length - 1));
      setEditingEmail("");
    }, 0);
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
          {safeSubscribers.map((subscriber, index) => {
            const subscriberId = getSubscriberId(subscriber, index);
            const isEditing = editingId === subscriberId;

            return (
              <Card
                key={subscriberId}
                className={`border p-3 transition-colors ${
                  isEditing
                    ? "border-amber-300 bg-amber-50"
                    : "border-slate-200 bg-white hover:bg-slate-50/50"
                }`}
              >
                {isEditing ? (
                  // Edit Mode
                  <div className="space-y-1">
                    <FormInput
                      label="Email"
                      type="email"
                      value={editingEmail}
                      setter={(value) => {
                        setEditingEmail(value);
                        setEmailError(null);
                      }}
                      placeholder="subscriber@example.com"
                      required={false}
                    />
                    {emailError && <div className="text-xs text-red-600">{emailError}</div>}

                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelEdit(index)}
                        className="gap-1"
                      >
                        <X className="mt-0.5 h-3.5 w-3.5" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(index)}
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
                        {subscriber.email || <span className="text-slate-400">No email</span>}
                      </p>
                    </div>

                    <div className="flex flex-shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(subscriber, index)}
                        className="h-8 w-8 p-0"
                        title="Edit subscriber"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSubscriber(index)}
                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-700"
                        title="Delete subscriber"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
