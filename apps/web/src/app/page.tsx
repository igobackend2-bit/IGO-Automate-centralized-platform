import { fetchHealth, fetchOverview } from "@/lib/api";
import { KpiCard } from "@/components/KpiCard";

export default async function Home() {
  const [health, overview] = await Promise.all([fetchHealth(), fetchOverview()]);

  return (
    <main className="flex-1 p-8">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        IGO Automate — Overview
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        One place for WhatsApp, email, SMS, onboarding, and AI persona automation across every
        brand.
      </p>

      {!health || !overview ? (
        <p className="mt-8 text-sm text-amber-700 dark:text-amber-400">
          API not reachable at {process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"} —
          start it with <code className="rounded bg-black/[.06] px-1 dark:bg-white/[.08]">npm run dev</code>{" "}
          in <code className="rounded bg-black/[.06] px-1 dark:bg-white/[.08]">apps/api</code>.
        </p>
      ) : (
        <>
          <section className="mt-8">
            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Reach</h2>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard
                label="Websites connected"
                value={overview.brands ? `${overview.brands.active}/28` : "—"}
                sublabel={overview.brands ? `${overview.brands.total} brand rows in the system` : undefined}
                status={overview.brands && overview.brands.active > 0 ? "ok" : "off"}
              />
              <KpiCard
                label="Social accounts connected"
                value={overview.socialAccounts.connected}
                sublabel="Not yet integrated — Social Responder persona is planned, not built"
                status="off"
              />
              <KpiCard
                label="Total leads"
                value={overview.customers?.total ?? "—"}
                sublabel={overview.customers ? `${overview.customers.last7Days} in the last 7 days` : undefined}
                status={overview.customers && overview.customers.total > 0 ? "ok" : "off"}
              />
              <KpiCard
                label="Aria training turns"
                value={overview.conversationLogs?.total ?? "—"}
                sublabel="Real conversation turns logged for Phase 4 fine-tuning"
                status={overview.conversationLogs && overview.conversationLogs.total > 0 ? "ok" : "off"}
              />
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Sending</h2>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard
                label="Campaigns"
                value={overview.campaigns?.total ?? "—"}
                status={overview.campaigns && overview.campaigns.total > 0 ? "ok" : "off"}
              />
              <KpiCard
                label="Messages sent"
                value={overview.messages?.sent ?? "—"}
                sublabel={overview.messages ? `${overview.messages.total} total logged` : undefined}
                status="off"
              />
              <KpiCard label="WhatsApp provider" value={health.whatsappProvider} status="ok" />
              <KpiCard label="AI provider" value={health.aiProvider} status="ok" />
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Infrastructure</h2>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard label="API" value={health.ok ? "reachable" : "error"} status={health.ok ? "ok" : "warn"} />
              <KpiCard
                label="Supabase"
                value={health.supabaseConfigured ? "configured" : "not configured"}
                status={health.supabaseConfigured ? "ok" : "off"}
              />
              <KpiCard
                label="Evolution API"
                value={
                  !overview.evolutionApi.configured
                    ? "not configured"
                    : overview.evolutionApi.reachable
                      ? "reachable"
                      : "unreachable"
                }
                status={
                  !overview.evolutionApi.configured ? "off" : overview.evolutionApi.reachable ? "ok" : "warn"
                }
              />
              <KpiCard
                label="listmonk"
                value={
                  !overview.listmonk.configured
                    ? "not configured"
                    : overview.listmonk.reachable
                      ? "reachable"
                      : "unreachable"
                }
                status={!overview.listmonk.configured ? "off" : overview.listmonk.reachable ? "ok" : "warn"}
              />
              <KpiCard
                label="n8n workflows"
                value={overview.n8n.configured ? (overview.n8n.workflowCount ?? "—") : "not configured"}
                sublabel={
                  overview.n8n.configured && overview.n8n.activeWorkflowCount !== null
                    ? `${overview.n8n.activeWorkflowCount} active`
                    : undefined
                }
                status={!overview.n8n.configured ? "off" : overview.n8n.reachable ? "ok" : "warn"}
              />
            </div>
          </section>
        </>
      )}
    </main>
  );
}
