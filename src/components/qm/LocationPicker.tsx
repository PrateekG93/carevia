import { useState } from "react";
import { Crosshair, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useStore } from "@/lib/store";
import { geocode, reverseGeocode } from "@/lib/places";

export function detectLocation(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation)
      return reject(new Error("Your browser doesn't support location detection."));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      (e) =>
        reject(
          new Error(
            e.code === 1
              ? "Location permission was denied. Please enter your city, area, or PIN code instead."
              : "We couldn't get your location. Please enter it manually.",
          ),
        ),
      { timeout: 10000 },
    );
  });
}

export function LocationPicker({ compact }: { compact?: boolean }) {
  const { location, setLocation } = useStore();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<"gps" | "manual" | null>(null);

  const useGps = async () => {
    setBusy("gps");
    try {
      const c = await detectLocation();
      const label = await reverseGeocode(c.lat, c.lon);
      setLocation({ label, ...c });
      toast.success("Location set to " + label);
      setOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };
  const manual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim().length < 3) {
      toast.error("Enter at least 3 characters.");
      return;
    }
    setBusy("manual");
    try {
      const g = await geocode(q.trim());
      setLocation({ label: g.label, lat: g.lat, lon: g.lon });
      toast.success("Location set");
      setOpen(false);
    } catch (err) {
      setLocation({ label: q.trim() });
      toast.message("Saved as entered — we couldn't look it up on the map.", {
        description: (err as Error).message,
      });
      setOpen(false);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          className="max-w-[220px] justify-start gap-2 rounded-full"
        >
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">{location?.label ?? "Select location"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 rounded-2xl" align="start">
        <p className="mb-3 text-sm font-semibold">Choose your location</p>
        <Button onClick={useGps} disabled={!!busy} className="w-full gap-2 rounded-xl">
          {busy === "gps" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Crosshair className="h-4 w-4" />
          )}{" "}
          Detect My Location
        </Button>
        <p className="my-2 text-center text-xs text-muted-foreground">
          We only ask for location when you tap this button.
        </p>
        <form onSubmit={manual} className="flex gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="City, area, or PIN code"
            aria-label="City, area, or PIN code"
          />
          <Button type="submit" variant="secondary" disabled={!!busy}>
            {busy === "manual" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set"}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
