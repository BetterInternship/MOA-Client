"use client";

import { useState } from "react";
import { type IFormSigningParty } from "@betterinternship/core/forms";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/docs/forms/input";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";

interface PartiesPanelProps {
  parties: IFormSigningParty[];
  onPartiesChange: (parties: IFormSigningParty[]) => void;
}

type CredentialMode = "source" | "account";

export const PartiesPanel = ({ parties, onPartiesChange }: PartiesPanelProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<IFormSigningParty>>({});
  const [credentialMode, setCredentialMode] = useState<CredentialMode>("source");

  const handleStartEdit = (party: IFormSigningParty) => {
    setEditingId(party._id);
    setEditValues(party);
    // Determine which credential mode to use
    setCredentialMode(party.signatory_account ? "account" : "source");
  };

  const handleSaveEdit = () => {
    if (!editingId) return;

    const updatedParties = parties.map((p) => (p._id === editingId ? { ...p, ...editValues } : p));
    onPartiesChange(updatedParties);
    setEditingId(null);
    setEditValues({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues({});
    setCredentialMode("source");
  };

  const handleDeleteParty = (id: string) => {
    const updatedParties = parties.filter((p) => p._id !== id);
    onPartiesChange(updatedParties);
  };

  const handleAddParty = () => {
    const newParty: IFormSigningParty = {
      _id: `party-${Date.now()}`,
      order: Math.max(...parties.map((p) => p.order), 0) + 1,
      signatory_source: "New Party",
    };
    onPartiesChange([...parties, newParty]);
    setCredentialMode("source");
  };

  return (
    <div className="space-y-4">
      <Card className="border border-blue-200 bg-blue-50/50 p-4">
        <p className="text-xs text-blue-700">
          Define the signing parties that will fill and sign this form. Each party can have
          different fields assigned to them.
        </p>
      </Card>

      <div className="space-y-3">
        {parties
          .sort((a, b) => a.order - b.order)
          .map((party) => (
            <Card
              key={party._id}
              className={`border p-4 ${
                editingId === party._id ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"
              }`}
            >
              {editingId === party._id ? (
                // Edit Mode
                <div className="space-y-4">
                  {/* Party Name */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Party Name
                    </label>
                    <Input
                      type="text"
                      value={editValues._id || ""}
                      onChange={(e) => setEditValues({ ...editValues, _id: e.target.value })}
                      placeholder="e.g., Student, Entity, University"
                      className="h-8 text-sm"
                    />
                  </div>

                  {/* Order */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Order</label>
                    <Input
                      type="number"
                      value={editValues.order || 1}
                      onChange={(e) =>
                        setEditValues({ ...editValues, order: parseInt(e.target.value) })
                      }
                      className="h-8 text-sm"
                    />
                  </div>

                  {/* Credential Mode Selector */}
                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-600">
                      How will this party provide credentials?
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setCredentialMode("source");
                          // Clear account data when switching to source
                          setEditValues({ ...editValues, signatory_account: undefined });
                        }}
                        className={`flex-1 rounded border px-3 py-2 text-xs font-medium transition-colors ${
                          credentialMode === "source"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        By Source
                      </button>
                      <button
                        onClick={() => {
                          setCredentialMode("account");
                          // Clear source data when switching to account
                          setEditValues({ ...editValues, signatory_source: undefined });
                        }}
                        className={`flex-1 rounded border px-3 py-2 text-xs font-medium transition-colors ${
                          credentialMode === "account"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        By Email
                      </button>
                    </div>
                  </div>

                  {/* Source-based Mode */}
                  {credentialMode === "source" && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Select Party Source
                      </label>
                      <select
                        value={editValues.signatory_source || ""}
                        onChange={(e) =>
                          setEditValues({ ...editValues, signatory_source: e.target.value })
                        }
                        className="h-8 w-full rounded border border-slate-300 px-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      >
                        <option value="">-- Select a party --</option>
                        {parties
                          .filter((p) => p._id !== editingId)
                          .map((p) => (
                            <option key={p._id} value={p._id}>
                              {p._id}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {/* Account-based Mode */}
                  {credentialMode === "account" && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
                      <Input
                        type="email"
                        value={editValues.signatory_account?.email || ""}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            signatory_account: {
                              account_id: "",
                              name: "",
                              email: e.target.value,
                            },
                          })
                        }
                        placeholder="signatory@example.com"
                        className="h-8 text-sm"
                      />
                    </div>
                  )}

                  {/* Save/Cancel Buttons */}
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
                    <p className="text-sm font-semibold text-slate-900">{party._id}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        Order: {party.order}
                      </span>
                      {party.signatory_source && (
                        <span className="inline-flex items-center rounded-md bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                          Source: {party.signatory_source}
                        </span>
                      )}
                      {party.signatory_account?.email && (
                        <span className="inline-flex items-center rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                          {party.signatory_account.email}
                        </span>
                      )}
                      {party.signatory_account?.name && (
                        <span className="inline-flex items-center rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                          {party.signatory_account.name}
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
                      onClick={() => handleDeleteParty(party._id)}
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
