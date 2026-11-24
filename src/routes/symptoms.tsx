import { createFileRoute, useLocation } from "@tanstack/react-router";
import { PageShell, EmergencyStrip } from "@/components/qm/bits";
import { SymptomGuidance } from "@/components/qm/SymptomGuidance";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/symptoms")({
  head: () =>
    pageHead(
      "Symptom Guidance",
      "General health information and next steps, with immediate guidance for emergency symptoms.",
    ),
  component: Symptoms,
});
function Symptoms() {
  const location = useLocation();
  return (
    <PageShell className="max-w-4xl">
      <h1 className="mb-6 text-3xl font-bold">Symptom Guidance</h1>
      <EmergencyStrip />
      <div className="mt-8">
        <SymptomGuidance initialText={location.state.symptomDraft ?? ""} />
      </div>
    </PageShell>
  );
}
