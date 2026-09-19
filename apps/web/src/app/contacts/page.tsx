"use client";

import { useEffect, useState, useTransition } from "react";
import { fetchContacts, type Customer } from "@/lib/api";

export default function ContactsPage() {
  const [subBrand, setSubBrand] = useState("");
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    startTransition(async () => {
      const result = await fetchContacts({ subBrand: subBrand || undefined, limit: 100 });
      if (cancelled) return;
      if ("error" in result) {
        setError(result.error);
        setCustomers(null);
      } else {
        setError(null);
        setCustomers(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [subBrand]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">Unified Contacts</h1>
      <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
        Read-only view over the shared <code className="rounded bg-black/[.06] px-1 dark:bg-white/[.08]">customers</code>{" "}
        table (Phase 2). Import/dedupe tooling lands once real WATI/Zoho export files are provided.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <input
          value={subBrand}
          onChange={(e) => setSubBrand(e.target.value)}
          placeholder="Filter by sub-brand..."
          className="w-64 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        {customers && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{customers.length} shown</span>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        {error ? (
          <p className="p-4 text-sm text-amber-700 dark:text-amber-400">
            {error === "Supabase not configured yet"
              ? "Supabase isn't configured on the backend yet — this table will populate once the real project credentials are wired in."
              : error}
          </p>
        ) : loading ? (
          <p className="p-4 text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
        ) : customers && customers.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Phone</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Sub-brand</th>
                <th className="px-4 py-2 font-medium">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {customers.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2">{c.name || "—"}</td>
                  <td className="px-4 py-2">{c.phone || "—"}</td>
                  <td className="px-4 py-2">{c.email || "—"}</td>
                  <td className="px-4 py-2">{c.sub_brand || "—"}</td>
                  <td className="px-4 py-2">{c.source || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-4 text-sm text-zinc-500 dark:text-zinc-400">No customers found.</p>
        )}
      </div>
    </div>
  );
}
