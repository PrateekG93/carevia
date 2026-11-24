import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Compass,
  FileSearch,
  Loader2,
  MapPin,
  Plus,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DemoBadge, PageShell, SectionHeader } from "@/components/qm/bits";
import { FilePicker } from "@/components/qm/FilePicker";
import { LocationPicker } from "@/components/qm/LocationPicker";
import { RxBadge } from "@/components/qm/ProductCard";
import { formatINR, products } from "@/lib/data";
import { DEFAULT_USER_COORDS } from "@/lib/delivery";
import {
  evaluatePrescriptionAvailability,
  extractReadableTextFromFile,
  parsePrescriptionLines,
  SAMPLE_RX_PRESETS,
} from "@/lib/prescription";
import { useStore } from "@/lib/store";
import { pageHead } from "@/lib/metadata";

export const Route = createFileRoute("/upload")({
  head: () =>
    pageHead(
      "Upload Prescription & Check Availability",
      "Upload your prescription, review the list of medicines written in it, and check live availability at nearby CAREVIA pharmacies.",
    ),
  component: UploadPage,
});

function UploadPage() {
  const [kind, setKind] = useState<"prescription" | "packaging">("prescription");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [extractionMode, setExtractionMode] = useState<"pdf-text" | "simulated">("simulated");
  const [rxText, setRxText] = useState<string>(SAMPLE_RX_PRESETS[0].text);
  const [newItemInput, setNewItemInput] = useState("");
  const [includeExtended, setIncludeExtended] = useState(false);
  const [rxConfirmed, setRxConfirmed] = useState(false);
  const [confirmedPackaging, setConfirmedPackaging] = useState<string[]>([]);
  const store = useStore();

  const coords = useMemo(
    () =>
      store.location?.lat !== undefined && store.location?.lon !== undefined
        ? { lat: store.location.lat, lon: store.location.lon }
        : DEFAULT_USER_COORDS,
    [store.location],
  );

  const parsedLines = useMemo(() => parsePrescriptionLines(rxText), [rxText]);

  const evaluatedItems = useMemo(
    () => evaluatePrescriptionAvailability(parsedLines, coords, store.partnerPharmacies),
    [parsedLines, coords, store.partnerPharmacies],
  );

  const changeFile = (f: File | null) => {
    setFile(f);
    setSubmitted(false);
    setRxConfirmed(false);
    setConfirmedPackaging([]);
    if (kind === "prescription") store.setRxVerifiedForCart(false);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setBusy(true);
    if (kind === "prescription") {
      const pdfText = await extractReadableTextFromFile(file);
      await new Promise((r) => setTimeout(r, 450));
      if (pdfText) {
        const lines = parsePrescriptionLines(pdfText);
        if (lines.length > 0) {
          setRxText(lines.join("\n"));
          setExtractionMode("pdf-text");
        } else {
          setExtractionMode("simulated");
        }
      } else {
        setExtractionMode("simulated");
      }
      store.addRx(file.name);
      store.setRxVerifiedForCart(true);
      setSubmitted(true);
      toast.success(
        "Prescription attached — review extracted items & pharmacy availability below.",
      );
    } else {
      await new Promise((r) => setTimeout(r, 450));
      setSubmitted(true);
    }
    setBusy(false);
  };

  const addManualLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemInput.trim().length < 3) return;
    setRxText((prev) =>
      prev.trim() ? `${prev.trim()}\n${newItemInput.trim()}` : newItemInput.trim(),
    );
    setNewItemInput("");
  };

  const addableItems = evaluatedItems.filter(
    (item) =>
      item.matchedProduct &&
      (item.availableWithin5Km || (includeExtended && item.availableExtended)),
  );

  const handleAddAllToCart = () => {
    if (!rxConfirmed) {
      toast.error("Please tick the confirmation box after checking the prescription items.");
      return;
    }
    let added = 0;
    for (const item of addableItems) {
      if (item.matchedProduct) {
        store.add(item.matchedProduct.id, 1);
        added += 1;
      }
    }
    store.setRxVerifiedForCart(true);
    toast.success(`Added ${added} available prescription item(s) to your CAREVIA cart`);
  };

  return (
    <PageShell>
      <SectionHeader
        eyebrow="CAREVIA Prescription Reader & Stock Check"
        title="Upload Prescription (Upload Rx)"
        subtitle="Upload your prescription to inspect the list of medicines written in it and check availability across nearby pharmacies."
      >
        <DemoBadge>Vision OCR API unconfigured · Editable review</DemoBadge>
      </SectionHeader>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2" role="group" aria-label="Upload type">
              {(["prescription", "packaging"] as const).map((k) => (
                <Button
                  key={k}
                  type="button"
                  variant={kind === k ? "default" : "outline"}
                  aria-pressed={kind === k}
                  onClick={() => {
                    setKind(k);
                    changeFile(null);
                  }}
                >
                  {k === "prescription" ? "Prescription (Upload Rx)" : "Medicine packaging"}
                </Button>
              ))}
            </div>
            <LocationPicker compact />
          </div>

          <FilePicker file={file} onChange={changeFile} prescription={kind === "prescription"} />

          <div className="flex flex-wrap gap-3">
            <Button type="button" disabled={!file || busy} onClick={handleAnalyze}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {kind === "prescription" ? "Extract Medicines & Check Availability" : "Submit Image"}
            </Button>
            {kind === "prescription" && !submitted && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setExtractionMode("simulated");
                  setSubmitted(true);
                  store.setRxVerifiedForCart(true);
                }}
              >
                <FileSearch className="h-4 w-4" /> Test Sample Rx Extraction
              </Button>
            )}
          </div>
        </div>

        <aside className="space-y-4 border-l pl-6">
          <h2 className="text-xl font-bold">How CAREVIA handles your Rx</h2>
          <p className="text-sm text-muted-foreground">
            Your prescription file stays on your device in memory and is never saved to browser
            localStorage.
          </p>
          <p className="text-sm text-muted-foreground">
            For PDFs with embedded text, CAREVIA parses medicine lines directly in-browser. For
            handwritten or photographed prescriptions, an external Vision OCR API is required for
            automated reading — use the editable extraction box below to confirm or adjust every
            item written on your prescription.
          </p>
          <p className="text-sm text-muted-foreground">
            Prescription-only medicines always require verification by a licensed pharmacist before
            dispatch.
          </p>
          <Link
            to="/info/$slug"
            params={{ slug: "prescription" }}
            className="inline-block text-sm font-medium text-primary underline"
          >
            Read Prescription Policy
          </Link>
        </aside>
      </div>

      {/* Prescription Items & Pharmacy Availability Result */}
      {submitted && kind === "prescription" && (
        <section className="mt-10 space-y-6 rounded-3xl border bg-soft p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold">
                  Items Written in Prescription ({evaluatedItems.length})
                </h2>
                <DemoBadge>
                  {extractionMode === "pdf-text"
                    ? "Extracted from PDF text"
                    : "Editable simulated OCR (Vision API not connected)"}
                </DemoBadge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Checking stock near{" "}
                <strong>{store.location?.label ?? DEFAULT_USER_COORDS.label}</strong> within 5 km
                (plus Search Further up to 35 km).
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_RX_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="bg-background"
                  onClick={() => setRxText(preset.text)}
                >
                  Load {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Editable Rx Text & Quick Line Add */}
          <div className="grid gap-4 rounded-2xl border bg-card p-5 lg:grid-cols-[1fr_320px]">
            <div className="space-y-2">
              <Label htmlFor="rx-extracted-text">
                Review or edit medicines written on your prescription (one per line)
              </Label>
              <Textarea
                id="rx-extracted-text"
                value={rxText}
                onChange={(e) => setRxText(e.target.value)}
                rows={4}
                placeholder="e.g. Paracetamol 500 mg (1-0-1)"
              />
            </div>
            <form onSubmit={addManualLine} className="space-y-2 self-end">
              <Label htmlFor="rx-add-line">Add another item from prescription</Label>
              <div className="flex gap-2">
                <Input
                  id="rx-add-line"
                  value={newItemInput}
                  onChange={(e) => setNewItemInput(e.target.value)}
                  placeholder="e.g. Cetirizine 10 mg"
                />
                <Button type="submit" variant="secondary">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
              <label className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={includeExtended}
                  onChange={(e) => setIncludeExtended(e.target.checked)}
                />
                Include pharmacies beyond 5 km (Search Further)
              </label>
            </form>
          </div>

          {/* Evaluated Prescription Items Table / Cards */}
          <div className="space-y-3">
            {evaluatedItems.map((item) => {
              const offer = item.bestOffer ?? (includeExtended ? item.extendedOffer : null);
              return (
                <article
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-4"
                >
                  <div className="flex min-w-[240px] flex-1 items-start gap-4">
                    {item.matchedProduct ? (
                      <img
                        src={item.matchedProduct.image}
                        alt={item.matchedProduct.name}
                        className="h-16 w-16 shrink-0 rounded-xl border bg-soft object-cover"
                      />
                    ) : (
                      <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border bg-soft text-muted-foreground">
                        <AlertTriangle className="h-6 w-6" />
                      </span>
                    )}
                    <div className="space-y-1">
                      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Written on Rx: &ldquo;{item.writtenText}&rdquo;
                      </p>
                      {item.matchedProduct ? (
                        <>
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              to="/medicines/$id"
                              params={{ id: item.matchedProduct.id }}
                              className="font-bold hover:text-primary"
                            >
                              {item.matchedProduct.name}
                            </Link>
                            {item.matchedProduct.rx && <RxBadge />}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {[item.matchedProduct.strength, item.matchedProduct.pack]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm font-semibold text-warning-foreground">
                          Not matched in sample CAREVIA catalog — pharmacist sourcing required
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Availability Column */}
                  <div className="min-w-[240px] space-y-1 text-sm">
                    {!item.matchedProduct ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-3 py-1 text-xs font-semibold text-warning-foreground">
                        Requires custom pharmacy check
                      </span>
                    ) : item.bestOffer ? (
                      <>
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Available within 5 km (
                          {item.bestOffer.stock} in stock)
                        </span>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 text-teal" />
                          {item.bestOffer.pharmacy.name} ({item.bestOffer.estimate.distanceKm} km) ·{" "}
                          {item.bestOffer.estimate.etaLabel}
                        </p>
                      </>
                    ) : item.extendedOffer ? (
                      <>
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2.5 py-0.5 text-xs font-semibold text-warning-foreground">
                          <Compass className="h-3.5 w-3.5" /> Out of stock within 5 km · Available
                          at {item.extendedOffer.estimate.distanceKm} km
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {item.extendedOffer.pharmacy.name} ·{" "}
                          {item.extendedOffer.estimate.etaLabel} (+
                          {formatINR(item.extendedOffer.estimate.extraDistanceCharge)} distance fee)
                        </p>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                        Unavailable at partner pharmacies
                      </span>
                    )}
                  </div>

                  {/* Price & Add Action */}
                  <div className="flex items-center gap-3">
                    {item.matchedProduct && (
                      <strong className="text-base">
                        {formatINR(offer?.unitPrice ?? item.matchedProduct.price)}
                      </strong>
                    )}
                    {item.matchedProduct &&
                      (item.bestOffer || (includeExtended && item.extendedOffer)) && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!rxConfirmed}
                          onClick={() => {
                            store.add(item.matchedProduct!.id, 1);
                            toast.success(`Added ${item.matchedProduct!.name} to cart`);
                          }}
                        >
                          Add
                        </Button>
                      )}
                    {item.matchedProduct &&
                      !item.bestOffer &&
                      item.extendedOffer &&
                      !includeExtended && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => setIncludeExtended(true)}
                        >
                          Search Further
                        </Button>
                      )}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5">
            <label className="flex items-start gap-2.5 text-sm">
              <Checkbox
                checked={rxConfirmed}
                onCheckedChange={(v) => setRxConfirmed(!!v)}
                className="mt-0.5"
              />
              <span>
                I have reviewed the medicine names, strengths, and quantities above against my
                uploaded prescription.
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={!rxConfirmed || addableItems.length === 0}
                onClick={handleAddAllToCart}
                className="rounded-full"
              >
                <ShoppingCart className="h-4 w-4" /> Add {addableItems.length} Available Item(s) to
                Cart
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/cart">Go to Cart</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {submitted && kind === "packaging" && (
        <section className="mt-10">
          <h2 className="text-xl font-bold">
            Illustrative sample matches — image recognition not connected
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {products
              .filter((p) => !p.rx && p.stock > 0)
              .slice(0, 3)
              .map((p) => (
                <article key={p.id} className="space-y-3 rounded-2xl border bg-card p-5">
                  <img src={p.image} alt={p.name} className="h-40 w-full rounded-xl object-cover" />
                  <DemoBadge>Sample product</DemoBadge>
                  <h3 className="font-bold">{p.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {p.strength} · {p.pack} · {formatINR(p.price)}
                  </p>
                  <label className="flex items-start gap-2 text-sm">
                    <Checkbox
                      checked={confirmedPackaging.includes(p.id)}
                      onCheckedChange={(v) =>
                        setConfirmedPackaging((c) =>
                          v ? [...c, p.id] : c.filter((id) => id !== p.id),
                        )
                      }
                    />
                    I have confirmed the name, strength and pack.
                  </label>
                  <div className="flex gap-2">
                    <Button
                      disabled={!confirmedPackaging.includes(p.id)}
                      onClick={() => store.add(p.id)}
                    >
                      Add to Cart
                    </Button>
                    <Button asChild variant="ghost">
                      <Link to="/medicines/$id" params={{ id: p.id }}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </article>
              ))}
          </div>
        </section>
      )}
    </PageShell>
  );
}
