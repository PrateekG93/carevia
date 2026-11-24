import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deliveryFee, DELIVERY_FREE_ABOVE, formatINR } from "@/lib/data";
import { useCartLines, useStore } from "@/lib/store";
import { QtyStepper, RxBadge } from "@/components/qm/ProductCard";
import { DemoBadge, EmptyState, PageShell, SectionHeader } from "@/components/qm/bits";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Your Cart — CAREVIA" },
      {
        name: "description",
        content: "Review the medicines and first aid essentials in your CAREVIA cart.",
      },
      { property: "og:title", content: "Your Cart — CAREVIA" },
      { property: "og:description", content: "Review your cart before checkout on CAREVIA." },
    ],
  }),
  component: Cart,
});

function Cart() {
  const lines = useCartLines();
  const { setQty, remove, rxVerifiedForCart } = useStore();
  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const delivery = deliveryFee(subtotal, "standard");
  const hasRx = lines.some((l) => l.product.rx);

  if (!lines.length) {
    return (
      <PageShell>
        <EmptyState
          icon={<ShoppingCart className="h-6 w-6" />}
          title="Your CAREVIA cart is empty"
          text="Browse medicines, first aid products, and nearby pharmacies to get started."
        >
          <Button asChild className="rounded-full">
            <Link to="/medicines">Order Medicines</Link>
          </Button>
        </EmptyState>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <SectionHeader
        title="Your Cart"
        subtitle="Only cart items are saved locally; personal and medical details are never stored."
      >
        <DemoBadge>Demo checkout</DemoBadge>
      </SectionHeader>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {lines.map(({ product, qty }) => (
            <div
              key={product.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3"
            >
              <img
                src={product.image}
                alt=""
                loading="lazy"
                width={80}
                height={80}
                className="h-20 w-20 rounded-xl object-cover"
              />
              <div className="min-w-[140px] flex-1">
                <Link
                  to="/medicines/$id"
                  params={{ id: product.id }}
                  className="font-semibold hover:text-primary"
                >
                  {product.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {[product.strength, product.pack].filter(Boolean).join(" · ")}
                </p>
                {product.rx && (
                  <div className="mt-1">
                    <RxBadge />
                  </div>
                )}
              </div>
              <QtyStepper
                value={qty}
                onChange={(n) => setQty(product.id, n)}
                max={Math.min(product.stock || 10, 10)}
              />
              <span className="w-20 text-right font-bold">{formatINR(product.price * qty)}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => remove(product.id)}
                aria-label={`Remove ${product.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <aside className="h-fit space-y-4 rounded-3xl border bg-soft p-6">
          <h2 className="text-lg font-bold">Order Summary</h2>
          <Row k="Subtotal" v={formatINR(subtotal)} />
          <Row k="Base delivery" v={delivery === 0 ? "Free" : formatINR(delivery)} />
          {subtotal < DELIVERY_FREE_ABOVE && (
            <p className="text-xs text-muted-foreground">
              Free standard local delivery on orders above {formatINR(DELIVERY_FREE_ABOVE)}.
              Extended-radius charges (if selecting a pharmacy beyond 5 km) are shown at checkout.
            </p>
          )}
          <div className="border-t pt-3">
            <Row k="Estimated Total" v={formatINR(subtotal + delivery)} bold />
          </div>
          {hasRx && (
            <div
              className={`rounded-xl p-3 text-sm ${rxVerifiedForCart ? "bg-success/10" : "bg-destructive/5"}`}
            >
              <FileText className="mr-1 inline h-4 w-4" />
              {rxVerifiedForCart
                ? "Prescription attached — requires licensed pharmacist review before dispatch."
                : "Your cart contains prescription medicines. Attach a prescription at checkout."}
            </div>
          )}
          <Button asChild size="lg" className="w-full rounded-full">
            <Link to="/checkout">Proceed to Checkout</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full rounded-full">
            <Link to="/medicines">Continue shopping</Link>
          </Button>
        </aside>
      </div>
    </PageShell>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-lg font-bold" : "text-sm"}`}>
      <span>{k}</span>
      <span>{v}</span>
    </div>
  );
}
