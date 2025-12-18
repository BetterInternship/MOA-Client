"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/docs/forms/input";
import { Plus, Trash2, Edit2, Check, X, ArrowUp, ArrowDown } from "lucide-react";

interface Signatory {
  id: string;
  name: string;
  role: string;
  party: string;
  email?: string;
  signOrder: number;
}

interface Party {
  id: string;
  name: string;
  type: "entity" | "student-guardian" | "university" | "student";
  email?: string;
  required: boolean;
}

interface SignatoriesPanelProps {
  signatories: Signatory[];
  parties: Party[];
  onSignatoriesChange: (signatories: Signatory[]) => void;
}

export const SignatoriesPanel = ({
  signatories,
  parties,
  onSignatoriesChange,
}: SignatoriesPanelProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Signatory>>({});

  const handleStartEdit = (signatory: Signatory) => {
    setEditingId(signatory.id);
    setEditValues(signatory);
  };

  const handleSaveEdit = () => {
    if (!editingId) return;

    const updatedSignatories = signatories.map((s) =>
      s.id === editingId ? { ...s, ...editValues } : s
    );
    onSignatoriesChange(updatedSignatories);
    setEditingId(null);
    setEditValues({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleDeleteSignatory = (id: string) => {
    const updatedSignatories = signatories.filter((s) => s.id !== id);
    // Re-index sign orders
    const reindexed = updatedSignatories
      .sort((a, b) => a.signOrder - b.signOrder)
      .map((s, idx) => ({ ...s, signOrder: idx + 1 }));
    onSignatoriesChange(reindexed);
  };

  const handleAddSignatory = () => {
    const newSignatory: Signatory = {
      id: Date.now().toString(),
      name: "New Signatory",
      role: "",
      party: parties[0]?.type || "entity",
      email: "",
      signOrder: signatories.length + 1,
    };
    onSignatoriesChange([...signatories, newSignatory]);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newSignatories = [...signatories];
    [newSignatories[index - 1], newSignatories[index]] = [
      newSignatories[index],
      newSignatories[index - 1],
    ];
    // Update sign orders
    const updated = newSignatories.map((s, idx) => ({
      ...s,
      signOrder: idx + 1,
    }));
    onSignatoriesChange(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === signatories.length - 1) return;
    const newSignatories = [...signatories];
    [newSignatories[index], newSignatories[index + 1]] = [
      newSignatories[index + 1],
      newSignatories[index],
    ];
    // Update sign orders
    const updated = newSignatories.map((s, idx) => ({
      ...s,
      signOrder: idx + 1,
    }));
    onSignatoriesChange(updated);
  };

  // Sort by sign order
  const sortedSignatories = [...signatories].sort((a, b) => a.signOrder - b.signOrder);

  return (
    <div className="space-y-4">
      <Card className="border border-purple-200 bg-purple-50/50 p-4">
        <p className="text-xs text-purple-700">
          Define signatories and their signing order. Signatories will sign in the order specified
          below.
        </p>
      </Card>

      <div className="space-y-3">
        {sortedSignatories.map((signatory, index) => (
          <Card
            key={signatory.id}
            className={`border p-4 ${
              editingId === signatory.id
                ? "border-purple-300 bg-purple-50"
                : "border-slate-200 bg-white"
            }`}
          >
            {editingId === signatory.id ? (
              // Edit Mode
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
                  <Input
                    type="text"
                    value={editValues.name || ""}
                    onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Role</label>
                  <Input
                    type="text"
                    value={editValues.role || ""}
                    onChange={(e) => setEditValues({ ...editValues, role: e.target.value })}
                    placeholder="e.g., CEO, Coordinator"
                    className="h-8 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Party</label>
                  <select
                    value={editValues.party || "entity"}
                    onChange={(e) => setEditValues({ ...editValues, party: e.target.value })}
                    className="h-8 w-full rounded border border-slate-300 px-2 text-sm focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                  >
                    {parties.map((party) => (
                      <option key={party.id} value={party.type}>
                        {party.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
                  <Input
                    type="email"
                    value={editValues.email || ""}
                    onChange={(e) => setEditValues({ ...editValues, email: e.target.value })}
                    placeholder="optional@email.com"
                    className="h-8 text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    className="h-8 flex-1 bg-purple-600 hover:bg-purple-700"
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
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-1 items-start gap-3">
                  <div className="flex flex-shrink-0 flex-col items-center gap-1">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
                      {signatory.signOrder}
                    </div>
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{signatory.name}</p>
                    <div className="mt-1 flex gap-2">
                      {signatory.role && (
                        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                          {signatory.role}
                        </span>
                      )}
                      <span className="inline-flex items-center rounded-md bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                        {parties.find((p) => p.type === signatory.party)?.name || signatory.party}
                      </span>
                      {signatory.email && (
                        <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                          {signatory.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="h-8 w-8 p-0"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === sortedSignatories.length - 1}
                    className="h-8 w-8 p-0"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStartEdit(signatory)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSignatory(signatory.id)}
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

      <Button onClick={handleAddSignatory} className="w-full bg-purple-600 hover:bg-purple-700">
        <Plus className="mr-2 h-4 w-4" />
        Add Signatory
      </Button>
    </div>
  );
};
