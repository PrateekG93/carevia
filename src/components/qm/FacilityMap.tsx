import { useEffect, useRef } from "react";
import type { Facility } from "@/lib/places";
export function FacilityMap({
  lat,
  lon,
  facilities,
  onSelect,
}: {
  lat: number;
  lon: number;
  facilities: Facility[];
  onSelect: (f: Facility) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    void Promise.all([import("leaflet"), import("leaflet/dist/leaflet.css")]).then(([L]) => {
      if (disposed || !ref.current) return;
      const map = L.map(ref.current).setView([lat, lon], 13);
      cleanup = () => map.remove();
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);
      L.circleMarker([lat, lon], { radius: 8 }).addTo(map).bindTooltip("Search location");
      const bounds = L.latLngBounds([[lat, lon]]);
      facilities.forEach((f) => {
        const marker = L.circleMarker([f.lat, f.lon], { radius: 7 }).addTo(map);
        const el = document.createElement("span");
        el.textContent = f.name;
        marker.bindTooltip(el).on("click", () => onSelect(f));
        bounds.extend([f.lat, f.lon]);
      });
      if (facilities.length) map.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 });
    });
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [lat, lon, facilities, onSelect]);
  return (
    <div
      ref={ref}
      className="relative z-0 h-[440px] w-full rounded-lg border"
      aria-label="Map of nearby healthcare facilities"
    />
  );
}
