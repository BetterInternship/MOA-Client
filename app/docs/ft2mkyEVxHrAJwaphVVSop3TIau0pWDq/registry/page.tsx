"use client";

import { useState, useEffect } from "react";
import { useFormsControllerGetRegistry, formSyncControllerCompareFormVersions } from "@/app/api";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Loader } from "@/components/ui/loader";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Loader2, AlertCircle, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

interface ComparisonItem {
  formName: string;
  devVersion: number;
  devId: string;
  prodVersion: number;
  prodId: string | null;
  isSynced: boolean;
}

interface FormRow {
  name: string;
  version: number;
  id: string;
  comparisonItem?: ComparisonItem;
  comparisonLoading: boolean;
  onEdit: (name: string) => void;
}

/**
 * Displays all the forms we have, and their latest versions.
 * Shows comparison with production environment.
 * Sync operations are handled on the dedicated sync page.
 *
 * @component
 */
const FormRegistryPage = () => {
  const router = useRouter();
  const formRegistry = useFormsControllerGetRegistry();
  const forms = formRegistry.data?.registry ?? [];
  const formSorted = forms.sort((a, b) => a.name.localeCompare(b.name));

  const [comparison, setComparison] = useState<ComparisonItem[]>([]);
  const [comparisonLoading, setComparisonLoading] = useState(true);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  const isLoading = formRegistry.isLoading;
  const error = formRegistry.error;

  const handleCreateForm = () => {
    router.push("./editor/pdfjs");
  };

  const handleMigrateForm = () => {
    router.push("./editor/migrate");
  };

  const handleGoToSync = () => {
    router.push("./sync");
  };

  useEffect(() => {
    loadComparison();
  }, []);

  const loadComparison = async () => {
    setComparisonLoading(true);
    setComparisonError(null);

    try {
      const data = await formSyncControllerCompareFormVersions();
      setComparison(data || []);
    } catch (err) {
      setComparisonError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setComparisonLoading(false);
    }
  };

  const syncedCount = comparison.filter((f) => f.isSynced).length;
  const unsyncedCount = comparison.length - syncedCount;

  const handleEditForm = (name: string) => {
    const encodedName = encodeURIComponent(name);
    router.push(`./editor/pdfjs?name=${encodedName}&edit=true`);
  };

  const columns: ColumnDef<FormRow>[] = [
    {
      accessorKey: "name",
      header: "Form Name",
    },
    {
      accessorKey: "version",
      header: "Dev Version",
      cell: ({ row }) => `v${row.getValue("version")}`,
    },
    {
      accessorKey: "id",
      header: "Dev ID",
      cell: ({ row }) => (
        <span className="text-xs text-slate-500">
          {(row.getValue("id") as string)?.slice(0, 8)}...
        </span>
      ),
    },
    {
      accessorKey: "comparisonItem",
      header: "Prod Status",
      cell: ({ row }) => {
        const item = row.original;
        if (item.comparisonLoading) {
          return <Loader2 className="h-4 w-4 animate-spin text-slate-400" />;
        }
        if (item.comparisonItem?.isSynced) {
          return (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-600">
                Synced (v{item.comparisonItem.prodVersion})
              </span>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-medium text-amber-600">
              {item.comparisonItem?.prodVersion ? "Out of sync" : "Not synced"}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <Button
          onClick={() => row.original.onEdit(row.original.name)}
          variant="outline"
          size="sm"
          className="ml-auto"
        >
          Edit
        </Button>
      ),
    },
  ];

  const tableData: FormRow[] = formSorted.map((form) => ({
    name: form.name,
    version: form.version,
    id: form.id,
    comparisonItem: comparison.find((c) => c.formName === form.name),
    comparisonLoading,
    onEdit: handleEditForm,
  }));

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">Form Registry</h1>
            <p className="mt-2 text-slate-600">Manage forms across your development environment</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleMigrateForm} variant="outline" className="gap-2">
              ↻ Migrate Form (v0 → v1)
            </Button>
            <Button onClick={handleCreateForm} className="gap-2">
              + Create Form
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-4 gap-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="mb-1 text-sm text-slate-600">Total Forms</p>
            <p className="text-3xl font-bold text-slate-900">{forms.length}</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="mb-1 text-sm text-slate-600">Synced to Prod</p>
            <p className="text-3xl font-bold text-green-600">{syncedCount}</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="mb-1 text-sm text-slate-600">Out of Sync</p>
            <p className="text-3xl font-bold text-amber-600">{unsyncedCount}</p>
          </div>
          <div className="flex flex-col gap-2 rounded-lg bg-white p-6 shadow">
            <button
              onClick={loadComparison}
              disabled={comparisonLoading}
              className="flex items-center gap-2 rounded text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <Button onClick={handleGoToSync} className="gap-2 text-sm" size="sm">
              Manage Sync →
            </Button>
          </div>
        </div>

        {comparisonError && (
          <div className="mb-8 rounded-lg border-l-4 border-red-400 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-600" />
              <div>
                <h3 className="mb-1 font-semibold text-red-900">Error Loading Comparison</h3>
                <p className="text-sm text-red-800">{comparisonError}</p>
              </div>
            </div>
          </div>
        )}

        {error && <div className="text-destructive mb-6">Failed to load forms</div>}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader>Loading forms...</Loader>
          </div>
        ) : forms.length === 0 ? (
          <div className="text-muted-foreground py-12 text-center">No forms found</div>
        ) : (
          <div className="space-y-6">
            <DataTable columns={columns} data={tableData} pageSizes={[999]} />
          </div>
        )}
      </div>
    </div>
  );
};

export default FormRegistryPage;
