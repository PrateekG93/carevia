import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Clock, FileText, MapPin, Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatINR, type Product } from "@/lib/data";
import type { PharmacyOffer } from "@/lib/delivery";
import { useStore } from "@/lib/store";

export function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return <span className="text-xs font-semibold text-destructive">Unavailable nearby</span>;
  if (stock < 10)
    return <span className="text-xs font-semibold text-warning-foreground">Only {stock} left</span>;
  return <span className="text-xs font-semibold text-success">In stock</span>;
}

export function RxBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-bold text-destructive">
      <FileText className="h-3 w-3" /> Rx required
    </span>
  );
}

export function QtyStepper({
  value,
  onChange,
  max,
}: {
  value: number;
  onChange: (n: number) => void;
  max: number;
}) {
  return (
    <div className="inline-flex items-center rounded-full border bg-background">
      <Button
        variant="ghost"
        size="icon"
        type="button"
        className="grid h-8 w-8 place-items-center rounded-full hover:bg-accent disabled:opacity-40"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <span className="w-7 text-center text-sm font-semibold" aria-live="polite">
        {value}
      </span>
      <Button
        variant="ghost"
        size="icon"
        type="button"
        className="grid h-8 w-8 place-items-center rounded-full hover:bg-accent disabled:opacity-40"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function ProductCard({
  product,
  bestOffer,
}: {
  product: Product;
  bestOffer?: PharmacyOffer | undefined;
}) {
  const { add } = useStore();
  const [qty, setQty] = useState(1);
  const displayStock = bestOffer ? bestOffer.stock : product.stock;
  const displayPrice = bestOffer ? bestOffer.unitPrice : product.price;
  const max = Math.min(Math.max(displayStock, 1), 10);

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-0.5 hover:shadow-soft">
      <Link
        to="/medicines/$id"
        params={{ id: product.id }}
        className="relative block aspect-[4/3] overflow-hidden bg-soft"
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={816}
          height={816}
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
        {product.rx && (
          <div className="absolute top-2 left-2">
            <RxBadge />
          </div>
        )}
        {bestOffer && bestOffer.stock > 0 && (
          <div className="absolute right-2 bottom-2 rounded-full bg-background/90 px-2.5 py-0.5 text-[11px] font-semibold text-primary shadow-sm backdrop-blur-sm">
            {bestOffer.estimate.qualifiesFor30Min
              ? "⚡ ~30 min target"
              : `${bestOffer.estimate.minMinutes}–${bestOffer.estimate.maxMinutes} mins`}
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-semibold leading-tight">{product.name}</h3>
        <p className="text-xs text-muted-foreground">
          {[product.strength, product.pack].filter(Boolean).join(" · ")}
        </p>
        {bestOffer && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0 text-teal" />
            <span className="truncate">
              {bestOffer.pharmacy.name} ({bestOffer.estimate.distanceKm} km)
            </span>
          </p>
        )}
        {bestOffer && bestOffer.estimate.extraDistanceCharge > 0 && bestOffer.stock > 0 && (
          <p className="flex items-center gap-1 text-[11px] font-medium text-warning-foreground">
            <Clock className="h-3 w-3 shrink-0" />
            Extended radius (+{formatINR(bestOffer.estimate.extraDistanceCharge)} distance fee)
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-1">
          <span className="text-lg font-bold">{formatINR(displayPrice)}</span>
          <StockBadge stock={displayStock} />
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          {displayStock > 0 && <QtyStepper value={qty} onChange={setQty} max={max} />}
          <Button
            size="sm"
            className="flex-1 rounded-full"
            disabled={displayStock === 0}
            onClick={() => {
              add(product.id, qty);
              toast.success(`${product.name} added to cart`, {
                description: product.rx
                  ? "Prescription required before pharmacist approval."
                  : bestOffer
                    ? `Fulfilled via ${bestOffer.pharmacy.name} (${bestOffer.estimate.etaLabel})`
                    : undefined,
              });
            }}
          >
            <ShoppingCart className="h-4 w-4" /> {displayStock === 0 ? "Try Search Further" : "Add"}
          </Button>
        </div>
        <Button asChild variant="ghost" size="sm" className="rounded-full">
          <Link to="/medicines/$id" params={{ id: product.id }}>
            View Details
          </Link>
        </Button>
      </div>
    </div>
  );
}
