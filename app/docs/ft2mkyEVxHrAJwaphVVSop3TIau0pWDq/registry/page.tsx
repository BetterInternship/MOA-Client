"use client";

import { useFormsControllerGetRegistry } from "@/app/api";
import { useModal } from "@/app/providers/modal-provider";
import { Button } from "@/components/ui/button";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { useFormsControllerGetRegistryFormMetadata } from "../../../api/app/api/endpoints/forms/forms";
import JsonView from "@uiw/react-json-view";
import { Loader } from "@/components/ui/loader";
import { Badge } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";

/**
 * Displays all the forms we have, and their latest versions.
 *
 * @component
 */
const FormRegistryPage = () => {
  const formRegistry = useFormsControllerGetRegistry();
  const forms = formRegistry.data?.registry ?? [];
  const formSorted = forms.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto mt-4 max-w-5xl">
      <h1 className="m-2 text-2xl font-bold tracking-tight">Form Registry</h1>
      <Table>
        <TableHeader>
          <TableHead>Form Identifier</TableHead>
          <TableHead>Current Revision Number</TableHead>
        </TableHeader>
        {formSorted.map((form) => (
          <FormRegistryEntry name={form.name} version={form.version} />
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
const FormRegistryEntry = ({ name, version }: { name: string; version: number }) => {
  const router = useRouter();
  const { openModal, closeModal } = useModal();

  // Opens the document in the editor page
  const handleView = () => {
    const encodedName = encodeURIComponent(name);
    const encodedVersion = encodeURIComponent(version);
    router.push(`./editor?name=${encodedName}&version=${encodedVersion}`);
  };

  // Opens the document in the editor page
  const handleMetadataPreview = () => {
    openModal("form-metadata-preview", <FormMetadataPreview name={name} version={version} />, {
      title: (
        <div className="flex flex-col gap-2">
          <div className="flex flex-row items-center gap-2">
            <Badge>
              <pre className="inline-block">{name}</pre>
            </Badge>
            <span className="font-semibold tracking-tight">Metadata Preview</span>
          </div>
          <Divider />
        </div>
      ),
    });
  };

  return (
    <TableRow>
      <TableCell>{name}</TableCell>
      <TableCell>{version}</TableCell>
      <TableCell>
        <div className="flex flex-row gap-2">
          <Button variant="outline" scheme="primary" size="xs" onClick={handleMetadataPreview}>
            Preview Metadata
          </Button>
          <Button variant="outline" scheme="primary" size="xs" onClick={handleView}>
            View
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

/**
 * Shows a preview of the form metadata.
 *
 * @component
 */
const FormMetadataPreview = ({ name, version }: { name: string; version: number }) => {
  const formMetadata = useFormsControllerGetRegistryFormMetadata({ name, version });

  return (
    <div className="flex min-w-xl flex-col gap-2">
      <div className="h-[600px] max-h-[600px] overflow-y-auto">
        {formMetadata.error || !formMetadata.data?.success ? (
          <div className="text-destructive">
            {formMetadata.error?.message ?? formMetadata.data?.message}
          </div>
        ) : formMetadata.isLoading || formMetadata.isFetching ? (
          <Loader>Loading preview...</Loader>
        ) : (
          <div className="py-4">
            <JsonView
              indentWidth={22}
              displayDataTypes={false}
              value={formMetadata.data?.formMetadata}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FormRegistryPage;
