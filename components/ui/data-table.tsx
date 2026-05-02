"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  Updater,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";

/**
 * Reusable table shell used by registry screens.
 * Provides consistent filtering, sorting, column visibility, selection, and pagination UX.
 */
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Optional: which column(s) to bind the top search box to (e.g., "company") */
  searchLabel?: string;
  /** single key or multiple keys to search across */
  searchKey?: string | string[];
  /** Optional: show column visibility menu (default: true) */
  enableColumnVisibility?: boolean;
  /** Optional: enable row selection with checkboxes (default: false) */
  enableRowSelection?: boolean;
  /** Optional: initial sorting state */
  initialSorting?: SortingState;
  /** Optional: persist sorting state in localStorage under this key */
  sortingStorageKey?: string;
  /** Optional: right-side toolbar slot (e.g., extra buttons) */
  toolbarActions?: React.ReactNode;
  /** Optional: override the search input placeholder */
  searchPlaceholder?: string;
  /** Optional: labels used in the pagination row count */
  rowLabelSingular?: string;
  rowLabelPlural?: string;
  /** Optional: page size options */
  pageSizes?: number[];
  /** Optional: className for wrapper */
  className?: string;
  onSelectionChange?: (rows: TData[]) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchLabel,
  searchKey,
  enableColumnVisibility = true,
  enableRowSelection = false,
  initialSorting,
  sortingStorageKey,
  toolbarActions,
  searchPlaceholder = "Search forms...",
  rowLabelSingular = "form",
  rowLabelPlural = "forms",
  pageSizes = [5, 10, 20, 50],
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(() => {
    if (!sortingStorageKey) return initialSorting ?? [];

    try {
      return JSON.parse(localStorage.getItem(sortingStorageKey) || "") || initialSorting || [];
    } catch {
      return initialSorting ?? [];
    }
  });
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({} as Record<string, boolean>);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const handleSortingChange = React.useCallback(
    (updater: Updater<SortingState>) => {
      setSorting((currentSorting) => {
        const nextSorting = typeof updater === "function" ? updater(currentSorting) : updater;

        if (sortingStorageKey) {
          try {
            localStorage.setItem(sortingStorageKey, JSON.stringify(nextSorting));
          } catch {
            // Keep sorting usable even when storage is unavailable.
          }
        }

        return nextSorting;
      });
    },
    [sortingStorageKey]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    enableRowSelection, // enables internal selection state
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue ?? "")
        .toLowerCase()
        .trim();
      if (!query) return true;

      return row.getAllCells().some((cell) => {
        const value = cell.getValue();
        if (value == null) return false;
        return String(value).toLowerCase().includes(query);
      });
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // Keep page size stable across renders
    initialState: { pagination: { pageSize: pageSizes[0] ?? 10 } },
  });

  const searchKeys = React.useMemo(() => {
    if (!searchKey) return [] as string[];
    return Array.isArray(searchKey) ? searchKey : [searchKey];
  }, [searchKey]);

  // Allow user to pick a single column to search. Default to first provided searchKey
  const [selectedSearchKey, setSelectedSearchKey] = React.useState<string>(searchKeys[0] ?? "");

  React.useEffect(() => {
    if (searchKeys.length) {
      setSelectedSearchKey(searchKeys[0]);
      return;
    }

    // If no searchKey prop provided, default to first filterable column when table is ready
    const first = table.getAllLeafColumns().find((c) => c.getCanFilter() !== false);
    if (first) setSelectedSearchKey(first.id);
  }, [JSON.stringify(searchKeys), table]);

  const effectiveSearchKeys = React.useMemo(() => {
    return selectedSearchKey ? [selectedSearchKey] : searchKeys;
  }, [selectedSearchKey, searchKeys]);

  return (
    <div className={cn("flex min-h-0 flex-col gap-3", className)}>
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex w-full items-stretch gap-2 sm:w-auto">
          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 gap-2">
                  <SlidersHorizontal className="mt-0.5 h-4 w-4" />
                  View
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllLeafColumns()
                  .filter((col) => col.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(checked) => column.toggleVisibility(!!checked)}
                    >
                      {String(column.columnDef.header ?? column.id)}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {effectiveSearchKeys.length > 0 && (
            <div className="flex items-center gap-2">
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="h-10 w-full sm:w-96"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {toolbarActions}
          {/* <Button variant="ghost" size="sm" onClick={resetFilters} disabled={!isFiltered}>
            Clear
          </Button> */}
        </div>
      </div>

      {/* Table */}
      <div className="min-h-0 flex-1 rounded-[0.1em] [&_[data-slot=table-container]]:h-full [&_[data-slot=table-container]]:overflow-auto">
        <Table className="table-fixed">
          <TableHeader className="[&_tr]:border-b-0">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {enableRowSelection && (
                  <TableHead className="sticky top-0 z-20 w-[42px] bg-gray-100 shadow-[inset_0_-2px_0_theme(colors.gray.300)]">
                    <Checkbox
                      checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                      }
                      onCheckedChange={(val) => table.toggleAllPageRowsSelected(!!val)}
                      aria-label="Select all"
                    />
                  </TableHead>
                )}
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "font-heading sticky top-0 z-20 max-w-0 bg-gray-100 tracking-tight text-gray-600 shadow-[inset_0_-2px_0_theme(colors.gray.300)] transition-colors duration-300",
                      header.column.getCanSort() && "cursor-pointer select-none hover:bg-gray-200",
                      header.column.getIsSorted() && "bg-gray-50 hover:bg-gray-200"
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-1">
                          <span
                            className={cn(
                              "font-demibold min-w-0 truncate rounded px-1.5 py-0.5 transition-colors duration-300",
                              header.column.getIsSorted() && "text-primary"
                            )}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          {header.column.getCanSort() && !header.column.getIsSorted() && (
                            <ChevronsUpDown className="text-muted-foreground/40 mt-0.5 h-4 w-4 shrink-0" />
                          )}
                          {header.column.getIsSorted() === "asc" && (
                            <ChevronUp className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                          )}
                          {header.column.getIsSorted() === "desc" && (
                            <ChevronDown className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                          )}
                        </div>
                        <span
                          className={cn(
                            "bg-primary/85 mr-2 h-3 w-3 shrink-0 rounded-full transition-all duration-300 ease-out",
                            header.column.getIsSorted()
                              ? "scale-100 opacity-100"
                              : "scale-50 opacity-0"
                          )}
                          aria-hidden="true"
                        />
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  className="even:bg-muted/40 hover:bg-primary/10 odd:bg-white"
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {enableRowSelection && (
                    <TableCell className="w-[42px]">
                      <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(val) => row.toggleSelected(!!val)}
                        aria-label="Select row"
                      />
                    </TableCell>
                  )}
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="max-w-0">
                      <div className="min-w-0 truncate px-1.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getVisibleLeafColumns().length + (enableRowSelection ? 1 : 0)}
                  className="h-24 px-1.5 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="z-10 flex shrink-0 flex-col items-center justify-between gap-1 border-t bg-white py-1 sm:flex-row">
        <div className="text-muted-foreground px-1.5 text-sm">
          {table.getFilteredRowModel().rows.length}{" "}
          {table.getFilteredRowModel().rows.length === 1 ? rowLabelSingular : rowLabelPlural}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-sm">Rows per page</span>
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(val: string) => table.setPageSize(Number(val))}
          >
            <SelectTrigger className="w-fit!">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {pageSizes.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-1 text-sm">
              Page {table.getState().pagination.pageIndex + 1} {""}
              of {table.getPageCount() || 1}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
