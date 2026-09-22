export function apiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
}

export type HealthResponse = {
  ok: boolean;
  env: string;
  supabaseConfigured: boolean;
  whatsappProvider: string;
  aiProvider: string;
};

export async function fetchHealth(): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${apiBaseUrl()}/api/health`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as HealthResponse;
  } catch {
    return null;
  }
}

export type Customer = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  sub_brand: string | null;
  source: string | null;
  created_at: string;
};

export type MessageStatusCounts = Record<
  "queued" | "sent" | "delivered" | "read" | "replied" | "failed" | "bounced",
  number
>;

export type CampaignAnalytics = {
  id: string;
  channel: "whatsapp" | "email";
  status: string;
  scheduled_at: string | null;
  sub_brand: string | null;
  counts: MessageStatusCounts;
};

export type AnalyticsSummary = {
  total: number;
  counts: MessageStatusCounts;
};

export type ApiResult<T> = { data: T } | { error: string };

async function getJson<T>(path: string, params?: Record<string, string>): Promise<ApiResult<T>> {
  try {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    const res = await fetch(`${apiBaseUrl()}${path}${qs}`, { cache: "no-store" });
    const body = await res.json();
    if (!res.ok) return { error: body.error || `Request failed (${res.status})` };
    return { data: body.data as T };
  } catch {
    return { error: "API not reachable" };
  }
}

export function fetchContacts(params?: { subBrand?: string; limit?: number }) {
  return getJson<Customer[]>("/api/contacts", {
    ...(params?.subBrand ? { subBrand: params.subBrand } : {}),
    ...(params?.limit ? { limit: String(params.limit) } : {}),
  });
}

export function fetchAnalyticsSummary(params?: { subBrand?: string }) {
  return getJson<AnalyticsSummary>(
    "/api/analytics/summary",
    params?.subBrand ? { subBrand: params.subBrand } : undefined
  );
}

export function fetchCampaignAnalytics(params?: { subBrand?: string }) {
  return getJson<CampaignAnalytics[]>(
    "/api/analytics/campaigns",
    params?.subBrand ? { subBrand: params.subBrand } : undefined
  );
}

export type TemplateChannel = "whatsapp" | "email" | "sms";
export type TemplateStatus = "draft" | "pending" | "approved" | "rejected";

export type Template = {
  id: string;
  channel: TemplateChannel;
  name: string;
  body: string;
  meta_template_status: TemplateStatus | null;
  provider_ref: string | null;
  sub_brand: string | null;
  created_at: string;
  updated_at: string;
};

async function mutateJson<T>(path: string, method: string, payload?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${apiBaseUrl()}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: payload !== undefined ? JSON.stringify(payload) : undefined,
    });
    if (res.status === 204) return { data: undefined as T };
    const body = await res.json();
    if (!res.ok) return { error: body.error || `Request failed (${res.status})` };
    return { data: body.data as T };
  } catch {
    return { error: "API not reachable" };
  }
}

export function fetchTemplates(params?: { channel?: TemplateChannel }) {
  return getJson<Template[]>("/api/templates", params?.channel ? { channel: params.channel } : undefined);
}

export function createTemplate(payload: {
  channel: TemplateChannel;
  name: string;
  body: string;
  meta_template_status?: TemplateStatus;
  provider_ref?: string;
  sub_brand?: string;
}) {
  return mutateJson<Template>("/api/templates", "POST", payload);
}

export function updateTemplate(
  id: string,
  payload: Partial<Pick<Template, "name" | "body" | "meta_template_status" | "provider_ref">>
) {
  return mutateJson<Template>(`/api/templates/${id}`, "PATCH", payload);
}

export function deleteTemplate(id: string) {
  return mutateJson<undefined>(`/api/templates/${id}`, "DELETE");
}
