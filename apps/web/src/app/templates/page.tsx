"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  fetchTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  type Template,
  type TemplateChannel,
  type TemplateStatus,
} from "@/lib/api";

const CHANNELS: TemplateChannel[] = ["whatsapp", "email", "sms"];
const STATUSES: TemplateStatus[] = ["draft", "pending", "approved", "rejected"];

const emptyForm = {
  channel: "whatsapp" as TemplateChannel,
  name: "",
  body: "",
  provider_ref: "",
  meta_template_status: "draft" as TemplateStatus,
  sub_brand: "",
};

export default function TemplatesPage() {
  const [channelFilter, setChannelFilter] = useState<TemplateChannel | "">("");
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, startTransition] = useTransition();

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const load = useCallback(() => {
    startTransition(async () => {
      const result = await fetchTemplates({ channel: channelFilter || undefined });
      if ("error" in result) {
        setError(result.error);
        setTemplates(null);
      } else {
        setError(null);
        setTemplates(result.data);
      }
    });
  }, [channelFilter]);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(t: Template) {
    setEditingId(t.id);
    setForm({
      channel: t.channel,
      name: t.name,
      body: t.body,
      provider_ref: t.provider_ref || "",
      meta_template_status: t.meta_template_status || "draft",
      sub_brand: t.sub_brand || "",
    });
    setFormError(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.body.trim()) {
      setFormError("Name and body are required.");
      return;
    }

    startSaving(async () => {
      const result = editingId
        ? await updateTemplate(editingId, {
            name: form.name,
            body: form.body,
            provider_ref: form.provider_ref || undefined,
            meta_template_status: form.channel === "email" ? undefined : form.meta_template_status,
          })
        : await createTemplate({
            channel: form.channel,
            name: form.name,
            body: form.body,
            provider_ref: form.provider_ref || undefined,
            meta_template_status: form.channel === "email" ? undefined : form.meta_template_status,
            sub_brand: form.sub_brand || undefined,
          });

      if ("error" in result) {
        setFormError(result.error);
        return;
      }
      resetForm();
      load();
    });
  }

  function remove(id: string) {
    startSaving(async () => {
      const result = await deleteTemplate(id);
      if ("error" in result) {
        setFormError(result.error);
        return;
      }
      if (editingId === id) resetForm();
      load();
    });
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        Template & Compliance Panel
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
        Manually create and update WhatsApp, email, and SMS templates. This is a catalog and
        approval-status tracker — editing a row here never changes what&apos;s actually approved
        with Meta (WhatsApp) or registered on DLT (SMS). Set <code className="rounded bg-black/[.06] px-1 dark:bg-white/[.08]">provider_ref</code>{" "}
        to the real approved template name / DLT flow ID once approval exists, then copy it onto
        the relevant brand.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[360px_1fr]">
        <form
          onSubmit={submit}
          className="h-fit rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {editingId ? "Edit template" : "New template"}
          </h2>

          <div className="mt-4 flex flex-col gap-3">
            <label className="text-sm">
              <span className="mb-1 block text-zinc-600 dark:text-zinc-400">Channel</span>
              <select
                value={form.channel}
                disabled={Boolean(editingId)}
                onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value as TemplateChannel }))}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-zinc-600 dark:text-zinc-400">Name</span>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                placeholder="e.g. Enquiry greeting v1"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-zinc-600 dark:text-zinc-400">Body</span>
              <textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                rows={4}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                placeholder="Hi {{1}}, thanks for your interest in {{2}}!"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-zinc-600 dark:text-zinc-400">
                Provider reference{" "}
                <span className="text-zinc-400">
                  ({form.channel === "whatsapp" ? "WATI/Evolution template name" : form.channel === "sms" ? "MSG91 flow_id" : "n/a"})
                </span>
              </span>
              <input
                value={form.provider_ref}
                onChange={(e) => setForm((f) => ({ ...f, provider_ref: e.target.value }))}
                disabled={form.channel === "email"}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </label>

            {form.channel !== "email" && (
              <label className="text-sm">
                <span className="mb-1 block text-zinc-600 dark:text-zinc-400">
                  Approval status ({form.channel === "whatsapp" ? "Meta" : "DLT"})
                </span>
                <select
                  value={form.meta_template_status}
                  onChange={(e) => setForm((f) => ({ ...f, meta_template_status: e.target.value as TemplateStatus }))}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {!editingId && (
              <label className="text-sm">
                <span className="mb-1 block text-zinc-600 dark:text-zinc-400">Sub-brand (optional)</span>
                <input
                  value={form.sub_brand}
                  onChange={(e) => setForm((f) => ({ ...f, sub_brand: e.target.value }))}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  placeholder="e.g. goat-farming"
                />
              </label>
            )}

            {formError && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {formError === "Supabase not configured yet"
                  ? "Supabase isn't configured on the backend yet."
                  : formError}
              </p>
            )}

            <div className="mt-1 flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900"
              >
                {editingId ? "Save changes" : "Create template"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>

        <div>
          <div className="flex items-center gap-3">
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value as TemplateChannel | "")}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="">All channels</option>
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {templates && <span className="text-xs text-zinc-500 dark:text-zinc-400">{templates.length} shown</span>}
          </div>

          <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            {error ? (
              <p className="p-4 text-sm text-amber-700 dark:text-amber-400">
                {error === "Supabase not configured yet"
                  ? "Supabase isn't configured on the backend yet."
                  : error}
              </p>
            ) : loading ? (
              <p className="p-4 text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
            ) : templates && templates.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  <tr>
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Channel</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Provider ref</th>
                    <th className="px-4 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {templates.map((t) => (
                    <tr key={t.id}>
                      <td className="px-4 py-2">{t.name}</td>
                      <td className="px-4 py-2">{t.channel}</td>
                      <td className="px-4 py-2">
                        {t.meta_template_status ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              t.meta_template_status === "approved"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                : t.meta_template_status === "rejected"
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                            }`}
                          >
                            {t.meta_template_status}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">{t.provider_ref || "—"}</td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => startEdit(t)} className="mr-3 text-xs text-blue-600 hover:underline dark:text-blue-400">
                          Edit
                        </button>
                        <button onClick={() => remove(t.id)} className="text-xs text-red-600 hover:underline dark:text-red-400">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="p-4 text-sm text-zinc-500 dark:text-zinc-400">No templates yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
