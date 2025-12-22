"use client";

import {
  useFormsControllerGetRegistry,
  useFormsControllerGetRegistryFormMetadata,
} from "@/app/api";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Loader } from "@/components/ui/loader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
/**
 * Displays all the forms we have, and their latest versions.
 *
 * @component
 */
const FormRegistryPage = () => {
  const formRegistry = useFormsControllerGetRegistry();
  const forms = formRegistry.data?.registry ?? [];
  const formSorted = forms.sort((a, b) => a.name.localeCompare(b.name));
  console.log("Form Registry Data:", forms);

  const isLoading = formRegistry.isLoading;
  const error = formRegistry.error;

  return (
    <div className="min-h-screen w-full p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-4 text-2xl font-bold tracking-tight">Form Registry</h1>

        {error && <div className="text-destructive mb-6">Failed to load forms</div>}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader>Loading forms...</Loader>
          </div>
        ) : forms.length === 0 ? (
          <div className="text-muted-foreground py-12 text-center">No forms found</div>
        ) : (
          <div className="rounded-[0.33em] border p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Form Name</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formSorted.map((form) => (
                  <FormRegistryRow
                    key={form.name}
                    name={form.name}
                    version={form.version}
                    lastUpdated={
                      form.time_generated
                        ? new Date(form.time_generated).toLocaleString()
                        : "Unknown"
                    }
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * A form row in the registry table.
 *
 * @component
 */
const FormRegistryRow = ({
  name,
  version,
  lastUpdated,
}: {
  name: string;
  version: number;
  lastUpdated: string;
}) => {
  const router = useRouter();

  // Navigate to the PDF editor with form metadata state
  const handleEdit = () => {
    const encodedName = encodeURIComponent(name);
    const encodedVersion = encodeURIComponent(version);
    router.push(`./editor/pdfjs?name=${encodedName}&version=${encodedVersion}&edit=true`);
  };

  return (
    <TableRow>
      <TableCell>{name}</TableCell>
      <TableCell>v{version}</TableCell>
      <TableCell>{lastUpdated}</TableCell>
      <TableCell className="text-right">
        <Button onClick={handleEdit} variant="outline" size="sm">
          Edit
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default FormRegistryPage;
