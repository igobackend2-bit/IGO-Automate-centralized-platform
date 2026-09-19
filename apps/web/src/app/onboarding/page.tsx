import { PlaceholderPage } from "@/components/PlaceholderPage";

export default function OnboardingPage() {
  return (
    <PlaceholderPage
      title="New-Customer Onboarding"
      phase="Phase 3"
      description="Auto-trigger on a new customers row: WhatsApp welcome + email welcome, logged to onboarding_events, with a daily digest to the BD manager (reusing the W4 n8n pattern)."
    />
  );
}
