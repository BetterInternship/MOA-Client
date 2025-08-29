"use client";

type DetailProps = {
  label: string;
  value?: string;
  className?: string;
};

export default function Detail({ label, value, className }: DetailProps) {
  const text = value?.trim() ? value : "—";
  return (
    <div className={className}>
      <div className="text-muted-foreground text-sm">{label}</div>
      <div className="text-sm">{text}</div>
    </div>
  );
}
