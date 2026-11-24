import { haversineKm } from "./places";

export type PartnerPharmacy = {
  id: string;
  name: string;
  licenseNumber: string;
  verified: boolean;
  lat: number;
  lon: number;
  area: string;
  openHours: string;
  subscriptionPlan: "Starter" | "Growth" | "Enterprise";
  premiumListing: boolean;
  /** Stock count per medicine ID */
  inventory: Record<string, number>;
  /** Optional pharmacy-specific price overrides in INR */
  priceOverrides?: Record<string, number>;
};

export type DeliveryEstimate = {
  distanceKm: number;
  withinPrimaryRadius: boolean;
  qualifiesFor30Min: boolean;
  etaLabel: string;
  minMinutes: number;
  maxMinutes: number;
  extraDistanceCharge: number;
  radiusTierLabel: string;
};

export const PRIMARY_RADIUS_KM = 5;
export const EXPANDED_RADII_KM = [5, 10, 20, 35] as const;

export const DEFAULT_USER_COORDS = {
  label: "Mahapura, Jaipur (Sample location)",
  lat: 26.8375,
  lon: 75.6766,
};

/**
 * Sample partner pharmacies positioned across <5 km, 5–10 km, and 10–25 km
 * around Mahapura, Jaipur default coordinates, or dynamically anchored relative to
 * any user location when real pharmacy geolocation isn't connected.
 */
export function getPartnerPharmaciesForLocation(lat: number, lon: number): PartnerPharmacy[] {
  const mkCoords = (dLat: number, dLon: number) => ({
    lat: Number((lat + dLat).toFixed(5)),
    lon: Number((lon + dLon).toFixed(5)),
  });

  return [
    {
      id: "pharm-1",
      name: "Mahapura CarePlus Pharmacy",
      licenseNumber: "DL-RJ-JPR-20491 (Demo)",
      verified: true,
      ...mkCoords(0.011, 0.008), // ~1.5 km
      area: "1.5 km away · Mahapura Ajmer Road",
      openHours: "07:00 – 23:00",
      subscriptionPlan: "Growth",
      premiumListing: true,
      inventory: {
        "paracetamol-500": 45,
        "ibuprofen-400": 22,
        "cough-syrup": 14,
        "cetirizine-10": 30,
        "ors-sachet": 40,
        "antacid-syrup": 18,
        "pantoprazole-40": 25,
        "azithromycin-500": 12,
        "bandage-roll": 28,
        "antiseptic-solution": 20,
        "cotton-roll": 35,
        thermometer: 10,
        "surgical-gloves": 24,
        "gauze-pads": 32,
        "medical-tape": 19,
        "first-aid-scissors": 9,
        "burn-dressings": 12,
        "face-masks": 80,
        "vitamin-c": 20,
        multivitamin: 15,
        "hand-sanitizer": 30,
      },
    },
    {
      id: "pharm-2",
      name: "GreenLeaf 24x7 Chemists (Bhankrota)",
      licenseNumber: "DL-RJ-JPR-31802 (Demo)",
      verified: true,
      ...mkCoords(-0.024, 0.019), // ~3.4 km
      area: "3.4 km away · Bhankrota Express Zone",
      openHours: "Open 24 hours",
      subscriptionPlan: "Enterprise",
      premiumListing: false,
      inventory: {
        "paracetamol-500": 80,
        "ibuprofen-400": 35,
        "steam-capsules": 16,
        "cetirizine-10": 50,
        "ors-sachet": 70,
        "pantoprazole-40": 18,
        "azithromycin-500": 20,
        "bandage-roll": 40,
        "antiseptic-solution": 30,
        "cotton-roll": 45,
        thermometer: 14,
        "surgical-gloves": 30,
        "gauze-pads": 26,
        "medical-tape": 22,
        "burn-dressings": 8,
        "face-masks": 100,
        "vitamin-c": 25,
        "vitamin-d3": 4,
        "bp-monitor": 5,
        moisturiser: 12,
      },
      priceOverrides: {
        "paracetamol-500": 28,
        thermometer: 189,
      },
    },
    {
      id: "pharm-3",
      name: "Mansarovar MetroMed Pharmacy",
      licenseNumber: "DL-RJ-JPR-11944 (Demo)",
      verified: true,
      ...mkCoords(0.058, -0.042), // ~7.9 km (Search Further tier 1)
      area: "7.9 km away · Extended Zone",
      openHours: "08:00 – 22:00",
      subscriptionPlan: "Growth",
      premiumListing: false,
      inventory: {
        "paracetamol-500": 120,
        "diclofenac-gel": 15, // Unavailable in 5km, available via Search Further!
        "pulse-oximeter": 11, // Unavailable in 5km, available via Search Further!
        "vitamin-d3": 24,
        "first-aid-scissors": 18,
        "burn-dressings": 20,
        "surgical-gloves": 50,
        "gauze-pads": 60,
        "bp-monitor": 7,
        "azithromycin-500": 30,
        "pantoprazole-40": 40,
        "cough-syrup": 25,
        "hand-sanitizer": 40,
      },
      priceOverrides: {
        "diclofenac-gel": 115,
        "pulse-oximeter": 999,
      },
    },
    {
      id: "pharm-4",
      name: "Jaipur Apex Health Depot",
      licenseNumber: "DL-RJ-JPR-55210 (Demo)",
      verified: false, // Pending admin license check
      ...mkCoords(-0.11, 0.085), // ~15.3 km (Search Further tier 2)
      area: "15.3 km away · Outer Jaipur Hub",
      openHours: "09:00 – 21:00",
      subscriptionPlan: "Starter",
      premiumListing: false,
      inventory: {
        "paracetamol-500": 200,
        "diclofenac-gel": 25,
        "pulse-oximeter": 19,
        "first-aid-kit": 14,
        "bp-monitor": 12,
        thermometer: 25,
        "medical-tape": 40,
        "antiseptic-solution": 50,
        "cotton-roll": 80,
        "face-masks": 150,
        "vitamin-d3": 30,
        multivitamin: 40,
      },
    },
  ];
}

/**
 * Computes honest delivery estimates and distance surcharges.
 * Strictly forbids promising 30-minute delivery when distance > 5 km or out of stock.
 */
export function estimatePharmacyDelivery(
  userCoords: { lat: number; lon: number },
  pharmacyCoords: { lat: number; lon: number },
  inStock = true,
): DeliveryEstimate {
  const distanceKm = Number(haversineKm(userCoords, pharmacyCoords).toFixed(1));
  const withinPrimaryRadius = distanceKm <= PRIMARY_RADIUS_KM;

  if (!inStock) {
    return {
      distanceKm,
      withinPrimaryRadius,
      qualifiesFor30Min: false,
      etaLabel: "Currently out of stock at this pharmacy",
      minMinutes: 0,
      maxMinutes: 0,
      extraDistanceCharge: 0,
      radiusTierLabel: withinPrimaryRadius ? "Within 5 km" : "Extended radius",
    };
  }

  if (withinPrimaryRadius) {
    const minMinutes = Math.max(20, Math.round(18 + distanceKm * 3));
    const maxMinutes = Math.max(30, minMinutes + 10);
    return {
      distanceKm,
      withinPrimaryRadius: true,
      qualifiesFor30Min: maxMinutes <= 35,
      etaLabel:
        maxMinutes <= 35
          ? "As fast as 30 mins (25–35 mins est.)"
          : `${minMinutes}–${maxMinutes} mins est.`,
      minMinutes,
      maxMinutes,
      extraDistanceCharge: 0,
      radiusTierLabel: "Within 5 km",
    };
  }

  if (distanceKm <= 10) {
    return {
      distanceKm,
      withinPrimaryRadius: false,
      qualifiesFor30Min: false,
      etaLabel: "45–65 mins est. (Extended distance)",
      minMinutes: 45,
      maxMinutes: 65,
      extraDistanceCharge: 30,
      radiusTierLabel: "5–10 km (Search Further)",
    };
  }

  if (distanceKm <= 20) {
    return {
      distanceKm,
      withinPrimaryRadius: false,
      qualifiesFor30Min: false,
      etaLabel: "65–95 mins est. (Extended distance)",
      minMinutes: 65,
      maxMinutes: 95,
      extraDistanceCharge: 60,
      radiusTierLabel: "10–20 km (Search Further)",
    };
  }

  return {
    distanceKm,
    withinPrimaryRadius: false,
    qualifiesFor30Min: false,
    etaLabel: "95–130 mins est. (Long-distance dispatch)",
    minMinutes: 95,
    maxMinutes: 130,
    extraDistanceCharge: 90,
    radiusTierLabel: ">20 km (Search Further)",
  };
}

export type PharmacyOffer = {
  pharmacy: PartnerPharmacy;
  stock: number;
  unitPrice: number;
  estimate: DeliveryEstimate;
};

export function findMedicineAcrossPharmacies(
  productId: string,
  basePrice: number,
  userCoords: { lat: number; lon: number },
  maxRadiusKm: number,
  customPharmacies?: PartnerPharmacy[],
): PharmacyOffer[] {
  const list = customPharmacies ?? getPartnerPharmaciesForLocation(userCoords.lat, userCoords.lon);
  return list
    .map((pharmacy) => {
      const stock = pharmacy.inventory[productId] ?? 0;
      const unitPrice = pharmacy.priceOverrides?.[productId] ?? basePrice;
      const estimate = estimatePharmacyDelivery(userCoords, pharmacy, stock > 0);
      return { pharmacy, stock, unitPrice, estimate };
    })
    .filter((offer) => offer.estimate.distanceKm <= maxRadiusKm)
    .sort((a, b) => {
      if ((b.stock > 0 ? 1 : 0) !== (a.stock > 0 ? 1 : 0)) {
        return (b.stock > 0 ? 1 : 0) - (a.stock > 0 ? 1 : 0);
      }
      return a.estimate.distanceKm - b.estimate.distanceKm;
    });
}
