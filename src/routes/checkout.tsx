import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Compass, FileText, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { deliveryFee, formatINR } from "@/lib/data";
import { DEFAULT_USER_COORDS, estimatePharmacyDelivery, PRIMARY_RADIUS_KM } from "@/lib/delivery";
import { useCartLines, useStore, type Address } from "@/lib/store";
import { DemoBadge, PageShell, SectionHeader } from "@/components/qm/bits";
import { uploadError } from "@/lib/safety";
import { LocationPicker } from "@/components/qm/LocationPicker";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Checkout — CAREVIA" },
      {
        name: "description",
        content:
          "Select a nearby pharmacy, review honest delivery estimates, and place a demonstration CAREVIA order.",
      },
      { property: "og:title", content: "Checkout — CAREVIA" },
      { property: "og:description", content: "Demonstration checkout for CAREVIA." },
    ],
  }),
  component: Checkout,
});

const empty: Address = { name: "", phone: "", line1: "", city: "", pin: "" };

function Checkout() {
  const lines = useCartLines();
  const store = useStore();
  const navigate = useNavigate();
  const [addr, setAddr] = useState<Address>(
    store.addresses[0] ?? {
      ...empty,
      name: store.user?.name ?? "",
      phone: store.user?.mobile ?? "",
    },
  );
  const [errors, setErrors] = useState<Partial<Record<keyof Address, string>>>({});
  const [opt, setOpt] = useState<"standard" | "express">("standard");
  const [pay, setPay] = useState("cod");
  const [showExtended, setShowExtended] = useState(false);
  const [pharmacyId, setPharmacyId] = useState(store.partnerPharmacies[0]?.id ?? "pharm-1");
  const [rxFile, setRxFile] = useState<string | null>(
    store.rxVerifiedForCart ? "Prescription attached" : null,
  );
  const [busy, setBusy] = useState(false);

  const coords = useMemo(
    () =>
      store.location?.lat !== undefined && store.location?.lon !== undefined
        ? { lat: store.location.lat, lon: store.location.lon }
        : DEFAULT_USER_COORDS,
    [store.location],
  );

  const pharmacyChoices = useMemo(() => {
    return store.partnerPharmacies
      .map((p) => {
        const allInStock = lines.every((l) => (p.inventory[l.product.id] ?? 0) >= l.qty);
        const est = estimatePharmacyDelivery(coords, p, allInStock);
        return { pharmacy: p, allInStock, est };
      })
      .filter((item) => showExtended || item.est.distanceKm <= PRIMARY_RADIUS_KM);
  }, [store.partnerPharmacies, lines, coords, showExtended]);

  const selectedPharmacy =
    pharmacyChoices.find((c) => c.pharmacy.id === pharmacyId) ?? pharmacyChoices[0];

  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const extraDistanceFee = selectedPharmacy?.est.extraDistanceCharge ?? 0;
  const delivery = deliveryFee(subtotal, opt, extraDistanceFee);
  const hasRx = lines.some((l) => l.product.rx);

  if (!lines.length) {
    return (
      <PageShell>
        <p className="text-muted-foreground">
          Your cart is empty.{" "}
          <Link to="/medicines" className="text-primary underline">
            Order medicines
          </Link>
        </p>
      </PageShell>
    );
  }

  const validate = () => {
    const e: typeof errors = {};
    if (addr.name.trim().length < 2) e.name = "Enter the recipient's name.";
    if (!/^[6-9]\d{9}$/.test(addr.phone.replace(/\D/g, "").slice(-10)))
      e.phone = "Enter a valid 10-digit mobile number.";
    if (addr.line1.trim().length < 5) e.line1 = "Enter house, street, and area.";
    if (addr.city.trim().length < 2) e.city = "Enter your city.";
    if (!/^\d{6}$/.test(addr.pin)) e.pin = "Enter a 6-digit PIN code.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const place = async () => {
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    if (hasRx && !rxFile) {
      toast.error("Attach a prescription for the prescription medicines in your cart.");
      return;
    }
    if (!selectedPharmacy) {
      toast.error("Choose a pharmacy or click Search Further.");
      return;
    }
    setBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    if (!store.addresses.some((a) => a.line1 === addr.line1 && a.pin === addr.pin)) {
      store.addAddress(addr);
    }
    const order = store.placeOrder({
      lines,
      subtotal,
      delivery,
      extendedDistanceFee: extraDistanceFee,
      total: subtotal + delivery,
      address: addr,
      pharmacyId: selectedPharmacy.pharmacy.id,
      pharmacyName: selectedPharmacy.pharmacy.name,
      distanceKm: selectedPharmacy.est.distanceKm,
      etaLabel: selectedPharmacy.est.etaLabel,
      deliveryOption: opt,
      payment: pay === "cod" ? "Cash on delivery (demo)" : "UPI / Card (gateway not configured)",
      paymentStatus: pay === "cod" ? "Cash on delivery (demo)" : "Demo — no charge",
      hasRx,
    });
    if (
      rxFile &&
      rxFile !== "Prescription attached" &&
      !store.rxUploads.some((r) => r.fileName === rxFile)
    ) {
      store.addRx(rxFile);
    }
    store.clearCart();
    toast.success("CAREVIA demo order placed");
    navigate({ to: "/orders/$id", params: { id: order.id } });
  };

  const field = (
    k: keyof Address,
    label: string,
    props: React.ComponentProps<typeof Input> = {},
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      <Input
        id={k}
        value={addr[k]}
        onChange={(e) => setAddr({ ...addr, [k]: e.target.value })}
        aria-invalid={!!errors[k]}
        {...props}
      />
      {errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <PageShell>
      <SectionHeader
        eyebrow="CAREVIA Checkout"
        title="Checkout"
        subtitle="Healthcare, Connected. Care, Delivered."
      >
        <DemoBadge>Demonstration order — payment gateway not connected</DemoBadge>
      </SectionHeader>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card title="1. Delivery address">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" /> Location: <LocationPicker compact />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("name", "Full name", { autoComplete: "name" })}
              {field("phone", "Mobile number", { inputMode: "tel", autoComplete: "tel" })}
              <div className="sm:col-span-2">
                {field("line1", "House, street, area", { autoComplete: "street-address" })}
              </div>
              {field("city", "City", { autoComplete: "address-level2" })}
              {field("pin", "PIN code", {
                inputMode: "numeric",
                maxLength: 6,
                autoComplete: "postal-code",
              })}
            </div>
          </Card>

          <Card title="2. Select pharmacy (5 km primary zone)">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                30-minute target delivery applies only within 5 km for stocked items.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => setShowExtended((v) => !v)}
              >
                <Compass className="h-3.5 w-3.5" />{" "}
                {showExtended ? "Limit to 5 km" : "Search Further (>5 km)"}
              </Button>
            </div>
            <RadioGroup
              value={selectedPharmacy?.pharmacy.id ?? ""}
              onValueChange={setPharmacyId}
              className="grid gap-3"
            >
              {pharmacyChoices.map(({ pharmacy, allInStock, est }) => (
                <Option
                  key={pharmacy.id}
                  value={pharmacy.id}
                  title={`${pharmacy.name} · ${est.distanceKm} km`}
                  desc={`${est.etaLabel}${est.extraDistanceCharge > 0 ? ` · +${formatINR(est.extraDistanceCharge)} distance charge` : ""} · ${
                    allInStock ? "All cart items in stock (sample)" : "Partial stock at this store"
                  }`}
                />
              ))}
            </RadioGroup>
          </Card>

          <Card title="3. Delivery option">
            <RadioGroup
              value={opt}
              onValueChange={(v) => setOpt(v as typeof opt)}
              className="grid gap-3 sm:grid-cols-2"
            >
              <Option
                value="standard"
                title="Standard delivery"
                desc={subtotal >= 499 ? "Free base delivery" : formatINR(40)}
              />
              <Option
                value="express"
                title="Priority dispatch"
                desc={`+${formatINR(50)} · ${selectedPharmacy?.est.qualifiesFor30Min ? "30-min target (<5 km)" : "Faster pickup, extended travel time applies"}`}
              />
            </RadioGroup>
          </Card>

          {hasRx && (
            <Card title="4. Prescription verification">
              {rxFile ? (
                <p className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success" /> {rxFile} — awaiting pharmacist
                  review (demo). No real pharmacist review occurs yet.
                </p>
              ) : (
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4 text-sm hover:bg-accent">
                  <FileText className="h-5 w-5 text-primary" /> Attach prescription image or PDF
                  (kept in memory only)
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const error = uploadError(f, true);
                      if (error) {
                        toast.error(error);
                        return;
                      }
                      store.addRx(f.name);
                      setRxFile(f.name);
                      store.setRxVerifiedForCart(true);
                    }}
                  />
                </label>
              )}
            </Card>
          )}

          <Card title={`${hasRx ? 5 : 4}. Payment method`}>
            <RadioGroup value={pay} onValueChange={setPay} className="grid gap-3 sm:grid-cols-2">
              <Option value="cod" title="Cash on delivery" desc="Pay on doorstep (demo)" />
              <Option
                value="upi"
                title="UPI / Card (API unconfigured)"
                desc="Requires Razorpay / Stripe keys — no payment processed"
              />
            </RadioGroup>
          </Card>
        </div>

        <aside className="h-fit space-y-3 rounded-3xl border bg-soft p-6 lg:sticky lg:top-32">
          <h2 className="text-lg font-bold">Order summary</h2>
          {lines.map((l) => (
            <div key={l.product.id} className="flex justify-between text-sm">
              <span>
                {l.product.name} × {l.qty}
              </span>
              <span>{formatINR(l.product.price * l.qty)}</span>
            </div>
          ))}
          <div className="space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery &amp; distance fee</span>
              <span>{delivery ? formatINR(delivery) : "Free"}</span>
            </div>
            {selectedPharmacy && (
              <p className="pt-1 text-xs text-muted-foreground">
                Pharmacy: <strong>{selectedPharmacy.pharmacy.name}</strong> (
                {selectedPharmacy.est.etaLabel})
              </p>
            )}
          </div>
          <div className="flex justify-between border-t pt-3 text-lg font-bold">
            <span>Total</span>
            <span>{formatINR(subtotal + delivery)}</span>
          </div>
          <Button size="lg" className="w-full rounded-full" onClick={place} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Place Demo Order
          </Button>
          <Button asChild variant="ghost" className="w-full rounded-full">
            <Link to="/cart">Edit cart</Link>
          </Button>
        </aside>
      </div>
    </PageShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border bg-card p-6">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Option({ value, title, desc }: { value: string; title: string; desc: string }) {
  return (
    <Label
      htmlFor={"o-" + value}
      className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent"
    >
      <RadioGroupItem id={"o-" + value} value={value} className="mt-0.5" />
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="text-xs font-normal text-muted-foreground">{desc}</span>
      </span>
    </Label>
  );
}
