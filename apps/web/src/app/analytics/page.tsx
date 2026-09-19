"use client";

import { useEffect, useState } from "react";
import {
  fetchAnalyticsSummary,
  fetchCampaignAnalytics,
  type AnalyticsSummary,
  type CampaignAnalytics,
} from "@/lib/api";

const TILE_STATUSES: Array<keyof AnalyticsSummary["counts"]> = [
  "sent",
  "delivered",
  "read",
  "replied",
  "failed",
  "bounced",
];

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignAnalytics[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchAnalyticsSummary(), fetchCampaignAnalytics()]).then(([s, c]) => {
      if (cancelled) return;
      if ("error" in s) {
        setError(s.error);
      } else {
        setError(null);
        setSummary(s.data);
      }
      if (!("error" in c)) setCampaigns(c.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        Delivery & Reply Analytics
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
        Sourced from the <code className="rounded bg-black/[.06] px-1 dark:bg-white/[.08]">messages</code>{" "}
        table, fed by Evolution API, listmonk, and WATI webhooks once Phase 3 sends go live.
      </p>

      {error ? (
        <p className="mt-6 text-sm text-amber-700 dark:text-amber-400">
          {error === "Supabase not configured yet"
            ? "Supabase isn't configured on the backend yet — analytics will populate once real credentials are wired in and Phase 3 sends start."
            : error}
        </p>
      ) : (
        <>
          <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {TILE_STATUSES.map((status) => (
              <div
                key={status}
                className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <p className="text-xs uppercase text-zinc-500 dark:text-zinc-400">{status}</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                  {summary?.counts[status] ?? 0}
                </p>
              </div>
            ))}
          </section>

          <section className="mt-8">
            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">By campaign</h2>
            <div className="mt-2 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
              {campaigns && campaigns.length > 0 ? (
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                    <tr>
                      <th className="px-4 py-2 font-medium">Channel</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Sent</th>
                      <th className="px-4 py-2 font-medium">Delivered</th>
                      <th className="px-4 py-2 font-medium">Read</th>
                      <th className="px-4 py-2 font-medium">Replied</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {campaigns.map((c) => (
                      <tr key={c.id}>
                        <td className="px-4 py-2">{c.channel}</td>
                        <td className="px-4 py-2">{c.status}</td>
                        <td className="px-4 py-2">{c.counts.sent}</td>
                        <td className="px-4 py-2">{c.counts.delivered}</td>
                        <td className="px-4 py-2">{c.counts.read}</td>
                        <td className="px-4 py-2">{c.counts.replied}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-4 text-sm text-zinc-500 dark:text-zinc-400">
                  No campaigns yet — sending is gated until Phase 3.
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
