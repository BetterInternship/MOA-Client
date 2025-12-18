"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/docs/forms/input";
import type { FormField } from "../field-box";

interface Party {
  id: string;
  name: string;
  type: "entity" | "student-guardian" | "university" | "student";
  email?: string;
  required: boolean;
}

interface Parameter {
  id: string;
  key: string;
  value: string;
  type: "text" | "number" | "date";
  required: boolean;
}

interface FormTesterProps {
  fields: FormField[];
  parties: Party[];
  parameters: Parameter[];
}

export const FormTester = ({ fields, parties, parameters }: FormTesterProps) => {
  const [activeParty, setActiveParty] = useState<string>(parties[0]?.type || "entity");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [testResults, setTestResults] = useState<string>("");

  const partyFields = fields.filter((f) => f.field.includes(activeParty) || !f.field.includes(":"));

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleTestForm = () => {
    const results = {
      party: activeParty,
      timestamp: new Date().toISOString(),
      fields: formValues,
      parameters: Object.fromEntries(parameters.map((p) => [p.key, p.value || `<${p.key}>`])),
    };

    setTestResults(JSON.stringify(results, null, 2));
  };

  return (
    <div className="space-y-4">
      {/* Party Selection */}
      <Card className="border border-slate-200 bg-slate-50/50 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Select Party</h3>
        <div className="flex flex-wrap gap-2">
          {parties.map((party) => (
            <Button
              key={party.id}
              variant={activeParty === party.type ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveParty(party.type)}
            >
              {party.name}
            </Button>
          ))}
        </div>
      </Card>

      {/* Form Fields */}
      <Card className="border border-slate-200 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Form Fields</h3>
        <div className="space-y-3">
          {partyFields.length === 0 ? (
            <p className="text-xs text-slate-500">No fields assigned to this party</p>
          ) : (
            partyFields.map((field) => (
              <div key={`${field.field}:${field.page}`}>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  {field.label}
                </label>
                <Input
                  type="text"
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  value={formValues[field.field] || ""}
                  onChange={(e) => handleFieldChange(field.field, e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Parameters Preview */}
      {parameters.length > 0 && (
        <Card className="border border-blue-200 bg-blue-50/50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-blue-900">Parameters</h3>
          <div className="grid grid-cols-2 gap-3">
            {parameters.map((param) => (
              <div key={param.id}>
                <label className="mb-1 block text-xs font-medium text-blue-700">{param.key}</label>
                <Input
                  type={param.type}
                  placeholder={param.key}
                  value={formValues[param.key] || ""}
                  onChange={(e) => handleFieldChange(param.key, e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Test Button */}
      <div className="flex gap-2">
        <Button onClick={handleTestForm} className="flex-1 bg-blue-600 hover:bg-blue-700">
          Test Form
        </Button>
      </div>

      {/* Results */}
      {testResults && (
        <Card className="border border-slate-700 bg-slate-900 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-100">Test Results</h3>
          <pre className="overflow-x-auto rounded bg-slate-950 p-3 text-xs text-slate-300">
            {testResults}
          </pre>
        </Card>
      )}
    </div>
  );
};
