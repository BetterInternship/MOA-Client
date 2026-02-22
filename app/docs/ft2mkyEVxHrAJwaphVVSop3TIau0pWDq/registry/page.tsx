"use client";

import { useState, useEffect, useMemo } from "react";
import { formSyncControllerCompareFormVersions, useFormsControllerGetRegistry } from "@/app/api";
import { fetchAllFormGroups } from "@/app/api/forms.api";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Loader } from "@/components/ui/loader";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle, CheckCircle2, XCircle, RefreshCw, ChevronDown } from "lucide-react";

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
  label: string;
  version: number;
  lastUpdated?: string;
  comparisonItem?: ComparisonItem;
  comparisonLoading: boolean;
  onEdit: (name: string) => void;
}

interface FormGroup {
  id: string;
  name?: string;
  description?: string;
  forms?: string[];
}

interface RegistrySection {
  id: string;
  title: string;
  count: number;
  rows: FormRow[];
  missingCount?: number;
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => new Set(["all"]));

  const [comparison, setComparison] = useState<ComparisonItem[]>([]);
  const [comparisonLoading, setComparisonLoading] = useState(true);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  const formRegistry = useFormsControllerGetRegistry({
    query: {
      staleTime: 60_000,
    },
  });
  const forms = formRegistry.data?.registry ?? [];
  const isLoading = formRegistry.isLoading;
  const error = formRegistry.error;

  const handleCreateForm = () => {
    router.push("./create-form");
  };

  const handleGoToSync = () => {
    router.push("./sync");
  };

  const {
    data: groupsData,
    error: groupsError,
    isLoading: groupsLoading,
  } = useQuery({
    queryKey: ["FormGroupsController_GetAllFormGroups"],
    queryFn: fetchAllFormGroups,
  });
  const formGroups = ((groupsData?.groups || []) as FormGroup[]).slice().sort((a, b) => {
    const titleA = (a.name || a.description || `Group ${a.id.slice(0, 8)}`).toLowerCase();
    const titleB = (b.name || b.description || `Group ${b.id.slice(0, 8)}`).toLowerCase();
    return titleA.localeCompare(titleB);
  });
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
    router.push(`./editor?form_name=${encodeURIComponent(name)}`);
  };

  const columns: ColumnDef<FormRow>[] = [
    {
      accessorKey: "name",
      header: "Form Name",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-slate-900">{item.label}</div>
            <div className="truncate text-xs text-slate-500">{item.name}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "version",
      header: "Dev Version",
      cell: ({ row }) => `v${row.getValue("version")}`,
    },
    {
      accessorKey: "lastUpdated",
      header: "Last Updated",
      cell: ({ row }) => {
        const timestamp = row.getValue("lastUpdated") as string | undefined;
        if (!timestamp) return <span className="text-xs text-slate-400">—</span>;
        const date = new Date(timestamp);
        return (
          <span className="text-xs text-slate-600">
            {date.toLocaleDateString()} {date.toLocaleTimeString()}
          </span>
        );
      },
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

  const comparisonMap = useMemo(
    () => new Map(comparison.map((item) => [item.formName, item])),
    [comparison]
  );

  const formsSorted = useMemo(() => {
    return [...forms].sort((a, b) => {
      const labelA = (a.label || a.name).toLowerCase();
      const labelB = (b.label || b.name).toLowerCase();
      const labelSort = labelA.localeCompare(labelB);
      if (labelSort !== 0) return labelSort;
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
  }, [forms]);

  const tableData: FormRow[] = useMemo(
    () =>
      formsSorted.map((form) => ({
        name: form.name,
        label: form.label || form.name,
        version: form.version,
        lastUpdated: (form as any).time_generated,
        comparisonItem: comparisonMap.get(form.name),
        comparisonLoading,
        onEdit: handleEditForm,
      })),
    [comparisonLoading, comparisonMap, formsSorted]
  );

  const sections = useMemo(() => {
    const formsByName = new Map(tableData.map((row) => [row.name, row]));
    const groupSections: RegistrySection[] = [];

    for (const group of formGroups) {
      const formNames = group.forms || [];
      const rows: FormRow[] = [];
      let missingCount = 0;

      for (const formName of formNames) {
        const row = formsByName.get(formName);
        if (row) {
          rows.push(row);
        } else {
          missingCount += 1;
        }
      }

      groupSections.push({
        id: `group:${group.id}`,
        title: group.name || group.description || `Group ${group.id.slice(0, 8)}`,
        count: rows.length,
        rows,
        missingCount,
      });
    }

    return {
      all: {
        id: "all",
        title: "All Forms",
        count: tableData.length,
        rows: tableData,
      } as RegistrySection,
      groups: groupSections,
    };
  }, [formGroups, tableData]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderSection = (section: RegistrySection) => {
    const isExpanded = expandedSections.has(section.id);
    return (
      <div key={section.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => toggleSection(section.id)}
          className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
        >
          <div className="flex items-center gap-3">
            <ChevronDown
              className={`h-4 w-4 text-slate-500 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
            <div className="text-sm font-semibold text-slate-800">{section.title}</div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {section.count}
            </span>
            {!!section.missingCount && section.missingCount > 0 && (
              <span className="text-xs text-slate-500">{section.missingCount} missing</span>
            )}
          </div>
        </button>
        {isExpanded && (
          <div className="border-t border-slate-200 p-4">
            {section.rows.length === 0 ? (
              <div className="text-muted-foreground py-4 text-sm">No forms in this section</div>
            ) : (
              <DataTable columns={columns} data={section.rows} pageSizes={[999]} />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">Form Registry</h1>
            <p className="mt-2 text-slate-600">Manage forms across your development environment</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateForm} className="gap-2">
              + Create Form
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-4 gap-4">
          <div className="rounded-[0.33em] border border-slate-200 bg-white p-4">
            <p className="mb-1 text-xs font-medium text-slate-500">Total Forms</p>
            <p className="text-3xl font-bold text-slate-900">{forms.length}</p>
          </div>
          <div className="rounded-[0.33em] border border-slate-200 bg-white p-4">
            <p className="mb-1 text-xs font-medium text-slate-500">Synced to Prod</p>
            <p className="text-3xl font-bold text-green-600">{syncedCount}</p>
          </div>
          <div className="rounded-[0.33em] border border-slate-200 bg-white p-4">
            <p className="mb-1 text-xs font-medium text-slate-500">Out of Sync</p>
            <p className="text-3xl font-bold text-amber-600">{unsyncedCount}</p>
          </div>
          <div className="flex flex-col gap-2 rounded-[0.33em] border border-slate-200 bg-white p-4">
            <button
              onClick={loadComparison}
              disabled={comparisonLoading}
              className="inline-flex items-center gap-2 rounded-[0.33em] px-1 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <Button onClick={handleGoToSync} className="gap-2 text-xs" size="sm" variant="outline">
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

        {groupsError && (
          <div className="mb-6 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-900">Could not load folders</p>
                <p className="text-xs text-amber-800">
                  Showing all forms only. Form groups are temporarily unavailable.
                </p>
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
            {renderSection(sections.all)}
            {!groupsError &&
              !groupsLoading &&
              sections.groups.map((section) => renderSection(section))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormRegistryPage;
