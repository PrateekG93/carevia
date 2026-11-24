import { products, type Product } from "./data";
import {
  findMedicineAcrossPharmacies,
  PRIMARY_RADIUS_KM,
  type PartnerPharmacy,
  type PharmacyOffer,
} from "./delivery";

export type ExtractedRxItem = {
  id: string;
  writtenText: string;
  dosageHint?: string | undefined;
  matchedProduct: Product | null;
  availableWithin5Km: boolean;
  availableExtended: boolean;
  bestOffer: PharmacyOffer | null;
  extendedOffer: PharmacyOffer | null;
};

/**
 * Extracts readable medicine-like lines from a raw prescription text block
 * (or embedded PDF text stream). Filters out headers, dates, and clinic metadata.
 */
export function parsePrescriptionLines(rawText: string): string[] {
  const lines = rawText
    .split(/\r?\n|,|;/)
    .map((l) =>
      l
        .replace(/^\s*\d+[.)]\s*/, "")
        .replace(/^[-•*]\s*/, "")
        .trim(),
    )
    .filter((l) => l.length >= 3);

  const ignorePattern =
    /^(dr\.|patient|date|age|sex|rx|clinic|hospital|address|phone|signature|mahapura|jaipur)/i;
  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    if (ignorePattern.test(line)) continue;
    const key = line.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(line);
    }
  }
  return deduped;
}

/**
 * Attempts to read printable text lines from a browser File (e.g. uncompressed PDF text).
 * Returns null when the file is a raster image or binary/compressed PDF requiring external OCR.
 */
export async function extractReadableTextFromFile(file: File): Promise<string | null> {
  if (file.type !== "application/pdf") return null;
  try {
    const buf = await file.arrayBuffer();
    const raw = new TextDecoder("latin1").decode(buf);
    const matches = raw.match(/\(([^()]{3,80})\)/g) ?? [];
    const cleaned = matches
      .map((m) =>
        m
          .slice(1, -1)
          .replace(/\\[()\\]/g, "")
          .trim(),
      )
      .filter((s) => /[a-zA-Z]{3,}/.test(s) && !/^(PDF|Font|Obj|Type|Page)/i.test(s));
    if (cleaned.length >= 2) {
      return cleaned.join("\n");
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Matches a single prescription item string against the CAREVIA product catalog.
 */
export function matchProductFromRxLine(line: string): Product | null {
  const norm = line.toLowerCase();
  // Exact or strong token match against product name, genericName, or id keywords
  let best: { product: Product; score: number } | null = null;

  for (const p of products) {
    let score = 0;
    const nameTokens = p.name
      .toLowerCase()
      .split(/\s+/)
      .filter(
        (t) =>
          t.length >= 3 &&
          !["tablets", "tablet", "syrup", "capsules", "pack", "roll", "home"].includes(t),
      );

    for (const tok of nameTokens) {
      if (norm.includes(tok)) score += 3;
    }
    if (p.genericName) {
      for (const gtok of p.genericName.toLowerCase().split(/\s+/)) {
        if (gtok.length >= 3 && norm.includes(gtok)) score += 3;
      }
    }
    if (norm.includes("ors") && p.id === "ors-sachet") score += 4;
    if (norm.includes("dolo") && p.id === "paracetamol-500") score += 4;
    if (norm.includes("crocin") && p.id === "paracetamol-500") score += 4;
    if (norm.includes("pan 40") && p.id === "pantoprazole-40") score += 4;
    if (norm.includes("azithral") && p.id === "azithromycin-500") score += 4;
    if (norm.includes("volini") && p.id === "diclofenac-gel") score += 4;

    if (p.strength) {
      const num = p.strength.match(/\d+/)?.[0];
      if (num && norm.includes(num) && score > 0) score += 2;
    }

    if (score > 0 && (!best || score > best.score)) {
      best = { product: p, score };
    }
  }

  return best && best.score >= 3 ? best.product : null;
}

/**
 * Matches all parsed prescription lines to CAREVIA products and checks availability
 * in pharmacies within 5 km as well as extended Search Further radius (up to 35 km).
 */
export function evaluatePrescriptionAvailability(
  lines: string[],
  userCoords: { lat: number; lon: number },
  pharmacies: PartnerPharmacy[],
): ExtractedRxItem[] {
  return lines.map((line, index) => {
    const matched = matchProductFromRxLine(line);
    const dosageMatch = line.match(/\b(\d+\s*(?:mg|ml|mcg|iu|g)|\d+-\d+-\d+|bd|od|tds|sos)\b/i);

    if (!matched) {
      return {
        id: `rx-item-${index}`,
        writtenText: line,
        dosageHint: dosageMatch?.[0],
        matchedProduct: null,
        availableWithin5Km: false,
        availableExtended: false,
        bestOffer: null,
        extendedOffer: null,
      };
    }

    const within5 = findMedicineAcrossPharmacies(
      matched.id,
      matched.price,
      userCoords,
      PRIMARY_RADIUS_KM,
      pharmacies,
    );
    const stocked5 = within5.find((o) => o.stock > 0) ?? null;

    const within35 = findMedicineAcrossPharmacies(
      matched.id,
      matched.price,
      userCoords,
      35,
      pharmacies,
    );
    const stockedExtended = within35.find((o) => o.stock > 0) ?? null;

    return {
      id: `rx-item-${index}`,
      writtenText: line,
      dosageHint: dosageMatch?.[0],
      matchedProduct: matched,
      availableWithin5Km: !!stocked5,
      availableExtended: !!stockedExtended,
      bestOffer: stocked5,
      extendedOffer: stockedExtended,
    };
  });
}

export const SAMPLE_RX_PRESETS = [
  {
    label: "Fever & Infection Rx (Sample)",
    text: "Paracetamol 500 mg (1-0-1 after food)\nAzithromycin 500 mg (OD for 3 days)\nPantoprazole 40 mg (Before breakfast)\nOral Rehydration Salts (ORS sachet)",
  },
  {
    label: "Cold, Cough & Pain Rx (Sample)",
    text: "Cetirizine 10 mg (1 tablet at bedtime)\nHerbal Cough Syrup (10 ml twice daily)\nDiclofenac Pain Relief Gel (Apply locally)\nVitamin C 500 mg (1 daily)",
  },
] as const;
