import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore, type Appointment } from "@/lib/store";
import { bookingError, localDate } from "@/lib/safety";
import { formatINR } from "@/lib/data";

export function BookingForm({
  doctorId,
  name,
  specialty,
  slots,
  fee = 299,
  kind = "Online",
  place,
  unconnectedProvider = false,
}: {
  doctorId?: string;
  name: string;
  specialty: string;
  slots: string[];
  fee?: number;
  kind?: "Online" | "In-Person";
  place?: string | undefined;
  unconnectedProvider?: boolean;
}) {
  const store = useStore();
  const [date, setDate] = useState(localDate());
  const [time, setTime] = useState("");
  const [mode, setMode] = useState<"Audio" | "Video">("Video");
  const [patient, setPatient] = useState(store.user?.name ?? "");
  const [phone, setPhone] = useState(store.user?.mobile ?? "");
  const [error, setError] = useState("");
  const [done, setDone] = useState<Appointment | null>(null);

  if (done) {
    return (
      <div role="status" className="space-y-4 py-4">
        <CheckCircle2 className="h-10 w-10 text-success" />
        <h3 className="text-xl font-bold">
          {unconnectedProvider
            ? "Demo visit request recorded (not confirmed)"
            : "Demo appointment recorded"}
        </h3>
        <p>
          {done.with} · {done.date} at {done.time}
        </p>
        <p className="text-sm text-muted-foreground">
          {kind === "Online" ? `${mode} consultation` : "In-person visit"} · {formatINR(done.fee)}{" "}
          (demo) · {done.id}
          <br />
          {unconnectedProvider
            ? "This facility is not connected for live scheduling. Please confirm directly with the clinic by phone or in person."
            : "No doctor or clinic has received this booking yet, and no payment has been charged. You can cancel or reschedule from your Patient Dashboard."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/account">Open Patient Dashboard</Link>
          </Button>
          {kind === "Online" && (
            <Button asChild variant="outline">
              <Link to="/consult/room" search={{ appointment: done.id }}>
                Open Demo Consultation
              </Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const err = bookingError(date, time, patient, phone, slots);
        setError(err ?? "");
        if (err) return;
        setDone(
          store.addAppointment({
            ...(doctorId ? { doctorId } : {}),
            kind,
            ...(kind === "Online" ? { mode } : {}),
            with: name,
            specialty,
            date,
            time,
            patient: patient.trim(),
            fee,
            status: unconnectedProvider ? "Request sent (not confirmed)" : "Demo booking confirmed",
            ...(place ? { place } : {}),
          }),
        );
      }}
    >
      <p className="text-sm text-muted-foreground">
        Sample appointment slots ({formatINR(fee)} consultation fee preview — payment gateway not
        connected).
      </p>
      {kind === "Online" && (
        <div className="flex gap-2" role="group" aria-label="Consultation mode">
          {(["Audio", "Video"] as const).map((m) => (
            <Button
              key={m}
              type="button"
              variant={mode === m ? "default" : "outline"}
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
            >
              {m}
            </Button>
          ))}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="booking-date">Date</Label>
        <Input
          id="booking-date"
          type="date"
          min={localDate()}
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setTime("");
          }}
        />
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Time slots">
        {slots.map((t) => (
          <Button
            type="button"
            key={t}
            size="sm"
            disabled={new Date(`${date}T${t}:00`).getTime() <= Date.now()}
            variant={time === t ? "default" : "outline"}
            aria-pressed={time === t}
            onClick={() => setTime(t)}
          >
            {t}
          </Button>
        ))}
      </div>
      <div className="space-y-2">
        <Label htmlFor="patient">Patient full name</Label>
        <Input
          id="patient"
          autoComplete="name"
          value={patient}
          onChange={(e) => setPatient(e.target.value)}
          required
        />
        <Label htmlFor="booking-phone">Mobile number</Label>
        <Input
          id="booking-phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={10}
          required
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full">
        Confirm Demo Appointment ({formatINR(fee)})
      </Button>
    </form>
  );
}
