// Rule-based general information only. Never diagnoses and never suggests prescription medicines.

export const EMERGENCY_TERMS = [
  "difficulty breathing",
  "can't breathe",
  "cannot breathe",
  "shortness of breath",
  "breathless",
  "chest pain",
  "unconscious",
  "fainted",
  "passed out",
  "confusion",
  "confused",
  "seizure",
  "fits",
  "convulsion",
  "stroke",
  "face drooping",
  "slurred speech",
  "severe bleeding",
  "suicidal",
  "blue lips",
  "stiff neck",
  "poison",
  "overdose",
];

export type Guidance = {
  level: "emergency" | "see-doctor" | "self-care";
  title: string;
  points: string[];
};

export function assessSymptoms(text: string): Guidance {
  const t = text.toLowerCase();
  if (EMERGENCY_TERMS.some((k) => t.includes(k))) {
    return {
      level: "emergency",
      title: "This may need emergency care",
      points: [
        "Call your local emergency number now (112 in India) or go to the nearest emergency department.",
        "Do not wait for an online consultation or a medicine delivery.",
        "If possible, ask someone to stay with you.",
      ],
    };
  }
  const highFever =
    /high fever|10[3-5]|39\.[5-9]|4[0-1](\.\d)?\s*°?c|fever.*(3|three|4|four|5|five)\s*days/.test(
      t,
    );
  const serious =
    /severe|worst|blood|vomiting blood|black stool|rash.*fever|pregnan|infant|baby|newborn/.test(t);
  if (highFever || serious) {
    return {
      level: "see-doctor",
      title: "Please get a medical assessment soon",
      points: [
        highFever
          ? "A high or persistent fever should be assessed by a doctor. Some causes need a physical examination or tests."
          : "What you describe should be assessed by a doctor promptly.",
        "An online consultation may help decide next steps, but an in-person visit may be needed.",
        "If symptoms worsen, or you develop breathing difficulty, confusion, or seizures, call emergency services.",
      ],
    };
  }
  const pts: string[] = [];
  if (/fever/.test(t))
    pts.push("For a mild fever: rest, drink plenty of fluids, and monitor your temperature.");
  if (/head/.test(t))
    pts.push(
      "For a headache: rest, hydrate, and limit screen time. Sudden or severe headaches need urgent care.",
    );
  if (/cough/.test(t))
    pts.push(
      "For a cough: warm fluids and steam may help. See a doctor if it lasts more than 2–3 weeks or you cough blood.",
    );
  if (/cold|sneez|runny|congest/.test(t))
    pts.push("For a common cold: rest, fluids, and saline rinses can ease symptoms.");
  if (/stomach|acid|diarr|loose|nause|vomit/.test(t))
    pts.push("For stomach discomfort: sip fluids or oral rehydration salts and eat light food.");
  if (!pts.length)
    pts.push(
      "We couldn't match your description to general guidance. A doctor can help you understand your symptoms.",
    );
  pts.push(
    "A pharmacist can advise on suitable over-the-counter products. See a doctor if symptoms last more than 3 days or get worse.",
  );
  return { level: "self-care", title: "General information", points: pts };
}
