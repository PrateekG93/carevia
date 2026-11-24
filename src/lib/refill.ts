export type RefillFrequency = "daily" | "weekly";

export type RefillEstimate = {
  daysRemaining: number;
  refillDate: string;
};

export function estimateRefill(
  remainingQuantity: number,
  dosesPerDay: number,
  frequency: RefillFrequency,
  daysPerWeek = 7,
  from = new Date(),
): RefillEstimate | null {
  if (
    !Number.isFinite(remainingQuantity) ||
    !Number.isFinite(dosesPerDay) ||
    remainingQuantity <= 0 ||
    dosesPerDay <= 0 ||
    (frequency === "weekly" &&
      (!Number.isFinite(daysPerWeek) || daysPerWeek < 1 || daysPerWeek > 7))
  ) {
    return null;
  }

  const dosesPerCalendarDay = frequency === "daily" ? dosesPerDay : (dosesPerDay * daysPerWeek) / 7;
  const daysRemaining = Math.ceil(remainingQuantity / dosesPerCalendarDay);
  const refill = new Date(from.getFullYear(), from.getMonth(), from.getDate() + daysRemaining);
  const refillDate = `${refill.getFullYear()}-${String(refill.getMonth() + 1).padStart(2, "0")}-${String(refill.getDate()).padStart(2, "0")}`;

  return { daysRemaining, refillDate };
}
