export function MetaRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {icon && <span className="text-muted-foreground mt-0.5">{icon}</span>}
      <div>
        <div className="text-muted-foreground text-xs">{label}</div>
        <div className="text-foreground">{value}</div>
      </div>
    </div>
  );
}
