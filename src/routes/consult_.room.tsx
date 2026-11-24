import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell, DemoBadge } from "@/components/qm/bits";
import { useStore } from "@/lib/store";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/consult_/room")({
  validateSearch: (s: Record<string, unknown>) => ({
    appointment: typeof s["appointment"] === "string" ? s["appointment"] : "",
  }),
  head: () =>
    pageHead(
      "Demo Consultation Room",
      "Preview your appointment details. No live doctor call is connected.",
    ),
  component: Room,
});
function Room() {
  const { appointment } = Route.useSearch();
  const { appointments } = useStore();
  const appt = appointments.find((a) => a.id === appointment);
  const [mic, setMic] = useState(false);
  const [camera, setCamera] = useState(false);
  const [ended, setEnded] = useState(false);
  return (
    <PageShell>
      <h1 className="mb-4 text-3xl font-bold">Demo Consultation</h1>
      <DemoBadge>No live call connected</DemoBadge>
      <div className="mt-6 flex min-h-80 flex-col items-center justify-center gap-5 bg-soft p-8 text-center">
        <Stethoscope className="h-16 w-16 text-primary" />
        <h2 className="text-2xl font-bold">
          {ended ? "Demo preview ended" : (appt?.with ?? "Consultation preview")}
        </h2>
        <p className="text-muted-foreground">
          {appt
            ? `${appt.mode} · ${appt.date} at ${appt.time}`
            : "Book a sample appointment to see its details here."}
        </p>
        <p className="max-w-lg text-sm text-muted-foreground">
          This is a preview only. Your microphone and camera are not accessed. No doctor is present
          and no medical advice is being provided.
        </p>
        {!ended && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="icon"
              title="Toggle demo microphone"
              aria-label="Toggle demo microphone"
              aria-pressed={mic}
              onClick={() => setMic(!mic)}
            >
              {mic ? <Mic /> : <MicOff />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              title="Toggle demo camera"
              aria-label="Toggle demo camera"
              aria-pressed={camera}
              onClick={() => setCamera(!camera)}
            >
              {camera ? <Video /> : <VideoOff />}
            </Button>
            <Button variant="destructive" onClick={() => setEnded(true)}>
              <PhoneOff className="h-4 w-4" />
              End Demo
            </Button>
          </div>
        )}
        <Button asChild variant="outline">
          <Link to="/consult">Back to Doctors</Link>
        </Button>
      </div>
    </PageShell>
  );
}
