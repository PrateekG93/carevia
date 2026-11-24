import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Clock, Compass, MapPin, PackageSearch, Search, Upload, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { categories, formatINR, products } from "@/lib/data";
import {
  DEFAULT_USER_COORDS,
  EXPANDED_RADII_KM,
  findMedicineAcrossPharmacies,
  PRIMARY_RADIUS_KM,
} from "@/lib/delivery";
import { ProductCard } from "@/components/qm/ProductCard";
import { LocationPicker } from "@/components/qm/LocationPicker";
import { DemoBadge, EmptyState, PageShell, SectionHeader } from "@/components/qm/bits";
import { useStore } from "@/lib/store";

type S = {
  q?: string | undefined;
  cat?: string | undefined;
  sort?: "relevance" | "price-asc" | "price-desc" | undefined;
};

export const Route = createFileRoute("/medicines/")({
  validateSearch: (s: Record<string, unknown>): S => ({
    q: typeof s["q"] === "string" ? s["q"] : undefined,
    cat: typeof s["cat"] === "string" ? s["cat"] : undefined,
    sort: s["sort"] === "price-asc" || s["sort"] === "price-desc" ? s["sort"] : undefined,
  }),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Medicines & Healthcare Products — CAREVIA" },
      {
        name: "description",
        content:
          "Discover nearby pharmacies within 5 km for 30-minute target medicine delivery, or Search Further across extended zones on CAREVIA.",
      },
      { property: "og:title", content: "Medicines & Healthcare Products — CAREVIA" },
      {
        property: "og:description",
        content: "Order medicines and first aid essentials from nearby CAREVIA partner pharmacies.",
      },
    ],
  }),
  component: Catalog,
});

function Catalog() {
  const { q = "", cat, sort = "relevance" } = Route.useSearch();
  const navigate = useNavigate({ from: "/medicines/" });
  const { location, partnerPharmacies } = useStore();
  const [term, setTerm] = useState(q);
  const [radiusKm, setRadiusKm] = useState<number>(PRIMARY_RADIUS_KM);
  const [loading, setLoading] = useState(true);

  useEffect(() => setTerm(q), [q]);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 250);
    return () => clearTimeout(t);
  }, [q, cat, sort, radiusKm]);

  const activeCoords = useMemo(
    () =>
      location?.lat !== undefined && location?.lon !== undefined
        ? { lat: location.lat, lon: location.lon, label: location.label }
        : DEFAULT_USER_COORDS,
    [location],
  );

  const list = useMemo(() => {
    const s = q.toLowerCase();
    let r = products.filter(
      (p) =>
        (!cat || p.category === cat) &&
        (!s ||
          p.name.toLowerCase().includes(s) ||
          (p.genericName ?? "").toLowerCase().includes(s) ||
          p.description.toLowerCase().includes(s) ||
          categories
            .find((c) => c.id === p.category)
            ?.name.toLowerCase()
            .includes(s)),
    );
    if (sort === "price-asc") r = [...r].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") r = [...r].sort((a, b) => b.price - a.price);
    return r;
  }, [q, cat, sort]);

  const offersByProduct = useMemo(() => {
    const map: Record<string, ReturnType<typeof findMedicineAcrossPharmacies>> = {};
    for (const prod of list) {
      map[prod.id] = findMedicineAcrossPharmacies(
        prod.id,
        prod.price,
        activeCoords,
        radiusKm,
        partnerPharmacies,
      );
    }
    return map;
  }, [list, activeCoords, radiusKm, partnerPharmacies]);

  const unavailableInCurrentRadiusCount = useMemo(
    () => list.filter((p) => !offersByProduct[p.id]?.some((o) => o.stock > 0)).length,
    [list, offersByProduct],
  );

  const set = (patch: Partial<S>) => navigate({ search: (prev) => ({ ...prev, ...patch }) });

  const expandRadius = () => {
    const next = EXPANDED_RADII_KM.find((r) => r > radiusKm);
    if (next) setRadiusKm(next);
  };

  return (
    <PageShell>
      <SectionHeader
        eyebrow="CAREVIA Pharmacy Delivery"
        title="Medicines & First Aid Essentials"
        subtitle="Get your medicines delivered in as little as 30 minutes from in-stock pharmacies within 5 km."
      >
        <DemoBadge>Sample pharmacy inventory &amp; pricing</DemoBadge>
      </SectionHeader>

      {/* Location & Radius Banner */}
      <section className="mb-6 rounded-2xl border bg-mint-soft p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Searching pharmacies within {radiusKm} km of:</span>
              <LocationPicker compact />
              {!location?.lat && (
                <span className="text-xs font-normal text-muted-foreground">
                  (Using sample city center — detect or set your address for real distance checks)
                </span>
              )}
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {radiusKm <= PRIMARY_RADIUS_KM ? (
                <>
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  <span>
                    30-minute target delivery applies only to in-stock pharmacies within 5 km.
                  </span>
                </>
              ) : (
                <>
                  <Clock className="h-3.5 w-3.5 text-warning-foreground" />
                  <span>
                    Extended radius active ({radiusKm} km): pharmacies beyond 5 km display longer
                    delivery estimates and additional distance charges.
                  </span>
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {EXPANDED_RADII_KM.map((r) => (
              <Button
                key={r}
                type="button"
                size="sm"
                variant={radiusKm === r ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setRadiusKm(r)}
              >
                {r} km
              </Button>
            ))}
          </div>
        </div>

        {unavailableInCurrentRadiusCount > 0 && radiusKm < 35 && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/40 bg-background/90 px-4 py-2.5 text-sm">
            <span>
              <strong>{unavailableInCurrentRadiusCount}</strong> item(s) in this view are out of
              stock within {radiusKm} km. Expand your radius to check farther partner pharmacies.
            </span>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={expandRadius}
              className="rounded-full"
            >
              <Compass className="h-4 w-4" /> Search Further (up to{" "}
              {EXPANDED_RADII_KM.find((r) => r > radiusKm)} km)
            </Button>
          </div>
        )}
      </section>

      <search>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            set({ q: term.trim() || undefined });
          }}
          className="mb-6 flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search by brand, generic name, or first aid item…"
              className="h-11 rounded-xl pl-9"
              aria-label="Search medicines"
            />
          </div>
          <Button type="submit" className="h-11 rounded-xl px-6">
            Search
          </Button>
          <Select
            value={sort}
            onValueChange={(v) => set({ sort: v === "relevance" ? undefined : (v as S["sort"]) })}
          >
            <SelectTrigger className="h-11 w-full rounded-xl sm:w-48" aria-label="Sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Sort: Relevance</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </form>
      </search>

      <div className="mb-8 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => set({ cat: undefined })}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
            !cat
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-background hover:bg-accent"
          }`}
        >
          All
        </Button>
        {categories.map((c) => (
          <Button
            type="button"
            variant="outline"
            key={c.id}
            onClick={() => set({ cat: c.id })}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              cat === c.id
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background hover:bg-accent"
            }`}
          >
            {c.name}
          </Button>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-accent px-4 py-3 text-sm">
        <span>Have a prescription for Rx medicines? Attach it securely for pharmacist review.</span>
        <Button asChild size="sm" variant="outline" className="rounded-full bg-background">
          <Link to="/upload">
            <Upload className="h-4 w-4" /> Upload Prescription
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-2xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<PackageSearch className="h-6 w-6" />}
          title="No products found"
          text={`We couldn't find anything matching "${q}". Try another name or browse categories.`}
        >
          <Button
            onClick={() => navigate({ search: {} })}
            variant="outline"
            className="rounded-full"
          >
            Clear filters
          </Button>
        </EmptyState>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>
              Showing {list.length} products · Active search radius: {radiusKm} km
            </span>
            {radiusKm > PRIMARY_RADIUS_KM && (
              <span>
                Extended-distance fees range from {formatINR(30)} to {formatINR(90)}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {list.map((p) => {
              const offers = offersByProduct[p.id] ?? [];
              const best = offers.find((o) => o.stock > 0) ?? offers[0];
              return <ProductCard key={p.id} product={p} bestOffer={best} />;
            })}
          </div>
        </>
      )}
    </PageShell>
  );
}
