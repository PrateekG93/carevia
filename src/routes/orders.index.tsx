import { createFileRoute, Link } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/data";
import { useStore } from "@/lib/store";
import { DemoBadge, EmptyState, PageShell, SectionHeader } from "@/components/qm/bits";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "My Orders — CAREVIA" },
      {
        name: "description",
        content: "View your CAREVIA medicine order history and delivery status.",
      },
      { property: "og:title", content: "My Orders — CAREVIA" },
      { property: "og:description", content: "Order history and delivery tracking on CAREVIA." },
    ],
  }),
  component: Orders,
});

function Orders() {
  const { orders } = useStore();
  return (
    <PageShell>
      <SectionHeader title="My Orders" subtitle="Order history and simulated delivery tracking.">
        <DemoBadge>Simulated tracking</DemoBadge>
      </SectionHeader>
      {!orders.length ? (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="No orders yet"
          text="Demo orders you place during this visit will appear here."
        >
          <Button asChild className="rounded-full">
            <Link to="/medicines">Order Medicines</Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              to="/orders/$id"
              params={{ id: o.id }}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 hover:shadow-soft"
            >
              <div>
                <p className="font-semibold">
                  Order {o.id} · {o.pharmacyName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(o.createdAt).toLocaleString()} · {o.lines.length} items · {o.etaLabel}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">{formatINR(o.total)}</p>
                <p className="text-sm font-medium text-primary">{o.stages[o.stage]}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
