"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/docs/forms/input";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";

interface Party {
  id: string;
  name: string;
  type: "entity" | "student-guardian" | "university" | "student";
  email?: string;
  required: boolean;
}

interface PartiesPanelProps {
  parties: Party[];
  onPartiesChange: (parties: Party[]) => void;
}

export const PartiesPanel = ({ parties, onPartiesChange }: PartiesPanelProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Party>>({});

  const handleStartEdit = (party: Party) => {
    setEditingId(party.id);
    setEditValues(party);
  };

  const handleSaveEdit = () => {
    if (!editingId) return;

    const updatedParties = parties.map((p) => (p.id === editingId ? { ...p, ...editValues } : p));
    onPartiesChange(updatedParties);
    setEditingId(null);
    setEditValues({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleDeleteParty = (id: string) => {
    const updatedParties = parties.filter((p) => p.id !== id);
    onPartiesChange(updatedParties);
  };

  const handleAddParty = () => {
    const newParty: Party = {
      id: Date.now().toString(),
      name: "New Party",
      type: "entity",
      email: "",
      required: false,
    };
    onPartiesChange([...parties, newParty]);
  };

  const handleToggleRequired = (id: string) => {
    const updatedParties = parties.map((p) => (p.id === id ? { ...p, required: !p.required } : p));
    onPartiesChange(updatedParties);
  };

  return (
    <div className="space-y-4">
      <Card className="border border-blue-200 bg-blue-50/50 p-4">
        <p className="text-xs text-blue-700">
          Define the parties that will fill and sign this form. Each party can have different
          fields.
        </p>
      </Card>

      <div className="space-y-3">
        {parties.map((party) => (
          <Card
            key={party.id}
            className={`border p-4 ${
              editingId === party.id ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"
            }`}
          >
            {editingId === party.id ? (
              // Edit Mode
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Party Name
                  </label>
                  <Input
                    type="text"
                    value={editValues.name || ""}
                    onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Type</label>
                  <select
                    value={editValues.type || "entity"}
                    onChange={(e) =>
                      setEditValues({
                        ...editValues,
                        type: e.target.value as Party["type"],
                      })
                    }
                    className="h-8 w-full rounded border border-slate-300 px-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  >
                    <option value="entity">Entity</option>
                    <option value="student-guardian">Student Guardian</option>
                    <option value="university">University</option>
                    <option value="student">Student</option>
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

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`required-${party.id}`}
                    checked={editValues.required || false}
                    onChange={(e) =>
                      setEditValues({
                        ...editValues,
                        required: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <label
                    htmlFor={`required-${party.id}`}
                    className="text-xs font-medium text-slate-600"
                  >
                    Required
                  </label>
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
                  <p className="text-sm font-semibold text-slate-900">{party.name}</p>
                  <div className="mt-1 flex gap-2">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                      {party.type}
                    </span>
                    {party.email && (
                      <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                        {party.email}
                      </span>
                    )}
                    {party.required && (
                      <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                        Required
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStartEdit(party)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteParty(party.id)}
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

      <Button onClick={handleAddParty} className="w-full bg-blue-600 hover:bg-blue-700">
        <Plus className="mr-2 h-4 w-4" />
        Add Party
      </Button>
    </div>
  );
};
