type Status = "ok" | "warn" | "off";

const DOT_COLOR: Record<Status, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  off: "bg-zinc-400 dark:bg-zinc-600",
};

export function KpiCard({
  label,
  value,
  sublabel,
  status,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  status?: Status;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center gap-2">
        {status && <span className={`h-2 w-2 rounded-full ${DOT_COLOR[status]}`} />}
        <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{value}</p>
      {sublabel && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{sublabel}</p>}
    </div>
  );
}
