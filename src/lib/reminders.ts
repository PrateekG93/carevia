export type MealInstruction = "Before food" | "After food" | "With food" | "Anytime";
export type ReminderFrequency = "Once daily" | "Twice daily" | "Three times daily" | "Weekly";
export type DoseStatus = "upcoming" | "taken" | "snoozed" | "skipped" | "missed";

export type MedicineReminder = {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: ReminderFrequency;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  timings: string[]; // HH:mm
  mealInstruction: MealInstruction;
  notes?: string;
};

export type DoseEvent = {
  key: string; // `${reminderId}_${date}_${time}`
  reminderId: string;
  medicineName: string;
  dosage: string;
  mealInstruction: MealInstruction;
  date: string;
  time: string;
  snoozedUntil?: string;
  status: DoseStatus;
};

export function validateReminderInput(input: Omit<MedicineReminder, "id">): string | null {
  if (input.medicineName.trim().length < 2) return "Enter a medicine name.";
  if (input.dosage.trim().length < 1) return "Enter dosage instructions (e.g. 1 tablet, 5 ml).";
  if (!input.startDate || !input.endDate) return "Choose start and end dates.";
  if (input.endDate < input.startDate) return "End date cannot be before start date.";
  if (!input.timings.length || input.timings.some((t) => !/^\d{2}:\d{2}$/.test(t))) {
    return "Add at least one valid reminder time (HH:MM).";
  }
  return null;
}

export function isReminderActiveOnDate(r: MedicineReminder, dateStr: string): boolean {
  if (dateStr < r.startDate || dateStr > r.endDate) return false;
  if (r.frequency === "Weekly") {
    const start = new Date(`${r.startDate}T00:00:00`);
    const target = new Date(`${dateStr}T00:00:00`);
    const diffDays = Math.round((target.getTime() - start.getTime()) / 86400000);
    return diffDays >= 0 && diffDays % 7 === 0;
  }
  return true;
}

export function buildDoseScheduleForDate(
  reminders: MedicineReminder[],
  dateStr: string,
  overrides: Record<string, { status: DoseStatus; snoozedUntil?: string }>,
  now = new Date(),
): DoseEvent[] {
  const events: DoseEvent[] = [];
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  for (const r of reminders) {
    if (!isReminderActiveOnDate(r, dateStr)) continue;
    for (const time of r.timings) {
      const key = `${r.id}_${dateStr}_${time}`;
      const override = overrides[key];
      let status: DoseStatus = override?.status ?? "upcoming";

      if (!override && dateStr <= todayStr) {
        const scheduled = new Date(`${dateStr}T${time}:00`);
        // Mark as missed if scheduled time passed by > 60 minutes without action
        if (now.getTime() - scheduled.getTime() > 60 * 60 * 1000) {
          status = "missed";
        }
      }

      events.push({
        key,
        reminderId: r.id,
        medicineName: r.medicineName,
        dosage: r.dosage,
        mealInstruction: r.mealInstruction,
        date: dateStr,
        time,
        ...(override?.snoozedUntil ? { snoozedUntil: override.snoozedUntil } : {}),
        status,
      });
    }
  }

  return events.sort((a, b) => a.time.localeCompare(b.time));
}

export function addMinutesToTime(hhmm: string, mins: number): string {
  const [hStr, mStr] = hhmm.split(":");
  const total = (Number(hStr) * 60 + Number(mStr) + mins) % (24 * 60);
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

export function defaultTimingsForFrequency(freq: ReminderFrequency): string[] {
  switch (freq) {
    case "Once daily":
    case "Weekly":
      return ["08:00"];
    case "Twice daily":
      return ["08:00", "20:00"];
    case "Three times daily":
      return ["08:00", "14:00", "20:00"];
  }
}
