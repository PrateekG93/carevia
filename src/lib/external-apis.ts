export type ExternalIntegrationStatus = {
  id: string;
  capability: string;
  providerExamples: string;
  requiredEnvVars: string[];
  currentState: "Not configured (demo mode)" | "Browser-only fallback" | "Public OSM read-only";
  notes: string;
};

export const externalApiIntegrations: ExternalIntegrationStatus[] = [
  {
    id: "payments",
    capability: "Online Payments & Payout Split",
    providerExamples: "Razorpay / Stripe Connect",
    requiredEnvVars: ["PAYMENT_GATEWAY_KEY_ID", "PAYMENT_GATEWAY_SECRET", "PAYMENT_WEBHOOK_SECRET"],
    currentState: "Not configured (demo mode)",
    notes:
      "Checkout and consultation fees do not charge cards or UPI until merchant API keys are configured.",
  },
  {
    id: "doctor-registry",
    capability: "Doctor Medical Registration Verification",
    providerExamples: "National Medical Commission (NMC) / State Medical Council API",
    requiredEnvVars: ["MEDICAL_REGISTRY_API_URL", "MEDICAL_REGISTRY_API_KEY"],
    currentState: "Not configured (demo mode)",
    notes:
      "Doctor registration numbers are recorded for Admin review; live automated council verification requires registry credentials.",
  },
  {
    id: "pharmacy-erp",
    capability: "Licensed Pharmacy License & Live POS Inventory",
    providerExamples: "Drug License Registry / Pharmacy POS Webhook",
    requiredEnvVars: ["PHARMACY_SYNC_API_KEY", "PHARMACY_LICENSE_VERIFIER_URL"],
    currentState: "Not configured (demo mode)",
    notes:
      "Displayed medicine availability, 5 km stock checks, and partner pricing are sample data unless synced via pharmacy POS.",
  },
  {
    id: "notifications",
    capability: "Push, SMS & Transactional Email Notifications",
    providerExamples: "Firebase Cloud Messaging / Twilio SMS / Resend Email",
    requiredEnvVars: ["RESEND_API_KEY", "TWILIO_ACCOUNT_SID", "FCM_SERVER_KEY"],
    currentState: "Browser-only fallback",
    notes:
      "Medicine reminders use the browser Notification API when permitted and open; background push/SMS/email requires external keys.",
  },
  {
    id: "realtime-consult",
    capability: "Real-Time Doctor Chat & Audio/Video Room",
    providerExamples: "Supabase Realtime + Storage + Daily / LiveKit WebRTC",
    requiredEnvVars: ["WEBRTC_PROVIDER_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
    currentState: "Not configured (demo mode)",
    notes:
      "Doctor Chat messages and document previews run in your active session until Supabase database tables and WebRTC keys are enabled.",
  },
  {
    id: "maps-osm",
    capability: "Geocoding & Nearby Healthcare Facility Map",
    providerExamples: "OpenStreetMap Nominatim & Overpass API",
    requiredEnvVars: [],
    currentState: "Public OSM read-only",
    notes:
      "Public community-maintained map data works without API keys; clinic hours and phone numbers must be confirmed with the facility.",
  },
];
