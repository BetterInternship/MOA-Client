"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HeaderIcon, HeaderText } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Newspaper, Search, Filter, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import FormCard from "@/components/docs/dashboard/FormCard";
import { getAllSignedForms } from "@/app/api/forms.api";

type SignedDoc = {
  id: string | number;
  form_name: string;
  form_label: string;
  prefilled_document_id?: string;
  pending_document_id?: string;
  signed_document_id?: string;
  timestamp: string;
  url: string;
};

export default function DocsDashboardPage() {
  const {
    data: rows = [],
    isLoading,
    error,
  } = useQuery<SignedDoc[], unknown>({
    queryKey: ["docs-signed"],
    queryFn: async () => {
      const res = await getAllSignedForms();
      return res?.signedDocuments ?? [];
    },
    staleTime: 60_000,
  });

  const [rawSearch, setRawSearch] = useState("");
  const [search, setSearch] = useState("");
  const [selectedFormType, setSelectedFormType] = useState<string>("all");
  const [dateRange, setDateRange] = useState<"all" | "7" | "30">("all");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "name_asc" | "name_desc">(
    "date_desc"
  );

  useEffect(() => {
    const t = setTimeout(() => setSearch(rawSearch.trim()), 300);
    return () => clearTimeout(t);
  }, [rawSearch]);

  const sortedRows = useMemo(() => {
    const copy = Array.isArray(rows) ? [...rows] : [];
    // We'll apply base sort (date desc) then later additional sorting from UI
    copy.sort((a, b) => {
      const ta = Date.parse(a?.timestamp ?? "") || 0;
      const tb = Date.parse(b?.timestamp ?? "") || 0;
      return tb - ta;
    });

    // apply UI sort fallback (if different)
    if (sortBy === "date_desc") return copy;
    if (sortBy === "date_asc") return copy.slice().reverse();
    if (sortBy === "name_asc")
      return copy
        .slice()
        .sort((a, b) =>
          String(a.form_label ?? a.form_name ?? "").localeCompare(
            String(b.form_label ?? b.form_name ?? "")
          )
        );
    if (sortBy === "name_desc")
      return copy
        .slice()
        .sort((a, b) =>
          String(b.form_label ?? b.form_name ?? "").localeCompare(
            String(a.form_label ?? a.form_name ?? "")
          )
        );

    return copy;
  }, [rows, sortBy]);

  const formTypes = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      const label = r.form_label ?? r.form_name ?? "Unknown";
      set.add(label);
    }
    return Array.from(set).slice(0, 20);
  }, [rows]);

  // compute filtered rows
  const filteredRows = useMemo(() => {
    if (!sortedRows || sortedRows.length === 0) return [];

    const now = Date.now();
    const daysToMs = (d: number) => d * 24 * 60 * 60 * 1000;

    return sortedRows.filter((r) => {
      // search filter (title or name)
      if (search) {
        const hay = `${r.form_label ?? ""} ${r.form_name ?? ""}`.toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }

      // form type filter
      if (selectedFormType !== "all") {
        const label = r.form_label ?? r.form_name ?? "";
        if (label !== selectedFormType) return false;
      }

      // date range filter
      if (dateRange !== "all" && r.timestamp) {
        const ts = Date.parse(r.timestamp);
        if (Number.isNaN(ts)) return false;
        const days = Number(dateRange);
        if (now - ts > daysToMs(days)) return false;
      }

      return true;
    });
  }, [sortedRows, search, selectedFormType, dateRange]);

  function clearFilters() {
    setRawSearch("");
    setSearch("");
    setSelectedFormType("all");
    setDateRange("all");
    setSortBy("date_desc");
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 pt-6 sm:px-10 sm:pt-16">
      {/* Header */}
      <div className="mb-6 space-y-2 sm:mb-8">
        <div className="flex items-center gap-3">
          <HeaderIcon icon={Newspaper} />
          <HeaderText>My Signed Forms</HeaderText>
        </div>
        <p className="text-sm text-gray-600 sm:text-base">
          All internship forms you’ve successfully signed and completed.
        </p>
      </div>

      {/* Controls row */}
      <div className="mb-4 flex flex-row gap-3 sm:items-center sm:justify-between">
        {/* Search (left) */}
        <div className="flex w-full items-center gap-3 sm:w-2/4">
          <div className="relative w-full">
            <span className="pointer-events-none absolute top-1/2 left-3 z-99 -translate-y-1/2">
              <Search className="h-4.5 w-4.5 text-gray-400" />
            </span>

            <Input
              aria-label="Search signed forms"
              value={rawSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRawSearch(e.target.value)}
              placeholder="Search by form name, title, or keyword..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Filters popover (right) */}
        <div className="flex w-fit items-center justify-end gap-2 sm:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="md" className="flex items-center gap-2 p-2">
                <Filter className="h-4 w-4" />
                <ChevronDown className="mt-0.5 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[20rem] p-0">
              <div className="p-4">
                <Tabs defaultValue="filters">
                  <TabsList className="rounded-[0.33em]">
                    <TabsTrigger value="filters" className="w-fit rounded-[0.33em]!">
                      Filters
                    </TabsTrigger>
                    <TabsTrigger value="sort" className="w-fit rounded-[0.33em]!">
                      Sort
                    </TabsTrigger>
                  </TabsList>

                  {/* Filters tab */}
                  <TabsContent value="filters">
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium">Form</label>
                        <Select
                          value={selectedFormType}
                          onValueChange={(val) => setSelectedFormType(val)}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="All forms" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All forms</SelectItem>
                            {formTypes.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">Date range</label>
                        <Select
                          value={dateRange}
                          onValueChange={(val) => setDateRange(val as "all" | "7" | "30")}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="All time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All time</SelectItem>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <Button onClick={clearFilters} variant="outline" size="sm">
                          Reset
                        </Button>
                        <div className="text-muted-foreground text-sm">
                          {filteredRows.length} results
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Sort tab */}
                  <TabsContent value="sort">
                    <div className="space-y-3">
                      <label className="mb-1 block text-sm font-medium">Sort by</label>
                      <Select value={sortBy} onValueChange={(val) => setSortBy(val as any)}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Date (newest)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date_desc">Date (newest)</SelectItem>
                          <SelectItem value="date_asc">Date (oldest)</SelectItem>
                          <SelectItem value="name_asc">Name (A → Z)</SelectItem>
                          <SelectItem value="name_desc">Name (Z → A)</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="text-muted-foreground text-sm">
                        Current sort:{" "}
                        <span className="font-medium">
                          {sortBy === "date_desc"
                            ? "Date (newest)"
                            : sortBy === "date_asc"
                              ? "Date (oldest)"
                              : sortBy === "name_asc"
                                ? "Name (A → Z)"
                                : "Name (Z → A)"}
                        </span>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Panel */}
      <Card className="p-3 sm:p-4">
        {/* Status + count row */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {isLoading
              ? "Loading signed documents…"
              : `${filteredRows.length} result${filteredRows.length !== 1 ? "s" : ""}`}
          </div>
          <div className="text-muted-foreground hidden text-xs sm:block">
            Showing {filteredRows.length} of {sortedRows.length} total
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : error ? (
          <div className="text-sm text-red-600">Failed to load signed documents.</div>
        ) : sortedRows.length === 0 ? (
          <div className="text-muted-foreground text-sm">You haven’t signed any documents yet.</div>
        ) : filteredRows.length === 0 ? (
          <div className="text-sm text-gray-600">No documents match your search or filters.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredRows.map((row) => (
              <FormCard
                key={row.id ?? `${row.form_name ?? "row"}-${Math.random()}`}
                title={row.form_label ?? "Form"}
                requestedAt={row.timestamp}
                downloadUrl={row.url}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/** Minimal loading card */
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 p-3.5 dark:border-gray-800">
      <div className="flex items-center gap-2.5">
        <div className="bg-muted h-7 w-7 animate-pulse rounded-lg" />
        <div className="flex-1">
          <div className="bg-muted h-3 w-40 animate-pulse rounded" />
          <div className="bg-muted mt-2 h-2.5 w-28 animate-pulse rounded" />
        </div>
        <div className="bg-muted h-5 w-20 animate-pulse rounded-full" />
      </div>
      <div className="mt-3.5 flex gap-1.5">
        <div className="bg-muted h-8 w-20 animate-pulse rounded" />
        <div className="bg-muted h-8 w-24 animate-pulse rounded" />
      </div>
    </div>
  );
}
