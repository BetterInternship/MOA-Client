"use client";

export type Kpi = { label: string; value: number | string; hint?: string };

export default function KpiGrid({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
      {kpis.map((k) => (
        <div
          key={k.label}
          className="rounded-lg border bg-white p-6"
        >
          <div className="pb-2">
            <h2 className="text-sm font-semibold">{k.label}</h2>
          </div>
          <div>
            <div className="text-primary text-3xl font-bold">{k.value}</div>
            {k.hint ? <p className="text-muted-foreground mt-1 text-xs">{k.hint}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
