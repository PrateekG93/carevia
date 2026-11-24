import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/data";
import { useStore } from "@/lib/store";
import { DemoBadge, PageShell } from "@/components/qm/bits";

export const Route = createFileRoute("/orders/$id")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Order Tracking — CAREVIA" },
      { name: "description", content: "Track the status of your CAREVIA order." },
      { property: "og:title", content: "Order Tracking — CAREVIA" },
      { property: "og:description", content: "Simulated order tracking on CAREVIA." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Track,
});

function Track() {
  const { id } = Route.useParams();
  const { orders, advanceOrder } = useStore();
  const o = orders.find((x) => x.id === id);

  if (!o) {
    return (
      <PageShell>
        <h1 className="text-2xl font-bold">Order not found</h1>
        <p className="mt-2 text-muted-foreground">
          Demo orders are kept only for this visit.{" "}
          <Link to="/orders" className="text-primary underline">
            View orders
          </Link>
        </p>
      </PageShell>
    );
  }

  const done = o.stage === o.stages.length - 1;

  return (
    <PageShell className="max-w-4xl">
      <div className="rounded-3xl border bg-hero p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
        <h1 className="mt-3 text-3xl font-bold">CAREVIA Order Confirmation</h1>
        <p className="mt-2 text-muted-foreground">
          Order {o.id} · Fulfilled by {o.pharmacyName} ({o.distanceKm} km) · {o.etaLabel}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          This is a simulated demonstration order; no pharmacy has received it and no real payment
          was processed.
        </p>
        <DemoBadge className="mt-3">Simulated tracking</DemoBadge>
      </div>

      <section className="mt-8 rounded-3xl border bg-card p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Order status</h2>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={done}
            onClick={() => advanceOrder(o.id)}
          >
            {done ? "Delivered" : "Simulate next step"}
          </Button>
        </div>
        <ol className="space-y-0">
          {o.stages.map((s, i) => {
            const state = i < o.stage ? "done" : i === o.stage ? "current" : "todo";
            return (
              <li key={s} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span
                    className={`grid h-8 w-8 place-items-center rounded-full border-2 text-sm font-bold ${
                      state === "todo"
                        ? "border-border text-muted-foreground"
                        : "border-primary bg-primary text-primary-foreground"
                    } ${state === "current" ? "ring-4 ring-primary/20" : ""}`}
                  >
                    {state === "done" ? <Check className="h-4 w-4" /> : i + 1}
                  </span>
                  {i < o.stages.length - 1 && (
                    <span className={`h-8 w-0.5 ${i < o.stage ? "bg-primary" : "bg-border"}`} />
                  )}
                </div>
                <div className="pt-1">
                  <p className={`font-semibold ${state === "todo" ? "text-muted-foreground" : ""}`}>
                    {s}
                  </p>
                  {s === "Prescription Verification" && state === "current" && (
                    <p className="text-xs text-muted-foreground">
                      A licensed pharmacist must review your prescription before the order can
                      proceed.
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border bg-card p-6 text-sm">
          <h3 className="mb-3 font-bold">Items</h3>
          {o.lines.map((l) => (
            <div key={l.product.id} className="flex justify-between py-1">
              <span>
                {l.product.name} × {l.qty}
              </span>
              <span>{formatINR(l.product.price * l.qty)}</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t pt-2">
            <span>Delivery &amp; distance fee</span>
            <span>{o.delivery ? formatINR(o.delivery) : "Free"}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatINR(o.total)}</span>
          </div>
        </div>
        <div className="rounded-3xl border bg-card p-6 text-sm">
          <h3 className="mb-3 font-bold">Delivery &amp; Payment</h3>
          <p>{o.address.name}</p>
          <p className="text-muted-foreground">
            {o.address.line1}, {o.address.city} {o.address.pin}
          </p>
          <p className="mt-3">
            <strong>Pharmacy:</strong> {o.pharmacyName} ({o.distanceKm} km)
          </p>
          <p>
            <strong>Estimate:</strong> {o.etaLabel}
          </p>
          <p>
            <strong>Payment:</strong> {o.payment}
          </p>
        </div>
      </section>

      {/* CAREVIA Email Confirmation Template Preview */}
      <section className="mt-6 rounded-3xl border bg-soft p-6 text-sm">
        <div className="mb-2 flex items-center gap-2 font-bold text-primary">
          <Mail className="h-4 w-4" /> CAREVIA Email Notification Preview (Requires Resend/Email
          API)
        </div>
        <div className="rounded-2xl border bg-background p-4 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">
            Subject: Your CAREVIA Order {o.id} — Healthcare, Connected. Care, Delivered.
          </p>
          <p className="mt-2">
            Hi {o.address.name}, thank you for placing order {o.id} with {o.pharmacyName} via
            CAREVIA. Current status: {o.stages[o.stage]}. Estimated delivery: {o.etaLabel}. Total:{" "}
            {formatINR(o.total)}.
          </p>
        </div>
      </section>

      <div className="mt-6 flex gap-3">
        <Button asChild className="rounded-full">
          <Link to="/medicines">Continue shopping</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/orders">All orders</Link>
        </Button>
      </div>
    </PageShell>
  );
}
