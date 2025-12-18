"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Settings, PenTool } from "lucide-react";
import { FormTester } from "./form-layout/form-tester";
import { FieldOrderingPanel } from "./form-layout/field-ordering-panel";
import { PartiesPanel } from "./form-layout/parties-panel";
import { ParametersPanel } from "./form-layout/parameters-panel";
import { SignatoriesPanel } from "./form-layout/signatories-panel";
import type { FormField } from "./field-box";

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

interface Signatory {
  id: string;
  name: string;
  role: string;
  party: string;
  email?: string;
  signOrder: number;
}

interface FormLayoutEditorProps {
  fields: FormField[];
  formLabel: string;
  onFieldsReorder?: (reorderedFields: FormField[]) => void;
}

export const FormLayoutEditor = ({ fields, formLabel, onFieldsReorder }: FormLayoutEditorProps) => {
  const [parties, setParties] = useState<Party[]>([
    {
      id: "1",
      name: "Entity",
      type: "entity",
      email: "",
      required: true,
    },
    {
      id: "2",
      name: "University",
      type: "university",
      email: "",
      required: true,
    },
  ]);

  const [parameters, setParameters] = useState<Parameter[]>([
    {
      id: "1",
      key: "startDate",
      value: "",
      type: "date",
      required: true,
    },
    {
      id: "2",
      key: "endDate",
      value: "",
      type: "date",
      required: true,
    },
  ]);

  const [signatories, setSignatories] = useState<Signatory[]>([
    {
      id: "1",
      name: "Company Director",
      role: "Director",
      party: "entity",
      email: "",
      signOrder: 1,
    },
    {
      id: "2",
      name: "University Coordinator",
      role: "Coordinator",
      party: "university",
      email: "",
      signOrder: 2,
    },
  ]);

  const [orderedFields, setOrderedFields] = useState<FormField[]>(fields);

  const handleFieldsReorder = (newFields: FormField[]) => {
    setOrderedFields(newFields);
    onFieldsReorder?.(newFields);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-white px-4 py-3">
        <h2 className="text-lg font-semibold text-slate-900">
          {formLabel} - Form Layout Configuration
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Configure parties, parameters, signatories, and field order
        </p>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="tester" className="flex h-full flex-col">
          <TabsList className="w-full justify-start gap-1 rounded-none border-b bg-white px-4 py-2">
            <TabsTrigger
              value="tester"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
            >
              <PenTool className="mr-2 h-4 w-4" />
              Form Tester
            </TabsTrigger>
            <TabsTrigger
              value="fields"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
            >
              <PenTool className="mr-2 h-4 w-4" />
              Field Order
            </TabsTrigger>
            <TabsTrigger
              value="parties"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
            >
              <Users className="mr-2 h-4 w-4" />
              Parties
            </TabsTrigger>
            <TabsTrigger
              value="parameters"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
            >
              <Settings className="mr-2 h-4 w-4" />
              Parameters
            </TabsTrigger>
            <TabsTrigger
              value="signatories"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
            >
              <PenTool className="mr-2 h-4 w-4" />
              Signatories
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <div className="flex-1 overflow-y-auto">
            <TabsContent value="tester" className="space-y-4 p-4">
              <FormTester fields={orderedFields} parties={parties} parameters={parameters} />
            </TabsContent>

            <TabsContent value="fields" className="p-4">
              <FieldOrderingPanel fields={orderedFields} onFieldsReorder={handleFieldsReorder} />
            </TabsContent>

            <TabsContent value="parties" className="p-4">
              <PartiesPanel parties={parties} onPartiesChange={setParties} />
            </TabsContent>

            <TabsContent value="parameters" className="p-4">
              <ParametersPanel parameters={parameters} onParametersChange={setParameters} />
            </TabsContent>

            <TabsContent value="signatories" className="p-4">
              <SignatoriesPanel
                signatories={signatories}
                parties={parties}
                onSignatoriesChange={setSignatories}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};
