"use client";

import { useState } from "react";

type Parameter = {
  id: string;
  key: string;
  value: string;
  type: "text" | "number" | "date";
  required: boolean;
};

interface ParametersPanelProps {
  parameters: Parameter[];
  onParametersChange: (parameters: Parameter[]) => void;
}

export const ParametersPanel = ({ parameters, onParametersChange }: ParametersPanelProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Parameter>>({});

  const handleStartEdit = (parameter: Parameter) => {
    setEditingId(parameter.id);
    setEditValues(parameter);
  };

  const handleSaveEdit = () => {
    if (!editingId) return;

    const updatedParameters = parameters.map((p) =>
      p.id === editingId ? { ...p, ...editValues } : p
    );
    onParametersChange(updatedParameters);
    setEditingId(null);
    setEditValues({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleDeleteParameter = (id: string) => {
    const updatedParameters = parameters.filter((p) => p.id !== id);
    onParametersChange(updatedParameters);
  };

  const handleAddParameter = () => {
    const newParameter: Parameter = {
      id: Date.now().toString(),
      key: "newParam",
      value: "",
      type: "text",
      required: false,
    };
    onParametersChange([...parameters, newParameter]);
  };

  const handleToggleRequired = (id: string) => {
    const updatedParameters = parameters.map((p) =>
      p.id === id ? { ...p, required: !p.required } : p
    );
    onParametersChange(updatedParameters);
  };

  return (
    <div className="space-y-4">
      <Card className="border border-green-200 bg-green-50/50 p-4">
        <p className="text-xs text-green-700">
          Parameters are form variables that can be filled dynamically (e.g., dates, contract
          terms).
        </p>
      </Card>

      <div className="space-y-3">
        {parameters.map((parameter) => (
          <Card
            key={parameter.id}
            className={`border p-4 ${
              editingId === parameter.id
                ? "border-green-300 bg-green-50"
                : "border-slate-200 bg-white"
            }`}
          >
            {editingId === parameter.id ? (
              // Edit Mode
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Parameter Key
                  </label>
                  <Input
                    type="text"
                    value={editValues.key || ""}
                    onChange={(e) => setEditValues({ ...editValues, key: e.target.value })}
                    placeholder="e.g., startDate, endDate"
                    className="h-8 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Default Value
                  </label>
                  <Input
                    type={editValues.type === "date" ? "date" : editValues.type}
                    value={editValues.value || ""}
                    onChange={(e) => setEditValues({ ...editValues, value: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Type</label>
                  <select
                    value={editValues.type || "text"}
                    onChange={(e) =>
                      setEditValues({
                        ...editValues,
                        type: e.target.value as Parameter["type"],
                      })
                    }
                    className="h-8 w-full rounded border border-slate-300 px-2 text-sm focus:ring-2 focus:ring-green-500/20 focus:outline-none"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`required-${parameter.id}`}
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
                    htmlFor={`required-${parameter.id}`}
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
                  <p className="text-sm font-semibold text-slate-900">{parameter.key}</p>
                  <div className="mt-1 flex gap-2">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                      {parameter.type}
                    </span>
                    {parameter.value && (
                      <span className="inline-flex items-center rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        {parameter.value}
                      </span>
                    )}
                    {parameter.required && (
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
                    onClick={() => handleStartEdit(parameter)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteParameter(parameter.id)}
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

      <Button onClick={handleAddParameter} className="w-full bg-green-600 hover:bg-green-700">
        <Plus className="mr-2 h-4 w-4" />
        Add Parameter
      </Button>
    </div>
  );
};
