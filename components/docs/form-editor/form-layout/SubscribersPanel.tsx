"use client";

import { useState } from "react";
import { type IFormSubscriber } from "@betterinternship/core/forms";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/docs/forms/input";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";

interface SubscribersPanelProps {
  subscribers: IFormSubscriber[];
  onSubscribersChange: (subscribers: IFormSubscriber[]) => void;
}

export const SubscribersPanel = ({ subscribers, onSubscribersChange }: SubscribersPanelProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<IFormSubscriber>>({});

  const handleStartEdit = (subscriber: IFormSubscriber) => {
    setEditingId(subscriber.account_id);
    setEditValues(subscriber);
  };

  const handleSaveEdit = () => {
    if (!editingId) return;

    const updatedSubscribers = subscribers.map((s) =>
      s.account_id === editingId ? ({ ...s, ...editValues } as IFormSubscriber) : s
    );
    onSubscribersChange(updatedSubscribers);
    setEditingId(null);
    setEditValues({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleDeleteSubscriber = (accountId: string) => {
    const updatedSubscribers = subscribers.filter((s) => s.account_id !== accountId);
    onSubscribersChange(updatedSubscribers);
  };

  const handleAddSubscriber = () => {
    const newSubscriber: IFormSubscriber = {
      account_id: `subscriber-${Date.now()}`,
      name: "New Subscriber",
      email: "",
    };
    onSubscribersChange([...subscribers, newSubscriber]);
  };

  return (
    <div className="space-y-4">
      <Card className="border border-blue-200 bg-blue-50/50 p-4">
        <p className="text-xs text-blue-700">
          Add email subscribers who will receive notifications about this form.
        </p>
      </Card>

      <div className="space-y-3">
        {subscribers.map((subscriber) => (
          <Card
            key={subscriber.account_id}
            className={`border p-4 ${
              editingId === subscriber.account_id
                ? "border-blue-300 bg-blue-50"
                : "border-slate-200 bg-white"
            }`}
          >
            {editingId === subscriber.account_id ? (
              // Edit Mode
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
                  <Input
                    type="email"
                    value={editValues.email || ""}
                    onChange={(e) => setEditValues({ ...editValues, email: e.target.value })}
                    placeholder="subscriber@example.com"
                    className="h-8 text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    className="h-8 flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="h-8 flex-1"
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              // Display Mode
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{subscriber.email}</p>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStartEdit(subscriber)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSubscriber(subscriber.account_id)}
                    className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Button onClick={handleAddSubscriber} className="w-full bg-blue-600 hover:bg-blue-700">
        <Plus className="mr-2 h-4 w-4" />
        Add Subscriber
      </Button>
    </div>
  );
};
