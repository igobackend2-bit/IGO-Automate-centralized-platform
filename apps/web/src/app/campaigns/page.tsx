import { PlaceholderPage } from "@/components/PlaceholderPage";

export default function CampaignsPage() {
  return (
    <PlaceholderPage
      title="Campaign Builder"
      phase="Phase 3"
      description="Compose a WhatsApp template and a matching email, target a segment, schedule or send now. Sending is disabled until the controlled cutover (Phase 3) is approved — the backend's /api/campaigns POST route currently returns 501 by design."
    />
  );
}
