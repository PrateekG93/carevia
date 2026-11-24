// Real nearby-facility search using public OpenStreetMap services (no API key needed).
// Data is community-maintained: we only show phone numbers / hours that exist in OSM.

export type Facility = {
  id: string;
  name: string;
  kind: "Hospital" | "Clinic" | "Doctor";
  specialty?: string | undefined;
  lat: number;
  lon: number;
  address?: string | undefined;
  phone?: string | undefined;
  hours?: string | undefined;
  distanceKm: number;
  demo?: boolean | undefined;
};

export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * Generates progressive geocoding query candidates so multi-part campus or landmark
 * addresses (e.g. "JK LAKSHMIPAT UNIVERSITY,mahapura, jaipur") fall back cleanly
 * to their area/city segments ("mahapura, jaipur", "jaipur") when Nominatim lacks
 * the exact building string.
 */
export function buildGeocodeQueries(rawQuery: string): string[] {
  const cleaned = rawQuery.trim().replace(/\s+/g, " ");
  if (!cleaned) return [];
  const candidates: string[] = [cleaned];
  const parts = cleaned
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  for (let i = 1; i < parts.length; i++) {
    const sub = parts.slice(i).join(", ");
    if (sub.length >= 3 && !candidates.includes(sub)) {
      candidates.push(sub);
    }
  }
  return candidates;
}

export async function geocode(q: string): Promise<{ lat: number; lon: number; label: string }> {
  const queries = buildGeocodeQueries(q);
  for (const candidate of queries) {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(candidate)}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) continue;
    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;
    if (data.length > 0 && data[0]) {
      const matchedLabel = data[0].display_name.split(",").slice(0, 3).join(",").trim();
      return {
        lat: +data[0].lat,
        lon: +data[0].lon,
        label:
          candidate === queries[0]
            ? matchedLabel
            : `${matchedLabel} (near ${q.split(",")[0]?.trim()})`,
      };
    }
  }
  throw new Error("We couldn't find that place. Try a city name, area, or PIN code.");
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`,
    );
    const d = await res.json();
    const a = d.address ?? {};
    return (
      [a.suburb || a.neighbourhood || a.town, a.city || a.state_district, a.postcode]
        .filter(Boolean)
        .join(", ") || "Current location"
    );
  } catch {
    return "Current location";
  }
}

async function findFacilitiesViaOverpass(
  lat: number,
  lon: number,
  radiusKm: number,
): Promise<Facility[]> {
  const r = Math.round(radiusKm * 1000);
  const q = `[out:json][timeout:12];(
    nwr["amenity"~"^(hospital|clinic|doctors)$"](around:${r},${lat},${lon});
    nwr["healthcare"~"^(hospital|clinic|doctor)$"](around:${r},${lat},${lon});
  );out center tags 80;`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: "data=" + encodeURIComponent(q),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error("Overpass unavailable");
    const text = await res.text();
    if (!text.trim().startsWith("{")) throw new Error("Invalid Overpass payload");
    const data = JSON.parse(text);
    const seen = new Set<string>();
    const out: Facility[] = [];
    for (const el of data.elements ?? []) {
      const t = el.tags ?? {};
      const name = t.name || t["name:en"];
      const flat = el.lat ?? el.center?.lat;
      const flon = el.lon ?? el.center?.lon;
      if (!name || flat == null || seen.has(name)) continue;
      seen.add(name);
      const am = t.amenity || t.healthcare;
      const kind = am === "hospital" ? "Hospital" : am === "clinic" ? "Clinic" : "Doctor";
      const addr = [
        t["addr:housenumber"],
        t["addr:street"],
        t["addr:suburb"],
        t["addr:city"],
        t["addr:postcode"],
      ]
        .filter(Boolean)
        .join(", ");
      out.push({
        id: `${el.type}-${el.id}`,
        name,
        kind,
        specialty: t["healthcare:speciality"]?.replace(/_/g, " ").replace(/;/g, ", "),
        lat: flat,
        lon: flon,
        address: addr || undefined,
        phone: t.phone || t["contact:phone"],
        hours: t.opening_hours,
        distanceKm: haversineKm({ lat, lon }, { lat: flat, lon: flon }),
      });
    }
    return out.sort((a, b) => a.distanceKm - b.distanceKm);
  } finally {
    clearTimeout(timer);
  }
}

async function findFacilitiesViaNominatim(
  lat: number,
  lon: number,
  radiusKm: number,
): Promise<Facility[]> {
  const latDelta = Math.max(radiusKm / 111, 0.045);
  const lonDelta = Math.max(radiusKm / (111 * Math.cos((lat * Math.PI) / 180)), 0.045);
  const viewbox = `${lon - lonDelta},${lat + latDelta},${lon + lonDelta},${lat - latDelta}`;

  const queries: Array<{ q: string; fallbackKind: Facility["kind"] }> = [
    { q: "hospital", fallbackKind: "Hospital" },
    { q: "clinic", fallbackKind: "Clinic" },
  ];

  const results = await Promise.all(
    queries.map(async ({ q, fallbackKind }) => {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&extratags=1&limit=25&bounded=1&viewbox=${viewbox}&q=${q}`,
        { headers: { Accept: "application/json" } },
      );
      if (!res.ok) return [];
      const rows = (await res.json()) as Array<{
        place_id: number;
        osm_type?: string;
        osm_id?: number;
        name?: string;
        display_name: string;
        lat: string;
        lon: string;
        class?: string;
        type?: string;
        extratags?: Record<string, string>;
      }>;
      return rows.map((r) => ({ r, fallbackKind }));
    }),
  );

  const seen = new Set<string>();
  const out: Facility[] = [];
  for (const { r, fallbackKind } of results.flat()) {
    const rawName = r.name?.trim() || r.display_name.split(",")[0]?.trim();
    if (!rawName || seen.has(rawName.toLowerCase())) continue;
    const isMedical =
      r.class === "amenity" ||
      r.class === "healthcare" ||
      r.type === "hospital" ||
      r.type === "clinic" ||
      r.type === "doctors";
    if (!isMedical) continue;

    const flat = +r.lat;
    const flon = +r.lon;
    const distanceKm = haversineKm({ lat, lon }, { lat: flat, lon: flon });
    if (distanceKm > radiusKm) continue;

    seen.add(rawName.toLowerCase());
    const kind: Facility["kind"] =
      r.type === "hospital" ? "Hospital" : r.type === "doctors" ? "Doctor" : fallbackKind;
    const parts = r.display_name
      .split(",")
      .map((s) => s.trim())
      .slice(1, 5);

    out.push({
      id: `${r.osm_type ?? "osm"}-${r.osm_id ?? r.place_id}`,
      name: rawName,
      kind,
      specialty: r.extratags?.["healthcare:speciality"]?.replace(/_/g, " ").replace(/;/g, ", "),
      lat: flat,
      lon: flon,
      address: parts.join(", ") || undefined,
      phone: r.extratags?.["phone"] || r.extratags?.["contact:phone"],
      hours: r.extratags?.["opening_hours"],
      distanceKm,
    });
  }
  return out.sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Fetches genuine nearby hospitals, clinics, and doctors from OpenStreetMap.
 * Uses Nominatim bounded search (fast, reliable) and merges Overpass results when available.
 */
export async function findFacilities(
  lat: number,
  lon: number,
  radiusKm: number,
): Promise<Facility[]> {
  const [nominatimRes, overpassRes] = await Promise.allSettled([
    findFacilitiesViaNominatim(lat, lon, radiusKm),
    findFacilitiesViaOverpass(lat, lon, radiusKm),
  ]);

  const combined: Facility[] = [];
  const seen = new Set<string>();

  for (const res of [overpassRes, nominatimRes]) {
    if (res.status === "fulfilled") {
      for (const f of res.value) {
        const key = f.name.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          combined.push(f);
        }
      }
    }
  }

  if (
    combined.length === 0 &&
    nominatimRes.status === "rejected" &&
    overpassRes.status === "rejected"
  ) {
    throw new Error("The nearby search service is busy. Please try again shortly.");
  }

  return combined.sort((a, b) => a.distanceKm - b.distanceKm);
}

export function demoFacilities(lat: number, lon: number): Facility[] {
  const mk = (
    i: number,
    name: string,
    kind: Facility["kind"],
    specialty: string,
    dLat: number,
    dLon: number,
  ): Facility => {
    const f = { lat: lat + dLat, lon: lon + dLon };
    return {
      id: "demo-" + i,
      name,
      kind,
      specialty,
      ...f,
      address: "Mahapura area address",
      distanceKm: haversineKm({ lat, lon }, f),
      demo: true,
    };
  };
  return [
    mk(1, "Family Care Clinic", "Clinic", "general", 0.008, 0.006),
    mk(2, "City General Hospital", "Hospital", "general, emergency", -0.015, 0.01),
    mk(3, "Skin Care Centre", "Clinic", "dermatology", 0.02, -0.012),
    mk(4, "Children's Care Clinic", "Doctor", "paediatrics", -0.006, -0.018),
  ].sort((a, b) => a.distanceKm - b.distanceKm);
}

export const directionsUrl = (f: { lat: number; lon: number }) =>
  `https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lon}`;

export const telHref = (phone: string) =>
  "tel:" + (phone.split(/[;,]/)[0] ?? "").replace(/[^\d+]/g, "");
