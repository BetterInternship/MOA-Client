"use client";

import { useState } from "react";
import { EditableDynamicForm } from "./form-layout/editable-dynamic-form";
import { PartiesPanel } from "./form-layout/parties-panel";
import { ParametersPanel } from "./form-layout/parameters-panel";
import { SignatoriesPanel } from "./form-layout/signatories-panel";
import { ClientField } from "@betterinternship/core/forms";
import { FormField } from "./field-box";
import { ResizableSidebar, SidebarMenuItem } from "@/components/shared/resizable-sidebar";
import { FileText, Users, Settings, CheckCircle } from "lucide-react";

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
    icon: <FileText className="h-5 w-5" />,
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

/**
 * Convert FormField (PDF layout data) to ClientField (form structure data)
 * Creates a basic ClientField structure for rendering with FieldRenderer
 */
const formFieldToClientField = (formField: FormField, party: string): ClientField<[]> => {
  return {
    field: formField.field,
    label: formField.label,
    type: "text",
    section: "entity",
    party: party as "entity" | "student-guardian" | "university" | "student",
    source: "manual",
    placeholder: `Enter ${formField.label.toLowerCase()}`,
    required: false,
    validation: [],
  } as ClientField<[]>;
};

export const FormLayoutEditor = ({ fields, formLabel, onFieldsReorder }: FormLayoutEditorProps) => {
  const [activeSection, setActiveSection] = useState<SectionType>("tester");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [activeParty, setActiveParty] = useState<
    "entity" | "student-guardian" | "university" | "student"
  >("entity");
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

  // Convert FormField array to ClientField array for EditableDynamicForm
  const clientFields: ClientField<[]>[] = orderedFields.map((field) =>
    formFieldToClientField(field, activeParty)
  );

  const handleFieldsReorder = (newFields: ClientField<[]>[]) => {
    // Convert back to FormField
    const reorderedFormFields = orderedFields.map((field) => {
      const index = newFields.findIndex((cf) => cf.field === field.field);
      return field;
    });
    setOrderedFields(reorderedFormFields);
    onFieldsReorder?.(reorderedFormFields);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "tester":
        return (
          <EditableDynamicForm
            formName={formLabel}
            party={activeParty}
            fields={clientFields}
            values={formValues}
            setValues={setFormValues}
            onChange={(key, value) => {
              setFormValues((prev) => ({
                ...prev,
                [key]: value,
              }));
            }}
            onFieldsReorder={handleFieldsReorder}
          />
        );
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
    <div className="flex h-full w-full flex-col gap-0 overflow-hidden">
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
          <div className="p-4 pb-12">
            {/* Section Content */}
            <div className="space-y-4">{renderContent()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
