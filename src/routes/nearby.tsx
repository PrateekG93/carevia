import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Crosshair,
  ExternalLink,
  Hospital,
  List,
  Loader2,
  Map,
  MapPin,
  Navigation,
  Phone,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { DemoBadge, EmptyState, PageShell, SectionHeader } from "@/components/qm/bits";
import { FacilityMap } from "@/components/qm/FacilityMap";
import { BookingForm } from "@/components/qm/BookingForm";
import { detectLocation } from "@/components/qm/LocationPicker";
import { formatINR, specialties, type Doctor } from "@/lib/data";
import { DEFAULT_USER_COORDS } from "@/lib/delivery";
import {
  directionsUrl,
  findFacilities,
  geocode,
  haversineKm,
  telHref,
  type Facility,
} from "@/lib/places";
import { useStore, type Location } from "@/lib/store";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/nearby")({
  head: () =>
    pageHead(
      "Find Doctors Near Me",
      "Discover CAREVIA partner doctors and genuine nearby clinics or hospitals on OpenStreetMap and Google Maps.",
    ),
  component: Nearby,
});

function Nearby() {
  const { location, setLocation, doctorProfiles } = useStore();
  const [q, setQ] = useState(location?.label ?? "Mahapura, Jaipur");
  const [radius, setRadius] = useState(10);
  const [kind, setKind] = useState("All");
  const [specialty, setSpecialty] = useState("");
  const [docSpec, setDocSpec] = useState("All");
  const [docMinExp, setDocMinExp] = useState(0);
  const [docMaxFee, setDocMaxFee] = useState(9999);
  const [docMode, setDocMode] = useState<"all" | "online" | "offline">("all");
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [center, setCenter] = useState<Location | null>(null);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("Both");
  const [selected, setSelected] = useState<Facility | null>(null);
  const [facilityBooking, setFacilityBooking] = useState<Facility | null>(null);
  const [docBooking, setDocBooking] = useState<{
    doc: Doctor;
    kind: "Online" | "In-Person";
  } | null>(null);
  const initLoaded = useRef(false);

  const select = useCallback((f: Facility) => setSelected(f), []);

  const refCoords = useMemo(
    () =>
      center?.lat !== undefined && center?.lon !== undefined
        ? { lat: center.lat, lon: center.lon }
        : location?.lat !== undefined && location?.lon !== undefined
          ? { lat: location.lat, lon: location.lon }
          : DEFAULT_USER_COORDS,
    [center, location],
  );

  const nearbyDoctors = useMemo(() => {
    return doctorProfiles
      .map((d) => ({
        doc: d,
        distanceKm: Number(haversineKm(refCoords, { lat: d.lat, lon: d.lon }).toFixed(1)),
      }))
      .filter(({ doc }) => {
        if (docSpec !== "All" && doc.specialty !== docSpec) return false;
        if (doc.experience < docMinExp) return false;
        if (doc.fee > docMaxFee) return false;
        if (docMode === "online" && !doc.offersOnline) return false;
        if (docMode === "offline" && !doc.offersOffline) return false;
        return true;
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [doctorProfiles, refCoords, docSpec, docMinExp, docMaxFee, docMode]);

  const load = useCallback(
    async (c: Location, searchRadius = radius) => {
      if (c.lat === undefined || c.lon === undefined) {
        setError("Enter a city or area that can be located on the map.");
        return;
      }
      setBusy(true);
      setError("");
      setCenter(c);
      setLocation(c);
      setSelected(null);
      setSearched(true);
      try {
        setFacilities(await findFacilities(c.lat, c.lon, searchRadius));
      } catch (e) {
        setFacilities([]);
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [radius, setLocation],
  );

  // Automatically load genuine nearby hospitals & clinics on initial visit
  useEffect(() => {
    if (initLoaded.current) return;
    initLoaded.current = true;
    const initialLoc =
      location?.lat !== undefined && location?.lon !== undefined
        ? location
        : { label: "Mahapura, Jaipur", lat: DEFAULT_USER_COORDS.lat, lon: DEFAULT_USER_COORDS.lon };
    void load(initialLoc, 10);
  }, [load, location]);

  const search = async (gps = false) => {
    setBusy(true);
    setError("");
    try {
      const c = gps
        ? { ...(await detectLocation()), label: "Current location" }
        : await geocode(q.trim());
      await load(c, radius);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const filtered = facilities.filter(
    (f) =>
      (kind === "All" || f.kind === kind) &&
      f.distanceKm <= radius &&
      (!specialty || (f.specialty ?? "").toLowerCase().includes(specialty.toLowerCase())),
  );

  return (
    <PageShell>
      <SectionHeader
        eyebrow="CAREVIA Doctor & Clinic Finder"
        title="Find Doctors Near Me"
        subtitle="Discover CAREVIA partner doctors in Jaipur, plus genuine nearby hospitals and clinics."
      />

      {/* Section 1: CAREVIA Partner Doctors (Sample profiles) */}
      <section className="mb-12 rounded-3xl border bg-soft p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">CAREVIA Partner Doctors</h2>
            <p className="text-sm text-muted-foreground">
              Filter by specialization, experience, consultation fee, and online or offline visit
              mode.
            </p>
          </div>
          <DemoBadge>Sample doctor profiles · NMC Registry API unconfigured</DemoBadge>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="near-doc-spec">Specialization</Label>
            <select
              id="near-doc-spec"
              value={docSpec}
              onChange={(e) => setDocSpec(e.target.value)}
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
            >
              <option value="All">All specializations</option>
              {specialties.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="near-doc-exp">Experience</Label>
            <select
              id="near-doc-exp"
              value={docMinExp}
              onChange={(e) => setDocMinExp(Number(e.target.value))}
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
            >
              <option value={0}>Any experience</option>
              <option value={5}>5+ years</option>
              <option value={10}>10+ years</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="near-doc-fee">Consultation fee</Label>
            <select
              id="near-doc-fee"
              value={docMaxFee}
              onChange={(e) => setDocMaxFee(Number(e.target.value))}
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
            >
              <option value={9999}>Any fee</option>
              <option value={350}>Up to {formatINR(350)}</option>
              <option value={500}>Up to {formatINR(500)}</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="near-doc-mode">Consultation mode</Label>
            <select
              id="near-doc-mode"
              value={docMode}
              onChange={(e) => setDocMode(e.target.value as typeof docMode)}
              className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
            >
              <option value="all">Online &amp; In-Person</option>
              <option value="online">Online only</option>
              <option value="offline">Offline clinic visits</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {nearbyDoctors.map(({ doc, distanceKm }) => (
            <article key={doc.id} className="rounded-2xl border bg-card p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary">
                    <Stethoscope className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-bold">{doc.name}</h3>
                    <p className="text-xs font-medium text-teal">{doc.specialty}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">{distanceKm} km</span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {doc.qualification} · {doc.experience} yrs · Reg: {doc.registrationNumber}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    doc.verificationStatus === "Verified (Demo)"
                      ? "bg-success/15 text-success"
                      : "bg-warning/20 text-warning-foreground"
                  }`}
                >
                  {doc.verificationStatus === "Verified (Demo)" ? (
                    <BadgeCheck className="h-3 w-3" />
                  ) : (
                    <ShieldAlert className="h-3 w-3" />
                  )}
                  {doc.verificationStatus}
                </span>
                <span className="text-xs font-bold text-primary">{formatINR(doc.fee)}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Slots: {doc.slots.join(", ")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {doc.offersOnline && (
                  <Button
                    size="sm"
                    className="flex-1 rounded-full"
                    onClick={() => setDocBooking({ doc, kind: "Online" })}
                  >
                    Book Online
                  </Button>
                )}
                {doc.offersOffline && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 rounded-full"
                    onClick={() => setDocBooking({ doc, kind: "In-Person" })}
                  >
                    Book Clinic
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Section 2: Genuine OpenStreetMap Nearby Clinics & Hospitals */}
      <h2 className="mb-3 text-2xl font-bold">Nearby Hospitals &amp; Clinics (Live Map Search)</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="nearby-location">Address, landmark, city, or PIN code</Label>
          <Input
            id="nearby-location"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. JK Lakshmipat University, Mahapura, Jaipur"
            required
            minLength={3}
          />
        </div>
        <Button type="submit" disabled={busy || q.trim().length < 3}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
          Search
        </Button>
        <Button type="button" variant="outline" disabled={busy} onClick={() => void search(true)}>
          <Crosshair className="h-4 w-4" />
          Use My Current Location
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="radius">Radius</Label>
          <select
            id="radius"
            className="rounded-md border bg-background p-2 text-sm"
            value={radius}
            onChange={(e) => {
              const nextR = Number(e.target.value);
              setRadius(nextR);
              if (center) void load(center, nextR);
            }}
          >
            {[2, 5, 10, 20].map((r) => (
              <option key={r} value={r}>
                {r} km
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="outline"
            disabled={busy || !center}
            onClick={() => {
              if (center) void load(center, radius);
            }}
          >
            Refresh Results
          </Button>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Showing genuine public OpenStreetMap hospital and clinic listings. Location is requested
        only when you choose it. Confirm hours and phone numbers directly with the facility.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm"
        >
          {error}
        </p>
      )}

      {searched && (
        <>
          <div className="mt-7 flex flex-wrap items-end gap-4 border-y py-4">
            <div className="space-y-2">
              <Label htmlFor="facility-kind">Facility type</Label>
              <select
                id="facility-kind"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="block rounded-md border bg-background p-2 text-sm"
              >
                {["All", "Hospital", "Clinic", "Doctor"].map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty-search">Specialty</Label>
              <Input
                id="specialty-search"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="e.g. cardiology, dental"
              />
            </div>
            <div className="ml-auto flex gap-1" role="group" aria-label="Results view">
              {["List", "Map", "Both"].map((v) => (
                <Button
                  key={v}
                  size="sm"
                  variant={view === v ? "default" : "outline"}
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                >
                  {v === "List" ? <List className="h-4 w-4" /> : <Map className="h-4 w-4" />}
                  {v}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold">
              {busy ? "Searching…" : `${filtered.length} genuine facilities`} · {center?.label}
            </h3>
          </div>

          <div className={`mt-5 grid gap-5 ${view === "Both" ? "lg:grid-cols-2" : ""}`}>
            <div className={view === "Map" ? "hidden" : ""}>
              {busy ? (
                <div role="status" className="flex gap-3 py-12">
                  <Loader2 className="animate-spin" />
                  Searching genuine nearby hospitals &amp; clinics…
                </div>
              ) : filtered.length ? (
                <div className="space-y-4">
                  {filtered.map((f) => (
                    <article
                      key={f.id}
                      className={`rounded-2xl border p-5 ${selected?.id === f.id ? "border-primary bg-accent" : "bg-card"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-bold">{f.name}</h4>
                          <p className="mt-1 text-sm text-teal">
                            {f.kind} · {f.specialty ?? "General healthcare"}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold">
                          {f.distanceKm.toFixed(1)} km
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {f.address ?? "Address not listed — open map directions"}
                      </p>
                      {f.hours && (
                        <p className="mt-2 text-xs">Listed hours: {f.hours} (confirm directly)</p>
                      )}
                      {f.phone && (
                        <p className="mt-2 text-xs">Listed contact: {f.phone} (confirm directly)</p>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <a href={directionsUrl(f)} target="_blank" rel="noopener noreferrer">
                            <Navigation className="h-4 w-4" /> Open in Google Maps
                          </a>
                        </Button>
                        {f.phone && (
                          <Button asChild size="sm" variant="outline">
                            <a href={telHref(f.phone)}>
                              <Phone className="h-4 w-4" /> Call Listed Number
                            </a>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className="rounded-full"
                          onClick={() => {
                            setSelected(f);
                            setFacilityBooking(f);
                          }}
                        >
                          Book Clinic
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Hospital />}
                  title="No facilities found in this radius"
                  text="Try increasing the search radius to 10 km or 20 km, or enter another nearby area."
                />
              )}
            </div>

            {view !== "List" && center?.lat !== undefined && center.lon !== undefined && (
              <div className="h-fit lg:sticky lg:top-36">
                <FacilityMap
                  lat={center.lat}
                  lon={center.lon}
                  facilities={filtered}
                  onSelect={select}
                />
                {selected && (
                  <div className="mt-3 rounded-2xl border-l-4 border-primary bg-soft p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold">{selected.name}</h4>
                        <p className="mt-1 text-sm text-teal">
                          {selected.kind} · {selected.distanceKm.toFixed(1)} km away
                        </p>
                      </div>
                      <Button asChild variant="default" size="sm" className="rounded-full">
                        <a href={directionsUrl(selected)} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" /> Google Maps
                        </a>
                      </Button>
                    </div>
                    {selected.address && (
                      <p className="mt-2 text-xs text-muted-foreground">{selected.address}</p>
                    )}
                    {selected.hours && (
                      <p className="mt-1 text-xs text-muted-foreground">Hours: {selected.hours}</p>
                    )}
                    {selected.phone && (
                      <p className="mt-1 text-xs text-muted-foreground">Phone: {selected.phone}</p>
                    )}
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                      Coords: {selected.lat.toFixed(5)}, {selected.lon.toFixed(5)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {!searched && (
        <div className="mt-6">
          <EmptyState
            icon={<MapPin />}
            title="Search nearby hospitals & clinics"
            text="Enter a city, area, landmark, or PIN code above to find genuine facilities."
          />
        </div>
      )}

      <section className="mt-10 border-t pt-7">
        <h2 className="text-2xl font-bold">Prefer to See a Doctor in Person?</h2>
        <p className="mt-3 text-muted-foreground">
          Find a nearby clinic or hospital when you need a physical examination. Contact listed
          facilities directly via phone or Google Maps directions to confirm appointments.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/in-person">Explore In-Person Care</Link>
        </Button>
      </section>

      <Dialog open={!!facilityBooking} onOpenChange={(o) => !o && setFacilityBooking(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogTitle>{facilityBooking?.name} (In-Person)</DialogTitle>
          <DialogDescription>
            {facilityBooking?.address ?? "OpenStreetMap listing"} · Demo request (clinic not
            connected for live confirmation)
          </DialogDescription>
          {facilityBooking && (
            <BookingForm
              key={facilityBooking.id}
              name={facilityBooking.name}
              specialty={facilityBooking.specialty ?? facilityBooking.kind}
              slots={["09:00", "11:00", "14:00", "17:00"]}
              kind="In-Person"
              place={facilityBooking.address}
              unconnectedProvider
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!docBooking} onOpenChange={(o) => !o && setDocBooking(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogTitle>
            {docBooking?.doc.name} ({docBooking?.kind})
          </DialogTitle>
          <DialogDescription>
            {docBooking?.doc.registrationNumber} · {docBooking?.doc.verificationStatus}
          </DialogDescription>
          {docBooking && (
            <BookingForm
              key={`${docBooking.doc.id}-${docBooking.kind}`}
              doctorId={docBooking.doc.id}
              name={docBooking.doc.name}
              specialty={docBooking.doc.specialty}
              slots={docBooking.doc.slots}
              fee={docBooking.doc.fee}
              kind={docBooking.kind}
              place={docBooking.kind === "In-Person" ? docBooking.doc.clinicName : undefined}
            />
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
