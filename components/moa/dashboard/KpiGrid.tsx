"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type Kpi = { label: string; value: number | string; hint?: string };

export default function KpiGrid({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
      {kpis.map((k) => (
        <Card key={k.label} className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm">{k.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-primary text-3xl font-bold">{k.value}</div>
            {k.hint ? <p className="text-muted-foreground mt-1 text-xs">{k.hint}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
