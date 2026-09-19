import { fetchHealth } from "@/lib/api";

const PHASES = [
  { phase: "Phase 1", label: "Foundation", status: "in progress" },
  { phase: "Phase 2", label: "Read-only integration", status: "pending" },
  { phase: "Phase 3", label: "Controlled cutover", status: "pending" },
  { phase: "Phase 4", label: "Fine-tuning", status: "pending" },
  { phase: "Phase 5", label: "Decommission WATI/Zoho", status: "pending" },
];

export default async function Home() {
  const health = await fetchHealth();

  return (
    <main className="flex-1 p-8">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        IGO Automate — Overview
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Centralized WhatsApp, email, onboarding, and AI persona automation, replacing WATI +
        Zoho Campaigns.
      </p>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Backend status</h2>
        <div className="mt-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          {health ? (
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">API</dt>
                <dd className="font-medium text-emerald-600 dark:text-emerald-400">
                  {health.ok ? "reachable" : "error"}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">Supabase</dt>
                <dd className="font-medium">
                  {health.supabaseConfigured ? "configured" : "not configured yet"}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">WhatsApp provider</dt>
                <dd className="font-medium">{health.whatsappProvider}</dd>
              </div>
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">AI provider</dt>
                <dd className="font-medium">{health.aiProvider}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-amber-700 dark:text-amber-400">
              API not reachable at {process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"} —
              start it with <code className="rounded bg-black/[.06] px-1 dark:bg-white/[.08]">npm run dev:api</code>.
            </p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Build phases</h2>
        <ol className="mt-2 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {PHASES.map((p) => (
            <li key={p.phase} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {p.phase} — {p.label}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  p.status === "in progress"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
                }`}
              >
                {p.status}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
