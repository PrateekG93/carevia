import { describe, it, expect } from "vitest";
import { assessSymptoms } from "@/lib/symptoms";
import { uploadError, bookingError } from "@/lib/safety";
import { demoFacilities, buildGeocodeQueries, telHref } from "@/lib/places";
import {
  DEFAULT_USER_COORDS,
  estimatePharmacyDelivery,
  findMedicineAcrossPharmacies,
  PRIMARY_RADIUS_KM,
} from "@/lib/delivery";
import { addMinutesToTime, buildDoseScheduleForDate, validateReminderInput } from "@/lib/reminders";
import { doctors, products } from "@/lib/data";
import { getPartnerPharmaciesForLocation } from "@/lib/delivery";
import { evaluatePrescriptionAvailability, parsePrescriptionLines } from "@/lib/prescription";
import { isRequestAbortError } from "@/lib/error-capture";

describe("Medical safety", () => {
  it.each(["difficulty breathing", "unconsciousness", "new confusion", "seizures", "chest pain"])(
    "directs %s to emergency care",
    (symptom) => {
      expect(assessSymptoms(symptom).level).toBe("emergency");
    },
  );
  it("directs high fever to professional assessment", () => {
    expect(assessSymptoms("high fever").level).toBe("see-doctor");
  });
  it("does not prescribe from common symptoms", () => {
    const result = assessSymptoms("cough and cold");
    expect(result.level).toBe("self-care");
    expect(result.points.join(" ")).not.toMatch(/azithromycin|pantoprazole|antibiotic/i);
  });
});

describe("File and booking validation", () => {
  it("rejects unsupported image types", () =>
    expect(uploadError({ type: "text/html", size: 100 })).not.toBeNull());
  it("limits upload size to 5 MB", () => {
    expect(uploadError({ type: "image/png", size: 5 * 1024 * 1024 })).toBeNull();
    expect(uploadError({ type: "image/png", size: 5 * 1024 * 1024 + 1 })).not.toBeNull();
  });
  it("only accepts PDFs as prescriptions", () => {
    expect(uploadError({ type: "application/pdf", size: 100 }, true)).toBeNull();
    expect(uploadError({ type: "application/pdf", size: 100 }, false)).not.toBeNull();
  });
  it("does not book a past appointment", () =>
    expect(
      bookingError("2020-01-01", "09:00", "Sample User", "9876543210", ["09:00"]),
    ).not.toBeNull());
  it("rejects unavailable slots", () =>
    expect(
      bookingError("2099-01-01", "09:00", "Sample User", "9876543210", ["10:00"]),
    ).not.toBeNull());
  it("allows future available sample appointments", () =>
    expect(bookingError("2099-01-01", "09:00", "Sample User", "9876543210", ["09:00"])).toBeNull());
  it("keeps fictional facility contacts absent and avoids Sample wording in hospital names", () => {
    const rows = demoFacilities(19, 72);
    expect(rows).toHaveLength(4);
    expect(rows.every((f) => f.demo && !f.phone && !f.hours && !/sample/i.test(f.name))).toBe(true);
  });
  it("builds progressive geocoding fallbacks for multi-part campus addresses", () => {
    const queries = buildGeocodeQueries("JK LAKSHMIPAT UNIVERSITY,mahapura, jaipur");
    expect(queries).toEqual([
      "JK LAKSHMIPAT UNIVERSITY,mahapura, jaipur",
      "mahapura, jaipur",
      "jaipur",
    ]);
  });
  it("uses only the listed first telephone number", () =>
    expect(telHref("+91 12345 67890; +91 99999 99999")).toBe("tel:+911234567890"));
});

describe("CAREVIA delivery radius and Search Further rules", () => {
  it("only qualifies pharmacies within 5 km and in stock for 30-minute target", () => {
    const near = estimatePharmacyDelivery(
      DEFAULT_USER_COORDS,
      { lat: DEFAULT_USER_COORDS.lat + 0.01, lon: DEFAULT_USER_COORDS.lon + 0.01 },
      true,
    );
    expect(near.withinPrimaryRadius).toBe(true);
    expect(near.qualifiesFor30Min).toBe(true);
    expect(near.extraDistanceCharge).toBe(0);

    const far = estimatePharmacyDelivery(
      DEFAULT_USER_COORDS,
      { lat: DEFAULT_USER_COORDS.lat + 0.06, lon: DEFAULT_USER_COORDS.lon - 0.04 },
      true,
    );
    expect(far.withinPrimaryRadius).toBe(false);
    expect(far.qualifiesFor30Min).toBe(false);
    expect(far.etaLabel).not.toMatch(/30\s*min/i);
    expect(far.extraDistanceCharge).toBeGreaterThan(0);
  });

  it("finds locally out-of-stock medicines only when Search Further expands past 5 km", () => {
    const within5 = findMedicineAcrossPharmacies(
      "diclofenac-gel",
      110,
      DEFAULT_USER_COORDS,
      PRIMARY_RADIUS_KM,
    );
    expect(within5.some((o) => o.stock > 0)).toBe(false);

    const expanded = findMedicineAcrossPharmacies("diclofenac-gel", 110, DEFAULT_USER_COORDS, 20);
    const stocked = expanded.find((o) => o.stock > 0);
    expect(stocked).toBeDefined();
    expect(stocked!.estimate.qualifiesFor30Min).toBe(false);
    expect(stocked!.estimate.extraDistanceCharge).toBeGreaterThan(0);
  });
});

describe("CAREVIA medicine reminders and First Aid catalog", () => {
  it("validates reminder date ranges and timings", () => {
    expect(
      validateReminderInput({
        medicineName: "Paracetamol",
        dosage: "1 tablet",
        frequency: "Once daily",
        startDate: "2026-11-10",
        endDate: "2026-11-05",
        timings: ["08:00"],
        mealInstruction: "After food",
      }),
    ).not.toBeNull();
  });

  it("computes snooze times and missed doses accurately", () => {
    expect(addMinutesToTime("23:50", 15)).toBe("00:05");
    const schedule = buildDoseScheduleForDate(
      [
        {
          id: "R1",
          medicineName: "Test Med",
          dosage: "1 tab",
          frequency: "Twice daily",
          startDate: "2026-11-01",
          endDate: "2026-11-30",
          timings: ["07:00", "21:00"],
          mealInstruction: "Before food",
        },
      ],
      "2026-11-24",
      {},
      new Date("2026-11-24T12:00:00"),
    );
    expect(schedule[0]?.status).toBe("missed");
    expect(schedule[1]?.status).toBe("upcoming");
  });

  it("includes 10 First Aid essentials each with a unique product image", () => {
    const firstAid = products.filter((p) => p.firstAidEssential);
    expect(firstAid).toHaveLength(10);
    const uniqueImages = new Set(firstAid.map((p) => p.image));
    expect(uniqueImages.size).toBe(10);
  });

  it("places all doctors in Jaipur and primarily near Mahapura, Jaipur", () => {
    expect(doctors.every((d) => /jaipur/i.test(d.city))).toBe(true);
    expect(
      doctors.filter((d) => /mahapura/i.test(d.clinicName) || /mahapura/i.test(d.city)).length,
    ).toBeGreaterThanOrEqual(4);
    expect(doctors.every((d) => d.medicalCouncil === "Rajasthan Medical Council")).toBe(true);
  });

  it("parses prescription items and reports 5 km vs extended-radius availability", () => {
    const lines = parsePrescriptionLines(
      "Dr. Aarav Sharma\n1. Paracetamol 500 mg (1-0-1)\n2. Diclofenac Pain Relief Gel\n3. Unknown Syrup XYZ",
    );
    expect(lines).toEqual([
      "Paracetamol 500 mg (1-0-1)",
      "Diclofenac Pain Relief Gel",
      "Unknown Syrup XYZ",
    ]);
    const pharmacies = getPartnerPharmaciesForLocation(
      DEFAULT_USER_COORDS.lat,
      DEFAULT_USER_COORDS.lon,
    );
    const evaluated = evaluatePrescriptionAvailability(lines, DEFAULT_USER_COORDS, pharmacies);
    expect(evaluated[0]?.matchedProduct?.id).toBe("paracetamol-500");
    expect(evaluated[0]?.availableWithin5Km).toBe(true);
    expect(evaluated[1]?.matchedProduct?.id).toBe("diclofenac-gel");
    expect(evaluated[1]?.availableWithin5Km).toBe(false);
    expect(evaluated[1]?.availableExtended).toBe(true);
    expect(evaluated[2]?.matchedProduct).toBeNull();
  });

  it("recognizes client socket aborts (abortIncoming / AbortError) without treating them as server crashes", () => {
    const innerAbort = new Error("aborted");
    innerAbort.stack =
      "Error: aborted\n    at abortIncoming (node:_http_server:942:17)\n    at socketOnClose (node:_http_server:935:3)";
    const wrapped = new Error("HTTPError", { cause: innerAbort });
    expect(isRequestAbortError(wrapped)).toBe(true);

    const ctrl = new AbortController();
    ctrl.abort();
    expect(isRequestAbortError(new Error("other"), { signal: ctrl.signal })).toBe(true);
    expect(isRequestAbortError(new Error("Database connection refused"))).toBe(false);
  });
});
