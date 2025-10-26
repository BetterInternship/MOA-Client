"use client";

import { useFormsControllerGetRegistry } from "@/app/api";
import { Button } from "@/components/ui/button";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRouter } from "next/navigation";

/**
 * Displays all the forms we have, and their latest versions.
 *
 * @component
 */
const FormRegistryPage = () => {
  const formRegistry = useFormsControllerGetRegistry();
  const forms = formRegistry.data?.registry ?? [];

  return (
    <div className="mx-auto mt-4 max-w-5xl">
      <h1 className="m-2 text-2xl font-bold tracking-tight">Form Registry</h1>
      <Table>
        <TableHeader>
          <TableHead>Form Identifier</TableHead>
          <TableHead>Current Revision Number</TableHead>
        </TableHeader>
        {forms.map((form) => (
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
  const handleView = () => {
    const encodedName = encodeURIComponent(name);
    const encodedVersion = encodeURIComponent(version);
    router.push(`./editor?name=${encodedName}&version=${encodedVersion}`);
  };

  return (
    <TableRow>
      <TableCell>{name}</TableCell>
      <TableCell>{version}</TableCell>
      <TableCell>
        <Button variant="outline" scheme="primary" size="xs" onClick={handleView}>
          View
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default FormRegistryPage;
