import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlarmClock,
  Bell,
  BellRing,
  Check,
  Clock,
  Pill,
  Plus,
  SkipForward,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DemoBadge, EmptyState, PageShell, SectionHeader } from "@/components/qm/bits";
import {
  addMinutesToTime,
  buildDoseScheduleForDate,
  defaultTimingsForFrequency,
  validateReminderInput,
  type MealInstruction,
  type ReminderFrequency,
} from "@/lib/reminders";
import { estimateRefill, type RefillFrequency } from "@/lib/refill";
import { localDate } from "@/lib/safety";
import { useStore } from "@/lib/store";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/reminders")({
  head: () =>
    pageHead(
      "Medicine Reminders & Schedule",
      "Track today's medication schedule, upcoming doses, completed and missed doses, and refill estimates on CAREVIA.",
    ),
  component: RemindersPage,
});

function RemindersPage() {
  const store = useStore();
  const today = localDate();
  const [tab, setTab] = useState<"today" | "upcoming" | "completed" | "missed">("today");
  const [notifPerm, setNotifPerm] = useState<string>(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported",
  );

  // Add reminder form state
  const [medicineName, setMedicineName] = useState("");
  const [dosage, setDosage] = useState("1 tablet");
  const [frequency, setFrequency] = useState<ReminderFrequency>("Twice daily");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [timingsText, setTimingsText] = useState("08:00, 20:00");
  const [mealInstruction, setMealInstruction] = useState<MealInstruction>("After food");
  const [formError, setFormError] = useState("");

  // Refill calculator state
  const [qtyLeft, setQtyLeft] = useState(14);
  const [dosesPerDay, setDosesPerDay] = useState(2);
  const [refillFreq, setRefillFreq] = useState<RefillFrequency>("daily");
  const refillResult = estimateRefill(qtyLeft, dosesPerDay, refillFreq, 7);

  const todayDoses = useMemo(
    () => buildDoseScheduleForDate(store.reminders, today, store.doseOverrides),
    [store.reminders, today, store.doseOverrides],
  );

  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const upcomingDoses = useMemo(() => {
    const todayPending = todayDoses.filter(
      (d) => d.status === "upcoming" || d.status === "snoozed",
    );
    const tomorrow = buildDoseScheduleForDate(store.reminders, tomorrowStr, store.doseOverrides);
    return [...todayPending, ...tomorrow];
  }, [todayDoses, store.reminders, tomorrowStr, store.doseOverrides]);

  const completedDoses = todayDoses.filter((d) => d.status === "taken" || d.status === "skipped");
  const missedDoses = todayDoses.filter((d) => d.status === "missed");

  const requestNotif = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Browser notifications are not supported on this device.");
      return;
    }
    const res = await Notification.requestPermission();
    setNotifPerm(res);
    if (res === "granted") {
      new Notification("CAREVIA Medicine Reminders Enabled", {
        body: "Reminders will notify you while CAREVIA is open in your browser.",
      });
      toast.success("Browser notifications enabled.");
    } else {
      toast.message("Notification permission was not granted.");
    }
  };

  const sendReminderAlert = (medName: string, body: string) => {
    toast.info(`Reminder: ${medName}`, { description: body });
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification(`CAREVIA Reminder — ${medName}`, { body });
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const timings = timingsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = {
      medicineName: medicineName.trim(),
      dosage: dosage.trim(),
      frequency,
      startDate,
      endDate,
      timings,
      mealInstruction,
    };
    const err = validateReminderInput(payload);
    setFormError(err ?? "");
    if (err) return;
    store.addReminder(payload);
    setMedicineName("");
    toast.success(`Added reminder for ${payload.medicineName}`);
  };

  const visibleList =
    tab === "today"
      ? todayDoses
      : tab === "upcoming"
        ? upcomingDoses
        : tab === "completed"
          ? completedDoses
          : missedDoses;

  return (
    <PageShell>
      <SectionHeader
        eyebrow="Adherence & Refills"
        title="Medicine Reminder System"
        subtitle="Schedule daily doses, track before/after-food instructions, snooze or mark doses taken, and check refill dates."
      >
        <div className="flex flex-wrap items-center gap-2">
          <DemoBadge>Visit-only schedule</DemoBadge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={requestNotif}
            className="rounded-full"
          >
            <Bell className="h-4 w-4 text-primary" />
            {notifPerm === "granted" ? "Browser Alerts Active" : "Enable Browser Alerts"}
          </Button>
        </div>
      </SectionHeader>

      <p className="mb-6 rounded-2xl border bg-soft px-4 py-3 text-xs text-muted-foreground">
        <strong>Notification support:</strong> Browser notifications work while CAREVIA is open and
        permitted. Background SMS or mobile push notifications when the app is closed require
        connecting an external Push/SMS provider (FCM / Twilio).
      </p>

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Plus className="h-5 w-5 text-primary" /> Add Medicine Reminder
            </h2>
            <form onSubmit={handleAdd} className="mt-4 space-y-3.5">
              <div className="space-y-1">
                <Label htmlFor="rem-name">Medicine name</Label>
                <Input
                  id="rem-name"
                  value={medicineName}
                  onChange={(e) => setMedicineName(e.target.value)}
                  placeholder="e.g. Metformin 500 mg"
                  required
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="rem-dosage">Dosage</Label>
                  <Input
                    id="rem-dosage"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="1 tablet"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rem-freq">Frequency</Label>
                  <select
                    id="rem-freq"
                    value={frequency}
                    onChange={(e) => {
                      const f = e.target.value as ReminderFrequency;
                      setFrequency(f);
                      setTimingsText(defaultTimingsForFrequency(f).join(", "));
                    }}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option>Once daily</option>
                    <option>Twice daily</option>
                    <option>Three times daily</option>
                    <option>Weekly</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="rem-start">Start date</Label>
                  <Input
                    id="rem-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rem-end">End date</Label>
                  <Input
                    id="rem-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="rem-times">Timings (24h, comma-separated)</Label>
                  <Input
                    id="rem-times"
                    value={timingsText}
                    onChange={(e) => setTimingsText(e.target.value)}
                    placeholder="08:00, 20:00"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rem-meal">Food instruction</Label>
                  <select
                    id="rem-meal"
                    value={mealInstruction}
                    onChange={(e) => setMealInstruction(e.target.value as MealInstruction)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option>Before food</option>
                    <option>After food</option>
                    <option>With food</option>
                    <option>Anytime</option>
                  </select>
                </div>
              </div>
              {formError && (
                <p role="alert" className="text-xs text-destructive">
                  {formError}
                </p>
              )}
              <Button type="submit" className="w-full rounded-full">
                Save Medicine Reminder
              </Button>
            </form>
          </section>

          <section className="rounded-2xl border bg-soft p-6">
            <h2 className="text-lg font-bold">Refill Estimator</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Estimate when your current medicine pack will run out.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="refill-qty" className="text-xs">
                  Qty left
                </Label>
                <Input
                  id="refill-qty"
                  type="number"
                  min={1}
                  value={qtyLeft}
                  onChange={(e) => setQtyLeft(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="refill-doses" className="text-xs">
                  Doses/day
                </Label>
                <Input
                  id="refill-doses"
                  type="number"
                  min={1}
                  value={dosesPerDay}
                  onChange={(e) => setDosesPerDay(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="refill-freq" className="text-xs">
                  Cycle
                </Label>
                <select
                  id="refill-freq"
                  value={refillFreq}
                  onChange={(e) => setRefillFreq(e.target.value as RefillFrequency)}
                  className="h-9 w-full rounded-md border bg-background px-2 text-xs"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
            {refillResult && (
              <p className="mt-3 rounded-xl bg-background px-3 py-2 text-sm font-medium">
                Estimated <strong>{refillResult.daysRemaining} days</strong> remaining · Refill by{" "}
                <strong className="text-primary">{refillResult.refillDate}</strong>
              </p>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Today's Doses", val: todayDoses.length },
              { label: "Upcoming", val: upcomingDoses.length },
              { label: "Completed", val: completedDoses.length },
              { label: "Missed", val: missedDoses.length },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="mt-1 font-display text-2xl font-bold text-primary">{stat.val}</p>
              </div>
            ))}
          </div>

          <div
            className="flex flex-wrap gap-2 border-b pb-3"
            role="tablist"
            aria-label="Medication schedule views"
          >
            {[
              { id: "today", label: "Today's Schedule" },
              { id: "upcoming", label: "Upcoming Reminders" },
              { id: "completed", label: "Completed Doses" },
              { id: "missed", label: "Missed Doses" },
            ].map((t) => (
              <Button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                variant={tab === t.id ? "default" : "outline"}
                size="sm"
                onClick={() => setTab(t.id as typeof tab)}
              >
                {t.label}
              </Button>
            ))}
          </div>

          <div role="tabpanel" className="space-y-3">
            {visibleList.length === 0 ? (
              <EmptyState
                icon={<Pill />}
                title="No doses in this view"
                text="Add a medicine reminder on the left or switch tabs to review other doses."
              />
            ) : (
              visibleList.map((d) => (
                <article
                  key={d.key}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-primary">
                        <Clock className="h-3 w-3" /> {d.date === today ? "Today" : d.date} ·{" "}
                        {d.snoozedUntil ? `Snoozed to ${d.snoozedUntil}` : d.time}
                      </span>
                      <span className="rounded-full bg-soft px-2.5 py-0.5 text-xs font-medium">
                        {d.mealInstruction}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          d.status === "taken"
                            ? "bg-success/15 text-success"
                            : d.status === "missed"
                              ? "bg-destructive/15 text-destructive"
                              : d.status === "snoozed"
                                ? "bg-warning/20 text-warning-foreground"
                                : "bg-accent text-primary"
                        }`}
                      >
                        {d.status}
                      </span>
                    </div>
                    <h3 className="font-bold">{d.medicineName}</h3>
                    <p className="text-xs text-muted-foreground">Dosage: {d.dosage}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={d.status === "taken" ? "secondary" : "default"}
                      onClick={() => {
                        store.markDose(d.key, "taken");
                        toast.success(`Marked ${d.medicineName} as taken`);
                      }}
                    >
                      <Check className="h-4 w-4" /> Mark as Taken
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const nextTime = addMinutesToTime(d.snoozedUntil ?? d.time, 15);
                        store.markDose(d.key, "snoozed", nextTime);
                        toast.message(`Snoozed ${d.medicineName} to ${nextTime}`);
                      }}
                    >
                      <AlarmClock className="h-4 w-4" /> Snooze 15m
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        store.markDose(d.key, "skipped");
                        toast.message(`Skipped ${d.medicineName}`);
                      }}
                    >
                      <SkipForward className="h-4 w-4" /> Skip
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      title="Test reminder alert"
                      aria-label={`Test notification for ${d.medicineName}`}
                      onClick={() =>
                        sendReminderAlert(
                          d.medicineName,
                          `${d.dosage} · ${d.mealInstruction} (${d.time})`,
                        )
                      }
                    >
                      <BellRing className="h-4 w-4 text-primary" />
                    </Button>
                  </div>
                </article>
              ))
            )}
          </div>

          <section className="rounded-2xl border bg-soft p-5">
            <h2 className="mb-3 text-base font-bold">
              Active Medicine Plans ({store.reminders.length})
            </h2>
            <div className="space-y-2">
              {store.reminders.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-background px-4 py-3 text-sm"
                >
                  <div>
                    <strong>{r.medicineName}</strong> · {r.dosage} ({r.frequency},{" "}
                    {r.mealInstruction})
                    <p className="text-xs text-muted-foreground">
                      {r.startDate} to {r.endDate} · Times: {r.timings.join(", ")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Delete ${r.medicineName}`}
                    onClick={() => store.removeReminder(r.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {!store.reminders.length && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <XCircle className="h-4 w-4" /> No active reminders configured.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
