"use client";

import { useState } from "react";
import { FormTester } from "./form-layout/form-tester";
import { FieldOrderingPanel } from "./form-layout/field-ordering-panel";
import { PartiesPanel } from "./form-layout/parties-panel";
import { ParametersPanel } from "./form-layout/parameters-panel";
import { SignatoriesPanel } from "./form-layout/signatories-panel";
import { ResizableSidebar, type SidebarMenuItem } from "@/components/shared/resizable-sidebar";
import { ListOrdered, Users, Settings, CheckCircle, Zap } from "lucide-react";
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

type SectionType = "tester" | "fields" | "parties" | "parameters" | "signatories";

const MENU_ITEMS: SidebarMenuItem[] = [
  {
    id: "tester",
    label: "Form Tester",
    icon: <Zap className="h-5 w-5" />,
  },
  {
    id: "fields",
    label: "Field Order",
    icon: <ListOrdered className="h-5 w-5" />,
  },
  {
    id: "parties",
    label: "Parties",
    icon: <Users className="h-5 w-5" />,
  },
  {
    id: "parameters",
    label: "Parameters",
    icon: <Settings className="h-5 w-5" />,
  },
  {
    id: "signatories",
    label: "Signatories",
    icon: <CheckCircle className="h-5 w-5" />,
  },
];

export const FormLayoutEditor = ({ fields, formLabel, onFieldsReorder }: FormLayoutEditorProps) => {
  const [activeSection, setActiveSection] = useState<SectionType>("tester");
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

  const renderContent = () => {
    switch (activeSection) {
      case "tester":
        return <FormTester fields={orderedFields} parties={parties} parameters={parameters} />;
      case "fields":
        return <FieldOrderingPanel fields={orderedFields} onFieldsReorder={handleFieldsReorder} />;
      case "parties":
        return <PartiesPanel parties={parties} onPartiesChange={setParties} />;
      case "parameters":
        return <ParametersPanel parameters={parameters} onParametersChange={setParameters} />;
      case "signatories":
        return (
          <SignatoriesPanel
            signatories={signatories}
            parties={parties}
            onSignatoriesChange={setSignatories}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-white px-4 py-3">
        <h2 className="text-lg font-semibold text-slate-900">{formLabel}</h2>
        <p className="mt-1 text-xs text-slate-500">Form Layout Configuration</p>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* Resizable Sidebar */}
        <ResizableSidebar
          items={MENU_ITEMS}
          activeItem={activeSection}
          onItemChange={(id) => setActiveSection(id as SectionType)}
          isResizable={false}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-4">
            {/* Section Header */}
            <div className="mb-4 flex items-center gap-2">
              <span className="text-blue-600">
                {MENU_ITEMS.find((item) => item.id === activeSection)?.icon}
              </span>
              <h3 className="text-base font-semibold text-slate-900">
                {MENU_ITEMS.find((item) => item.id === activeSection)?.label}
              </h3>
            </div>

            {/* Section Content */}
            <div className="space-y-4">{renderContent()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
