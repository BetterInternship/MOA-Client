"use client";

import { useModal } from "@/app/providers/modal-provider";
import { Button } from "@/components/ui/button";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useFormsControllerGetFieldRegistry,
  useFormsControllerGetFieldFromRegistry,
  formsControllerRegisterField,
} from "../../../api/app/api/endpoints/forms/forms";
import { Badge } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";
import { ChangeEvent, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { formsControllerUpdateField } from "../../../api/app/api/endpoints/forms/forms";
import { Loader } from "@/components/ui/loader";
import { Plus } from "lucide-react";

/**
 * Displays all the forms we have, and their latest versions.
 *
 * @component
 */
const FieldRegistryPage = () => {
  const fieldRegistry = useFormsControllerGetFieldRegistry();
  const fields = fieldRegistry.data?.fields ?? [];
  const { openModal, closeModal } = useModal();

  // Handles opening the add field modal
  const handleAdd = () => {
    openModal("field-add", <FieldRegistration close={closeModal} />, {
      title: (
        <div className="flex flex-col gap-2">
          <div className="flex flex-row items-center gap-2">
            <span className="font-semibold tracking-tight">Add New Field</span>
          </div>
          <Divider />
        </div>
      ),
    });
  };

  return (
    <div className="mx-auto mt-4 max-w-5xl">
      <div className="flex flex-row items-center">
        <h1 className="m-2 text-2xl font-bold tracking-tight">Field Registry</h1>
        <div className="flex-1"></div>
        <Button size="sm" onClick={handleAdd}>
          <Plus />
          New Field
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableHead>Field Name</TableHead>
          <TableHead>Field Preset</TableHead>
        </TableHeader>
        {fields.map((field) => (
          <FieldRegistryEntry id={field.id} name={field.name} preset={field.preset} />
        ))}
      </Table>
    </div>
  );
};

/**
 * A form in our registry.
 *
 * @component
 */
const FieldRegistryEntry = ({ id, name, preset }: { id: string; name: string; preset: string }) => {
  const { openModal, closeModal } = useModal();

  // Opens the document in the editor page
  const handleEdit = () => {
    openModal("field-editor", <FieldEditor id={id} close={closeModal} />, {
      title: (
        <div className="flex flex-col gap-2">
          <div className="flex flex-row items-center gap-2">
            <Badge>
              <pre className="inline-block">{name}</pre>
            </Badge>
            <Badge>
              <pre className="inline-block">{preset}</pre>
            </Badge>
            <span className="font-semibold tracking-tight">Field Data</span>
          </div>
          <Divider />
        </div>
      ),
    });
  };

  return (
    <TableRow>
      <TableCell>{name}</TableCell>
      <TableCell>{preset}</TableCell>
      <TableCell>
        <div className="flex flex-row gap-2">
          <Button variant="outline" scheme="primary" size="xs" onClick={handleEdit}>
            Edit
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

/**
 * Shows a preview of the field to edit.
 *
 * @component
 */
const FieldEditor = ({ id, close }: { id: string | null; close: () => void }) => {
  const { data, isLoading, isFetching } = useFormsControllerGetFieldFromRegistry(
    { id: id ?? "" },
    { query: { enabled: !!id } }
  );
  const [fieldId, setFieldId] = useState<string | null>(null);
  const [field, setField] = useState<{
    name: string;
    preset: string;
    tooltip_label?: string;
    validator?: string;
    prefiller?: string;
  }>();
  const [editing, setEditing] = useState(false);

  // Handles editing the field
  const handleEdit = async () => {
    if (!fieldId) return;
    if (!field || !field?.name || !field?.preset) return;

    setEditing(true);
    await formsControllerUpdateField({
      ...field,
      tooltip_label: field.tooltip_label ?? null,
      validator: field.validator ?? null,
      prefiller: field.prefiller ?? null,
      id: fieldId,
    });
    setEditing(false);
    close();
  };

  // Creates handlers for each field prop
  const handleChangeFactory = (property: string) => (e: ChangeEvent<HTMLInputElement>) => {
    if (!field) return;
    setField({ ...field, [property]: e.target.value });
  };

  // Update inputs if ever
  useEffect(() => {
    if (data?.field) {
      setFieldId(data.field.id);
      setField({
        ...data.field,
        tooltip_label: data.field.tooltip_label ?? undefined,
        validator: data.field.validator ?? undefined,
        prefiller: data.field.prefiller ?? undefined,
      });
    } else {
      setFieldId(null);
    }
  }, [data]);

  return (
    <div className="max-h-[600px] overflow-y-auto">
      <div className="flex min-w-xl flex-col gap-2">
        {isLoading || isFetching ? (
          <Loader>Loading field...</Loader>
        ) : (
          <div className="flex flex-col gap-2 font-mono">
            Name: <Input value={field?.name} onChange={handleChangeFactory("name")} />
            Preset Name: <Input value={field?.preset} onChange={handleChangeFactory("preset")} />
            Tooltip Label:{" "}
            <Input
              placeholder={"none"}
              value={field?.tooltip_label}
              onChange={handleChangeFactory("tooltip_label")}
            />
            Validator:{" "}
            <Input
              placeholder={"none"}
              value={field?.validator}
              onChange={handleChangeFactory("validator")}
            />
            Prefiller:{" "}
            <Input
              placeholder={"none"}
              value={field?.prefiller}
              onChange={handleChangeFactory("prefiller")}
            />
          </div>
        )}
        <div className="flex flex-row justify-between gap-1">
          <div className="flex-1" />
          <Button disabled={editing} onClick={() => void handleEdit()}>
            {editing ? "Editing..." : "Edit"}
          </Button>
          <Button disabled={editing} scheme="destructive" variant="outline" onClick={() => close()}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Shows a preview of the field to add.
 *
 * @component
 */
const FieldRegistration = ({ close }: { close: () => void }) => {
  const [field, setField] = useState<{
    name: string;
    preset?: string;
    tooltip_label?: string;
    validator?: string;
    prefiller?: string;
  }>({ name: "" });
  const [registering, setRegistering] = useState(false);

  // Handles editing the field
  const handleAdd = async () => {
    if (!field || !field?.name) return alert("Missing field name.");

    setRegistering(true);
    await formsControllerRegisterField({
      ...field,
      preset: field.preset ?? "default",
      tooltip_label: field.tooltip_label ?? null,
      validator: field.validator ?? null,
      prefiller: field.prefiller ?? null,
    });
    setRegistering(false);
    close();
  };

  // Creates handlers for each field prop
  const handleChangeFactory = (property: string) => (e: ChangeEvent<HTMLInputElement>) => {
    if (!field) return;
    setField({ ...field, [property]: e.target.value });
  };

  return (
    <div className="max-h-[600px] overflow-y-auto">
      <div className="flex min-w-xl flex-col gap-2">
        <div className="flex flex-col gap-2 font-mono">
          Name:{" "}
          <Input
            placeholder="category.fieldname"
            value={field?.name}
            onChange={handleChangeFactory("name")}
          />
          Preset Name:{" "}
          <Input
            placeholder="default"
            value={field?.preset}
            onChange={handleChangeFactory("preset")}
          />
          Tooltip Label:{" "}
          <Input
            placeholder={"none"}
            value={field?.tooltip_label}
            onChange={handleChangeFactory("tooltip_label")}
          />
          Validator:{" "}
          <Input
            placeholder={"none"}
            value={field?.validator}
            onChange={handleChangeFactory("validator")}
          />
          Prefiller:{" "}
          <Input
            placeholder={"none"}
            value={field?.prefiller}
            onChange={handleChangeFactory("prefiller")}
          />
        </div>
        <div className="flex flex-row justify-between gap-1">
          <div className="flex-1" />
          <Button disabled={registering} onClick={() => void handleAdd()}>
            {registering ? "Registering..." : "Register"}
          </Button>
          <Button
            disabled={registering}
            scheme="destructive"
            variant="outline"
            onClick={() => close()}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FieldRegistryPage;
