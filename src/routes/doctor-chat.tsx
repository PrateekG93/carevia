import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock,
  FileText,
  MessageSquareHeart,
  Paperclip,
  Send,
  ShieldCheck,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DemoBadge,
  EmergencyStrip,
  EmptyState,
  PageShell,
  SectionHeader,
} from "@/components/qm/bits";
import { formatINR } from "@/lib/data";
import { uploadError } from "@/lib/safety";
import { useStore, type ChatAttachment } from "@/lib/store";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/doctor-chat")({
  head: () =>
    pageHead(
      "Chat with Doctor",
      "Request consultations, share medical reports, and message doctors after consultation acceptance on CAREVIA.",
    ),
  component: DoctorChatPage,
});

function DoctorChatPage() {
  const store = useStore();
  const [selectedDoctorId, setSelectedDoctorId] = useState(store.doctorProfiles[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [activeThreadId, setActiveThreadId] = useState(store.consultThreads[0]?.id ?? "");
  const [messageText, setMessageText] = useState("");
  const [attachment, setAttachment] = useState<ChatAttachment | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);

  const activeThread =
    store.consultThreads.find((t) => t.id === activeThreadId) ?? store.consultThreads[0];
  const isDoctorRole = store.user?.role === "doctor";

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const err = uploadError(f, true);
    if (err) {
      toast.error(err);
      return;
    }
    setAttachment({ name: f.name, type: f.type, size: f.size });
    toast.success(`Attached ${f.name} (validated locally — stays in memory for this session)`);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const doc = store.doctorProfiles.find((d) => d.id === selectedDoctorId);
    if (!doc) return;
    if (reason.trim().length < 5) {
      toast.error("Please describe your consultation reason (at least 5 characters).");
      return;
    }
    const created = store.requestDoctorChat(
      doc,
      store.user?.name || "Guest Patient (Demo)",
      reason.trim(),
    );
    setActiveThreadId(created.id);
    setReason("");
    toast.success(
      `Consultation request sent to ${doc.name} (demo). Chat unlocks once the doctor accepts.`,
    );
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || activeThread.status !== "accepted") return;
    if (!messageText.trim() && !attachment) return;
    const sender = isDoctorRole ? "doctor" : "patient";
    const senderName = isDoctorRole
      ? activeThread.doctorName
      : store.user?.name || activeThread.patientName;
    store.sendDoctorChatMessage(
      activeThread.id,
      sender,
      senderName,
      messageText.trim() || `Shared document: ${attachment?.name}`,
      attachment,
    );
    setMessageText("");
    setAttachment(undefined);
  };

  return (
    <PageShell>
      <SectionHeader
        eyebrow="CAREVIA Consultation Messaging"
        title="Chat with Doctor"
        subtitle="Select a doctor, request a consultation, share reports or prescriptions, and chat once accepted."
      >
        <DemoBadge>Session preview · Realtime backend not connected</DemoBadge>
      </SectionHeader>

      <EmergencyStrip />

      <div className="my-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-soft p-4 text-sm">
        <p className="text-muted-foreground">
          <strong>Live transport note:</strong> Real-time encrypted doctor messaging and document
          storage require Supabase Realtime &amp; Storage policies. In this preview you can test
          both sides — submit a request as a Patient and accept it as a Doctor in the{" "}
          <Link to="/account" className="font-semibold text-primary underline">
            Doctor Dashboard
          </Link>
          .
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={!isDoctorRole ? "default" : "outline"}
            onClick={() => store.switchDemoRole("patient")}
          >
            Preview as Patient
          </Button>
          <Button
            size="sm"
            variant={isDoctorRole ? "default" : "outline"}
            onClick={() => store.switchDemoRole("doctor")}
          >
            Preview as Doctor
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Stethoscope className="h-5 w-5 text-primary" /> Request Doctor Consultation
            </h2>
            <form onSubmit={submitRequest} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="chat-doctor">Select doctor</Label>
                <select
                  id="chat-doctor"
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm"
                >
                  {store.doctorProfiles.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} · {d.specialty} ({formatINR(d.fee)}) — {d.verificationStatus}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="chat-reason">Reason for consultation</Label>
                <Textarea
                  id="chat-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Share symptoms duration, current medicines, or report questions…"
                  rows={3}
                  required
                />
              </div>
              <Button type="submit" className="w-full rounded-full">
                Request Consultation
              </Button>
            </form>
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <h2 className="mb-3 text-lg font-bold">
              Consultation History ({store.consultThreads.length})
            </h2>
            <div className="space-y-2.5">
              {store.consultThreads.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveThreadId(t.id)}
                  className={`w-full rounded-xl border p-3.5 text-left transition ${
                    activeThread?.id === t.id ? "border-primary bg-accent" : "hover:bg-soft"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{t.doctorName}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        t.status === "accepted"
                          ? "bg-success/15 text-success"
                          : t.status === "rejected"
                            ? "bg-destructive/15 text-destructive"
                            : "bg-warning/20 text-warning-foreground"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.specialty} · {formatINR(t.fee)} · {t.patientName}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs text-foreground/80">{t.reason}</p>
                </button>
              ))}
            </div>
          </section>
        </div>

        <section className="flex min-h-[540px] flex-col rounded-3xl border bg-card">
          {!activeThread ? (
            <EmptyState
              icon={<MessageSquareHeart />}
              title="No consultation selected"
              text="Select a doctor and submit a consultation request to begin."
            />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-soft/60 px-6 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">{activeThread.doctorName}</h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-primary">
                      <ShieldCheck className="h-3.5 w-3.5" /> {activeThread.specialty}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Patient: {activeThread.patientName} · Fee: {formatINR(activeThread.fee)} (demo)
                    · Status: <strong className="uppercase">{activeThread.status}</strong>
                  </p>
                </div>

                {isDoctorRole && activeThread.status === "requested" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        store.respondDoctorChat(activeThread.id, "accepted");
                        toast.success("Consultation request accepted");
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Accept Request
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        store.respondDoctorChat(activeThread.id, "rejected");
                        toast.message("Consultation request declined");
                      }}
                    >
                      <XCircle className="h-4 w-4" /> Decline
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-6" aria-live="polite">
                {activeThread.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm ${
                      m.sender === "patient"
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "border bg-soft text-foreground"
                    }`}
                  >
                    <p className="mb-1 text-[11px] font-semibold opacity-80">
                      {m.senderName} ·{" "}
                      {new Date(m.at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p>{m.text}</p>
                    {m.attachment && (
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-background/15 px-2.5 py-1 text-xs">
                        <FileText className="h-3.5 w-3.5" />
                        <span>
                          {m.attachment.name} ({Math.max(1, Math.round(m.attachment.size / 1024))}{" "}
                          KB)
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {activeThread.status === "requested" && (
                <div className="border-t bg-warning/10 px-6 py-3 text-sm text-warning-foreground">
                  <Clock className="mr-1.5 inline h-4 w-4" />
                  Waiting for {activeThread.doctorName} to accept this consultation request before
                  chat and report sharing open.
                </div>
              )}

              {activeThread.status === "rejected" && (
                <div className="border-t bg-destructive/10 px-6 py-3 text-sm text-destructive">
                  This consultation request was declined. Select another doctor to start a new
                  request.
                </div>
              )}

              <form onSubmit={sendMessage} className="space-y-3 border-t p-4">
                {attachment && (
                  <div className="flex items-center justify-between rounded-xl bg-accent px-3 py-2 text-xs">
                    <span className="flex items-center gap-2 font-medium">
                      <FileText className="h-4 w-4 text-primary" /> Ready to share:{" "}
                      {attachment.name}
                    </span>
                    <button
                      type="button"
                      className="text-destructive underline"
                      onClick={() => setAttachment(undefined)}
                    >
                      Remove
                    </button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="sr-only"
                    aria-label="Share medical report or document"
                    onChange={handleFile}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={activeThread.status !== "accepted"}
                    onClick={() => fileRef.current?.click()}
                    title="Attach JPG, PNG, WebP, or PDF (max 5 MB)"
                  >
                    <Paperclip className="h-4 w-4" /> Share Report
                  </Button>
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    disabled={activeThread.status !== "accepted"}
                    placeholder={
                      activeThread.status === "accepted"
                        ? `Message ${isDoctorRole ? activeThread.patientName : activeThread.doctorName}…`
                        : "Chat unlocks after doctor accepts…"
                    }
                    className="min-w-[200px] flex-1"
                    aria-label="Consultation message"
                  />
                  <Button
                    type="submit"
                    disabled={
                      activeThread.status !== "accepted" || (!messageText.trim() && !attachment)
                    }
                  >
                    <Send className="h-4 w-4" /> Send
                  </Button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </PageShell>
  );
}
