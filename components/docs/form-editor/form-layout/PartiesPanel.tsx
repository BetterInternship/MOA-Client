"use client";

import { useState } from "react";
import { type IFormSigningParty } from "@betterinternship/core/forms";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/docs/forms/EditForm";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { validateEmail } from "@/lib/validators";

interface PartiesPanelProps {
  parties: IFormSigningParty[];
  onPartiesChange: (parties: IFormSigningParty[]) => void;
}

type CredentialMode = "source" | "account";

interface ValidationErrors {
  partyName?: string;
  order?: string;
  email?: string;
  source?: string;
}

export const PartiesPanel = ({ parties, onPartiesChange }: PartiesPanelProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<IFormSigningParty>>({});
  const [credentialMode, setCredentialMode] = useState<CredentialMode>("source");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const handleStartEdit = (party: IFormSigningParty, index: number) => {
    setEditingIndex(index);
    setEditValues(party);
    setCredentialMode(party.signatory_account ? "account" : "source");
    setValidationErrors({});
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Validate party name
    if (!editValues._id || editValues._id.trim() === "") {
      errors.partyName = "Party name is required";
    }

    // Validate order
    if (!editValues.order || editValues.order < 1) {
      errors.order = "Order must be at least 1";
    }

    // Validate based on credential mode
    if (credentialMode === "source") {
      if (!editValues.signatory_source || editValues.signatory_source.trim() === "") {
        errors.source = "Please select a party source";
      }
    } else if (credentialMode === "account") {
      const emailValidation = validateEmail(editValues.signatory_account?.email || "");
      if (!emailValidation.valid) {
        errors.email = emailValidation.error;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;

    if (!validateForm()) {
      return;
    }

    const updatedParties = parties.map((p, idx) => {
      if (idx === editingIndex) {
        const { signed: _signed, ...partyWithoutSigned } = { ...p, ...editValues };
        return partyWithoutSigned as IFormSigningParty;
      }
      return p;
    });
    onPartiesChange(updatedParties);
    setEditingIndex(null);
    setEditValues({});
    setValidationErrors({});
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValues({});
    setCredentialMode("source");
    setValidationErrors({});
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
    setEditingIndex(parties.length); // Auto-edit the new party
    setEditValues(newParty);
    setCredentialMode("source");
  };

  return (
    <div className="space-y-4">
      {/* Instruction card and Add button */}
      <Card className="border border-blue-200 bg-blue-50/50 p-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-blue-800">
            Define the signing parties that will fill and sign this form. Each party can have
            different fields assigned to them.
          </p>
          <Button
            onClick={handleAddParty}
            size="sm"
            className="flex-shrink-0 gap-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Signing Party
          </Button>
        </div>
      </Card>

      {parties.length === 0 ? (
        <Card className="border border-dashed border-slate-300 p-8 text-center">
          <p className="text-sm text-slate-500">No parties yet</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {parties
            .sort((a, b) => a.order - b.order)
            .map((party, index) => (
              <Card
                key={party._id}
                className={`border p-3 transition-colors ${
                  editingIndex === index
                    ? "border-blue-300 bg-blue-50"
                    : "border-slate-200 bg-white hover:bg-slate-50/50"
                }`}
              >
                {editingIndex === index ? (
                  // Edit Mode
                  <div className="space-y-4">
                    {/* Party Name */}
                    <div>
                      <FormInput
                        label="Party Name"
                        type="text"
                        value={editValues._id || ""}
                        setter={(value) => {
                          setEditValues({ ...editValues, _id: value });
                          setValidationErrors({ ...validationErrors, partyName: undefined });
                        }}
                        placeholder="e.g., Student, Entity, University"
                        required={false}
                      />
                      {validationErrors.partyName && (
                        <p className="mt-1 text-xs text-red-600">{validationErrors.partyName}</p>
                      )}
                    </div>

                    {/* Order */}
                    <div>
                      <FormInput
                        label="Order"
                        type="number"
                        value={editValues.order?.toString() || "1"}
                        setter={(value) => {
                          setEditValues({ ...editValues, order: parseInt(value) });
                          setValidationErrors({ ...validationErrors, order: undefined });
                        }}
                        required={false}
                      />
                      {validationErrors.order && (
                        <p className="mt-1 text-xs text-red-600">{validationErrors.order}</p>
                      )}
                    </div>

                    {/* Credential Mode Selector */}
                    <div>
                      <div className="mb-2 flex items-center gap-3">
                        <label className="text-xs font-medium text-slate-600">
                          How will this party provide credentials?
                        </label>
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            variant={credentialMode === "source" ? "default" : "outline"}
                            onClick={() => {
                              setCredentialMode("source");
                              setEditValues({ ...editValues, signatory_account: undefined });
                            }}
                            className={
                              credentialMode === "source" ? "bg-blue-600 hover:bg-blue-700" : ""
                            }
                          >
                            By Source
                          </Button>
                          <Button
                            size="sm"
                            variant={credentialMode === "account" ? "default" : "outline"}
                            onClick={() => {
                              setCredentialMode("account");
                              setEditValues({ ...editValues, signatory_source: undefined });
                            }}
                            className={
                              credentialMode === "account" ? "bg-blue-600 hover:bg-blue-700" : ""
                            }
                          >
                            By Email
                          </Button>
                        </div>
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
                          onChange={(e) => {
                            setEditValues({ ...editValues, signatory_source: e.target.value });
                            setValidationErrors({ ...validationErrors, source: undefined });
                          }}
                          className={`h-8 w-full rounded-[0.33em] border px-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none ${
                            validationErrors.source ? "border-red-500" : "border-slate-300"
                          }`}
                        >
                          <option value="">-- Select a party --</option>
                          {parties
                            .filter(
                              (p) =>
                                p._id !== (editingIndex !== null ? parties[editingIndex]._id : null)
                            )
                            .map((p) => (
                              <option key={p._id} value={p._id}>
                                {p._id}
                              </option>
                            ))}
                        </select>
                        {validationErrors.source && (
                          <p className="mt-1 text-xs text-red-600">{validationErrors.source}</p>
                        )}
                      </div>
                    )}

                    {/* Account-based Mode */}
                    {credentialMode === "account" && (
                      <div>
                        <FormInput
                          label="Email"
                          type="email"
                          value={editValues.signatory_account?.email || ""}
                          setter={(value) => {
                            setEditValues({
                              ...editValues,
                              signatory_account: {
                                account_id: value.split("@")[0] || "",
                                name: value.split("@")[0] || "",
                                email: value,
                              },
                            });
                            setValidationErrors({ ...validationErrors, email: undefined });
                          }}
                          placeholder="signatory@example.com"
                          required={false}
                        />
                        {validationErrors.email && (
                          <p className="mt-1 text-xs text-red-600">{validationErrors.email}</p>
                        )}
                      </div>
                    )}

                    {/* Save/Cancel Buttons */}
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
                      <p className="truncate text-sm font-medium text-slate-900">{party._id}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center rounded-[0.33em] bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                          #{party.order}
                        </span>
                        {party.signatory_source && (
                          <span className="inline-flex items-center rounded-[0.33em] bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                            {party.signatory_source}
                          </span>
                        )}
                        {party.signatory_account?.email && (
                          <span className="inline-flex items-center truncate rounded-[0.33em] bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                            {party.signatory_account.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(party, index)}
                        className="h-8 w-8 p-0"
                        title="Edit party"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteParty(party._id)}
                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-700"
                        title="Delete party"
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
