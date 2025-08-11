"use client";

export default function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-muted-foreground text-sm">{label}</div>
      <div className="text-sm">{value?.trim() ? value : "—"}</div>
    </div>
  );
}
