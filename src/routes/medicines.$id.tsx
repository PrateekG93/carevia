import { useMemo, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Compass,
  MapPin,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { categories, formatINR, getProduct, products } from "@/lib/data";
import {
  DEFAULT_USER_COORDS,
  EXPANDED_RADII_KM,
  findMedicineAcrossPharmacies,
  PRIMARY_RADIUS_KM,
} from "@/lib/delivery";
import { useStore } from "@/lib/store";
import { ProductCard, QtyStepper, RxBadge, StockBadge } from "@/components/qm/ProductCard";
import { DemoBadge, PageShell } from "@/components/qm/bits";

export const Route = createFileRoute("/medicines/$id")({
  loader: ({ params }) => {
    const product = getProduct(params.id);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { property: "og:type", content: "website" },
          { name: "twitter:card", content: "summary_large_image" },
          { title: `${loaderData.product.name} — CAREVIA` },
          { name: "description", content: loaderData.product.description },
          { property: "og:title", content: `${loaderData.product.name} — CAREVIA` },
          { property: "og:description", content: loaderData.product.description },
        ]
      : [
          { title: "Product unavailable — CAREVIA" },
          { name: "description", content: "This CAREVIA product is unavailable." },
          { property: "og:title", content: "Product unavailable — CAREVIA" },
          { property: "og:description", content: "This CAREVIA product is unavailable." },
          { property: "og:type", content: "website" },
          { name: "twitter:card", content: "summary_large_image" },
          { name: "robots", content: "noindex" },
        ],
  }),
  notFoundComponent: () => (
    <PageShell>
      <h1 className="text-2xl font-bold">Product not found</h1>
      <Link to="/medicines" className="mt-4 inline-block text-primary underline">
        Back to medicines
      </Link>
    </PageShell>
  ),
  component: Detail,
});

function Detail() {
  const { product } = Route.useLoaderData();
  const { add, location, partnerPharmacies } = useStore();
  const [qty, setQty] = useState(1);
  const [radiusKm, setRadiusKm] = useState<number>(PRIMARY_RADIUS_KM);

  const coords = useMemo(
    () =>
      location?.lat !== undefined && location?.lon !== undefined
        ? { lat: location.lat, lon: location.lon }
        : DEFAULT_USER_COORDS,
    [location],
  );

  const offers = useMemo(
    () =>
      findMedicineAcrossPharmacies(product.id, product.price, coords, radiusKm, partnerPharmacies),
    [product.id, product.price, coords, radiusKm, partnerPharmacies],
  );
  const stockedOffer = offers.find((o) => o.stock > 0);
  const cat = categories.find((c) => c.id === product.category) ?? {
    id: product.category,
    name: "Healthcare",
  };
  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <PageShell>
      <Link
        to="/medicines"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> All medicines
      </Link>
      <div className="grid gap-10 md:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border bg-soft">
          <img
            src={product.image}
            alt={product.name}
            width={816}
            height={816}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              {cat.name}
            </span>
            {product.rx && <RxBadge />}
            <DemoBadge>Sample pharmacy stock</DemoBadge>
          </div>
          <h1 className="text-3xl font-bold md:text-4xl">{product.name}</h1>
          <p className="mt-2 text-muted-foreground">
            {[product.genericName, product.strength, product.pack].filter(Boolean).join(" · ")}
          </p>
          <div className="mt-5 flex items-center gap-4">
            <span className="text-3xl font-bold">
              {formatINR(stockedOffer?.unitPrice ?? product.price)}
            </span>
            <StockBadge stock={stockedOffer?.stock ?? 0} />
          </div>
          <p className="mt-5 leading-relaxed text-foreground/80">{product.description}</p>

          {product.rx && (
            <div className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <strong>Prescription required.</strong> This medicine can only be dispensed after a
              valid prescription is uploaded and reviewed by a licensed pharmacist.
              <Link to="/upload" className="ml-1 font-semibold text-primary underline">
                Upload prescription
              </Link>
            </div>
          )}

          {/* Pharmacy radius availability & Search Further */}
          <section className="mt-6 rounded-2xl border bg-soft p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold">
                Nearby Pharmacy Availability ({radiusKm} km radius)
              </h2>
              {radiusKm < 35 && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full bg-background"
                  onClick={() => {
                    const next = EXPANDED_RADII_KM.find((r) => r > radiusKm);
                    if (next) setRadiusKm(next);
                  }}
                >
                  <Compass className="h-3.5 w-3.5" /> Search Further
                </Button>
              )}
            </div>

            <div className="mt-3 space-y-2">
              {offers.map((o) => (
                <div
                  key={o.pharmacy.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-background px-3 py-2.5 text-sm"
                >
                  <div>
                    <p className="font-semibold">
                      {o.pharmacy.name}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        ({o.estimate.distanceKm} km)
                      </span>
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {o.estimate.etaLabel}
                      {o.estimate.extraDistanceCharge > 0 &&
                        o.stock > 0 &&
                        ` · +${formatINR(o.estimate.extraDistanceCharge)} distance charge`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatINR(o.unitPrice)}</p>
                    <p
                      className={`text-xs font-semibold ${o.stock > 0 ? "text-success" : "text-destructive"}`}
                    >
                      {o.stock > 0 ? `${o.stock} units` : "Out of stock"}
                    </p>
                  </div>
                </div>
              ))}
              {!stockedOffer && (
                <p className="flex items-center gap-1.5 text-xs text-warning-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  Unavailable within {radiusKm} km. Click &ldquo;Search Further&rdquo; to check
                  pharmacies located farther away.
                </p>
              )}
            </div>
          </section>

          <div className="mt-6 flex items-center gap-3">
            {(stockedOffer?.stock ?? 0) > 0 && (
              <QtyStepper
                value={qty}
                onChange={setQty}
                max={Math.min(stockedOffer?.stock ?? 10, 10)}
              />
            )}
            <Button
              size="lg"
              className="rounded-full"
              disabled={!stockedOffer}
              onClick={() => {
                add(product.id, qty);
                toast.success("Added to cart");
              }}
            >
              <ShoppingCart className="h-4 w-4" />{" "}
              {stockedOffer ? "Add to Cart" : "Use Search Further Above"}
            </Button>
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-teal" />
            {stockedOffer?.estimate.qualifiesFor30Min ? (
              <span className="inline-flex items-center gap-1 font-medium text-primary">
                <CheckCircle2 className="h-4 w-4" /> Eligible for 30-minute target delivery within 5
                km.
              </span>
            ) : (
              "Read the label and consult a pharmacist or doctor if unsure."
            )}
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-5 text-2xl font-bold">More in {cat.name}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </PageShell>
  );
}
