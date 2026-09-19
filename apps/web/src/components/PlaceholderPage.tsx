export function PlaceholderPage({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{title}</h1>
      <span className="mt-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
        {phase}
      </span>
      <p className="mt-4 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
  );
}
