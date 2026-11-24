import { useState } from "react";
import { Building2, CheckCircle2, FileCheck2, IndianRupee, Package, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DemoBadge } from "@/components/qm/bits";
import { formatINR, PHARMACY_PLANS, products } from "@/lib/data";
import { useStore } from "@/lib/store";

export function PharmacyDashboard() {
  const store = useStore();
  const [selectedId, setSelectedId] = useState(store.partnerPharmacies[0]?.id ?? "pharm-1");
  const pharmacy =
    store.partnerPharmacies.find((p) => p.id === selectedId) ?? store.partnerPharmacies[0];

  const [storeName, setStoreName] = useState(pharmacy?.name ?? "");
  const [licenseNo, setLicenseNo] = useState(pharmacy?.licenseNumber ?? "");
  const [openHours, setOpenHours] = useState(pharmacy?.openHours ?? "");

  if (!pharmacy) return null;

  const switchStore = (id: string) => {
    setSelectedId(id);
    const next = store.partnerPharmacies.find((p) => p.id === id);
    if (next) {
      setStoreName(next.name);
      setLicenseNo(next.licenseNumber);
      setOpenHours(next.openHours);
    }
  };

  const pharmOrders = store.orders.filter((o) => o.pharmacyId === pharmacy.id);
  const grossSales = pharmOrders.reduce((s, o) => s + o.subtotal, 0);
  const commissionAmt = pharmOrders.reduce((s, o) => s + o.commissionAmount, 0);
  const planFee =
    pharmacy.subscriptionPlan === "Starter"
      ? store.platformSettings.starterPlanInr
      : pharmacy.subscriptionPlan === "Growth"
        ? store.platformSettings.growthPlanInr
        : store.platformSettings.enterprisePlanInr;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-soft p-5">
        <div>
          <p className="text-xs font-bold tracking-wider text-teal uppercase">
            CAREVIA Pharmacy Partner Portal
          </p>
          <h2 className="text-xl font-bold">{pharmacy.name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Drug License: {pharmacy.licenseNumber} ·{" "}
            {pharmacy.verified ? "Verified (Demo)" : "Pending License Verification"} · Plan:{" "}
            <strong>{pharmacy.subscriptionPlan}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="pharm-switcher" className="text-xs">
            Active Store
          </Label>
          <select
            id="pharm-switcher"
            value={pharmacy.id}
            onChange={(e) => switchStore(e.target.value)}
            className="rounded-xl border bg-background px-3 py-2 text-sm"
          >
            {store.partnerPharmacies.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sales & Earnings KPIs */}
      <section className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border bg-card p-5">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <IndianRupee className="h-4 w-4 text-primary" /> Gross Medicine Sales
          </p>
          <p className="mt-2 font-display text-2xl font-bold">{formatINR(grossSales)}</p>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-xs text-muted-foreground">
            CAREVIA Order Commission ({store.platformSettings.pharmacyCommissionPct}%)
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-warning-foreground">
            -{formatINR(commissionAmt)}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-xs text-muted-foreground">
            Subscription Plan ({pharmacy.subscriptionPlan})
          </p>
          <p className="mt-2 font-display text-2xl font-bold">{formatINR(planFee)}/mo</p>
        </div>
        <div className="rounded-2xl border bg-mint-soft p-5">
          <p className="text-xs font-semibold text-primary">Net Pharmacy Payout (Demo)</p>
          <p className="mt-2 font-display text-2xl font-bold text-primary">
            {formatINR(Math.max(0, grossSales - commissionAmt))}
          </p>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        {/* Pharmacy Registration & License Details */}
        <section className="rounded-2xl border bg-card p-6">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <FileCheck2 className="h-5 w-5 text-primary" /> Registration &amp; License Details
          </h3>
          <form
            className="mt-4 space-y-3.5"
            onSubmit={(e) => {
              e.preventDefault();
              store.updatePharmacyDetails(pharmacy.id, {
                name: storeName.trim(),
                licenseNumber: licenseNo.trim(),
                openHours: openHours.trim(),
              });
              toast.success("Pharmacy license & profile updated");
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="ph-name">Pharmacy Name</Label>
              <Input
                id="ph-name"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ph-lic">Drug License Number</Label>
              <Input
                id="ph-lic"
                value={licenseNo}
                onChange={(e) => setLicenseNo(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ph-hrs">Operating Hours</Label>
              <Input
                id="ph-hrs"
                value={openHours}
                onChange={(e) => setOpenHours(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ph-plan">Partner Subscription Plan</Label>
              <select
                id="ph-plan"
                value={pharmacy.subscriptionPlan}
                onChange={(e) =>
                  store.updatePharmacyDetails(pharmacy.id, {
                    subscriptionPlan: e.target.value as typeof pharmacy.subscriptionPlan,
                  })
                }
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {PHARMACY_PLANS.map((pl) => (
                  <option key={pl.name} value={pl.name}>
                    {pl.name} ({formatINR(pl.monthlyInr)}/mo)
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={pharmacy.premiumListing}
                onChange={(e) =>
                  store.updatePharmacyDetails(pharmacy.id, { premiumListing: e.target.checked })
                }
              />
              Featured Visibility Plan (+{formatINR(store.platformSettings.premiumListingInr)}/mo)
            </label>
            <Button type="submit" className="w-full rounded-full">
              <Building2 className="h-4 w-4" /> Save Pharmacy Details
            </Button>
          </form>
        </section>

        {/* Order Acceptance & Processing */}
        <section className="rounded-2xl border bg-card p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <Truck className="h-5 w-5 text-primary" /> Order Acceptance &amp; Fulfilment (
              {pharmOrders.length})
            </h3>
            <DemoBadge>Live POS not connected</DemoBadge>
          </div>
          {pharmOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No orders routed to {pharmacy.name} yet. Place a checkout order selecting this
              pharmacy to test order acceptance and stage processing.
            </p>
          ) : (
            <div className="space-y-3">
              {pharmOrders.map((o) => {
                const done = o.stage >= o.stages.length - 1;
                return (
                  <div
                    key={o.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-soft p-4 text-sm"
                  >
                    <div>
                      <strong>{o.id}</strong> · {o.address.name} · {formatINR(o.total)}
                      <p className="text-xs text-muted-foreground">
                        Current Stage: <strong>{o.stages[o.stage]}</strong> · {o.etaLabel}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      disabled={done}
                      onClick={() => {
                        store.advanceOrder(o.id);
                        toast.success(`Order ${o.id} advanced`);
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {done ? "Delivered" : o.stage === 0 ? "Accept & Advance" : "Next Stage"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Inventory & Pricing Management */}
      <section className="rounded-2xl border bg-card p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Package className="h-5 w-5 text-primary" /> Medicine Inventory, Stock &amp; Pricing
          Editor
        </h3>
        <div
          className="table-wrapper max-h-[420px] rounded-xl border"
          tabIndex={0}
          role="region"
          aria-label="Pharmacy inventory table"
        >
          <table className="carevia-table responsive-stack text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                <th className="p-3">Medicine / Product</th>
                <th className="p-3">Rx</th>
                <th className="p-3">Stock Qty</th>
                <th className="p-3">Store Price (₹)</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 14).map((prod) => {
                const stock = pharmacy.inventory[prod.id] ?? 0;
                const price = pharmacy.priceOverrides?.[prod.id] ?? prod.price;
                return (
                  <tr key={prod.id} className="border-b">
                    <td className="p-3 font-medium" data-label="Product">
                      {prod.name}
                    </td>
                    <td className="p-3" data-label="Rx">
                      {prod.rx ? "Rx" : "OTC"}
                    </td>
                    <td className="p-3" data-label="Stock Qty">
                      <Input
                        type="number"
                        min={0}
                        value={stock}
                        aria-label={`Stock for ${prod.name}`}
                        onChange={(e) =>
                          store.updatePharmacyInventory(
                            pharmacy.id,
                            prod.id,
                            Number(e.target.value),
                            price,
                          )
                        }
                        className="h-8 w-24"
                      />
                    </td>
                    <td className="p-3" data-label="Price (₹)">
                      <Input
                        type="number"
                        min={1}
                        value={price}
                        aria-label={`Price for ${prod.name}`}
                        onChange={(e) =>
                          store.updatePharmacyInventory(
                            pharmacy.id,
                            prod.id,
                            stock,
                            Number(e.target.value),
                          )
                        }
                        className="h-8 w-24"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
