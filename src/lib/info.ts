export type InfoPage = { slug: string; title: string; body: string[] };

export const infoPages: InfoPage[] = [
  {
    slug: "contact",
    title: "Contact Us",
    body: [
      "CAREVIA — Healthcare, Connected. Care, Delivered.",
      "Support Email: care@carevia.example (placeholder until production domain launch)",
      "Partner Onboarding Email: partners@carevia.example (placeholder)",
      "Phone & Regional Office: To be published upon regional launch.",
      "CAREVIA is an integrated healthcare marketplace prototype connecting patients, doctors, and pharmacies. Official business contact channels will be activated before commercial launch.",
    ],
  },
  {
    slug: "faq",
    title: "Frequently Asked Questions",
    body: [
      "Is CAREVIA live with real deliveries and payments? Not yet — this application runs clearly labelled demonstration data for unconfigured external services (payments, medical council registry checks, live pharmacy POS stock, and SMS/push notifications).",
      "Does CAREVIA really deliver medicines in 30 minutes? CAREVIA targets delivery in as little as 30 minutes only when an in-stock partner pharmacy is within 5 km of your location. When you use Search Further beyond 5 km, honest longer delivery estimates and applicable distance fees are displayed.",
      "Can I order prescription medicines? Prescription-only medicines always require a valid prescription from a registered medical practitioner, reviewed by a licensed pharmacist before fulfilment.",
      "How are doctors verified on CAREVIA? Doctor profiles include medical registration numbers and council details. Live verification requires connecting an external Medical Council Registry API; until connected, verification states remain clearly marked as demonstration or pending review.",
      "How does Chat with Doctor work? Patients select a doctor, submit a consultation request, and can chat or share reports once the doctor accepts. Without a live real-time backend connected, conversations stay in your current session.",
      "What should I do in an emergency? Call your local emergency number (112 in India) or go to the nearest emergency department immediately.",
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    body: [
      "We request precise device location only when you tap a location detection button, and you can enter an address, city, or PIN code manually at any time.",
      "In this prototype, uploaded prescriptions and shared doctor-chat documents are validated locally and kept only in memory for your visit; they are never stored in browser localStorage.",
      "Personal and medical records are never persisted in browser storage. Only your shopping cart product IDs and quantities are stored locally.",
    ],
  },
  {
    slug: "terms",
    title: "Terms and Conditions",
    body: [
      "CAREVIA connects patients, independent licensed pharmacies, and verified medical practitioners. CAREVIA itself does not dispense medicines or provide medical diagnoses.",
      "Where external payment, verification, inventory, or communication APIs are not connected, actions are clearly labelled as demonstrations.",
      "Health information on CAREVIA is general guidance and never replaces professional medical advice, diagnosis, or treatment.",
    ],
  },
  {
    slug: "medicine-ordering",
    title: "Medicine Ordering & Delivery Policy",
    body: [
      "Nearby pharmacy discovery defaults to a 5 km radius around your selected location, enabling estimated delivery in as little as 30 minutes for stocked local items.",
      "When an item is unavailable within 5 km, you can use Search Further to inspect pharmacies at 10–35 km with transparent longer delivery windows and applicable distance charges.",
      "Real partner pharmacy inventory and dispatch times require live pharmacy ERP/POS API integration.",
    ],
  },
  {
    slug: "prescription",
    title: "Prescription Policy",
    body: [
      "Prescription-only (Rx) medicines require a valid prescription from a registered medical practitioner.",
      "Every prescription must be reviewed by a licensed pharmacist before any order is confirmed or dispatched.",
      "CAREVIA never recommends or prescribes medicines based on symptoms alone.",
    ],
  },
  {
    slug: "consultation",
    title: "Doctor Consultation & Verification Policy",
    body: [
      "Online consultations and Doctor Chat are intended for non-emergency medical advice. Conditions requiring physical examination should be seen in person.",
      "Doctors onboarded on CAREVIA submit medical registration details, qualifications, and council information for verification before being badged as verified.",
      "Paid consultation fees and platform commissions are settled through configured payment partners once live gateway credentials are connected.",
    ],
  },
  {
    slug: "location",
    title: "Location Services Information",
    body: [
      "Location is requested only when you tap “Detect My Location” or “Use My Current Location”.",
      "Coordinates are used to calculate distances to partner pharmacies, doctors, and public OpenStreetMap healthcare facilities.",
      "Map data © OpenStreetMap contributors.",
    ],
  },
];
