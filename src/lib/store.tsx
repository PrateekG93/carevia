import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  doctors as initialDoctors,
  getProduct,
  ORDER_STAGES,
  type Doctor,
  type DoctorVerificationStatus,
  type Product,
} from "./data";
import {
  DEFAULT_USER_COORDS,
  getPartnerPharmaciesForLocation,
  type PartnerPharmacy,
} from "./delivery";
import { localDate } from "./safety";
import type { DoseStatus, MedicineReminder } from "./reminders";

export type UserRole = "patient" | "doctor" | "pharmacy" | "admin";

export type CartLine = { id: string; qty: number };
export type Location = { label: string; lat?: number; lon?: number };
export type User = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  authSource: "demo" | "cloud";
};
export type Address = { name: string; phone: string; line1: string; city: string; pin: string };

export type Order = {
  id: string;
  createdAt: number;
  lines: { product: Product; qty: number }[];
  subtotal: number;
  delivery: number;
  extendedDistanceFee: number;
  commissionAmount: number;
  commissionRatePct: number;
  total: number;
  address: Address;
  pharmacyId: string;
  pharmacyName: string;
  distanceKm: number;
  etaLabel: string;
  deliveryOption: "standard" | "express";
  payment: string;
  paymentStatus: "Demo — no charge" | "Cash on delivery (demo)";
  stages: string[];
  stage: number;
  hasRx: boolean;
};

export type AppointmentStatus =
  | "Demo booking confirmed"
  | "Rescheduled (demo)"
  | "Cancelled"
  | "Completed (demo)"
  | "Request sent (not confirmed)";

export type Appointment = {
  id: string;
  doctorId?: string;
  kind: "Online" | "In-Person";
  mode?: "Audio" | "Video";
  with: string;
  specialty: string;
  date: string;
  time: string;
  patient: string;
  fee: number;
  commissionAmount: number;
  status: AppointmentStatus;
  place?: string;
};

export type RxUpload = { id: string; fileName: string; at: number; status: string };

export type ChatAttachment = { name: string; type: string; size: number };
export type ChatMessage = {
  id: string;
  sender: "patient" | "doctor";
  senderName: string;
  text: string;
  attachment?: ChatAttachment;
  at: number;
};

export type ConsultThread = {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  patientName: string;
  reason: string;
  fee: number;
  status: "requested" | "accepted" | "rejected" | "completed";
  createdAt: number;
  messages: ChatMessage[];
};

export type PlatformSettings = {
  pharmacyCommissionPct: number;
  consultationCommissionPct: number;
  starterPlanInr: number;
  growthPlanInr: number;
  enterprisePlanInr: number;
  premiumListingInr: number;
};

export type Complaint = {
  id: string;
  reporterName: string;
  role: UserRole;
  subject: string;
  category: "Delivery" | "Pharmacy" | "Doctor" | "Payment" | "App";
  details: string;
  status: "open" | "in_review" | "resolved";
  createdAt: number;
};

type Store = {
  cart: CartLine[];
  add: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clearCart: () => void;
  cartCount: number;
  location: Location | null;
  setLocation: (l: Location | null) => void;
  user: User | null;
  setUser: (u: User | null) => void;
  switchDemoRole: (role: UserRole) => void;
  addresses: Address[];
  addAddress: (a: Address) => void;
  orders: Order[];
  placeOrder: (
    o: Omit<
      Order,
      "id" | "createdAt" | "stage" | "stages" | "commissionAmount" | "commissionRatePct"
    >,
  ) => Order;
  advanceOrder: (id: string) => void;
  appointments: Appointment[];
  addAppointment: (a: Omit<Appointment, "id" | "commissionAmount">) => Appointment;
  cancelAppointment: (id: string) => void;
  rescheduleAppointment: (id: string, date: string, time: string) => void;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  rxUploads: RxUpload[];
  addRx: (fileName: string) => RxUpload;
  rxVerifiedForCart: boolean;
  setRxVerifiedForCart: (v: boolean) => void;
  reminders: MedicineReminder[];
  addReminder: (r: Omit<MedicineReminder, "id">) => MedicineReminder;
  removeReminder: (id: string) => void;
  doseOverrides: Record<string, { status: DoseStatus; snoozedUntil?: string }>;
  markDose: (key: string, status: DoseStatus, snoozedUntil?: string) => void;
  doctorProfiles: Doctor[];
  updateDoctorProfile: (id: string, patch: Partial<Doctor>) => void;
  setDoctorVerification: (id: string, status: DoctorVerificationStatus) => void;
  partnerPharmacies: PartnerPharmacy[];
  updatePharmacyInventory: (
    pharmacyId: string,
    productId: string,
    stock: number,
    price?: number,
  ) => void;
  updatePharmacyDetails: (pharmacyId: string, patch: Partial<PartnerPharmacy>) => void;
  setPharmacyVerification: (pharmacyId: string, verified: boolean) => void;
  consultThreads: ConsultThread[];
  requestDoctorChat: (doctor: Doctor, patientName: string, reason: string) => ConsultThread;
  respondDoctorChat: (threadId: string, status: "accepted" | "rejected" | "completed") => void;
  sendDoctorChatMessage: (
    threadId: string,
    sender: "patient" | "doctor",
    senderName: string,
    text: string,
    attachment?: ChatAttachment,
  ) => void;
  platformSettings: PlatformSettings;
  updatePlatformSettings: (patch: Partial<PlatformSettings>) => void;
  complaints: Complaint[];
  addComplaint: (c: Omit<Complaint, "id" | "status" | "createdAt">) => Complaint;
  updateComplaintStatus: (id: string, status: Complaint["status"]) => void;
  registeredUsers: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: "Active (Demo)" | "Suspended";
  }[];
  toggleUserStatus: (id: string) => void;
};

const Ctx = createContext<Store | null>(null);
const CART_KEY = "carevia-cart";
const uid = (p: string) => p + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();

function createInitialReminders(): MedicineReminder[] {
  const today = localDate();
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);
  const end = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-${String(nextMonth.getDate()).padStart(2, "0")}`;
  return [
    {
      id: "REM-SAMPLE-1",
      medicineName: "Vitamin D3 (Sample)",
      dosage: "1 capsule (1000 IU)",
      frequency: "Once daily",
      startDate: today,
      endDate: end,
      timings: ["09:00"],
      mealInstruction: "After food",
    },
    {
      id: "REM-SAMPLE-2",
      medicineName: "Paracetamol 500 mg (Sample)",
      dosage: "1 tablet",
      frequency: "Twice daily",
      startDate: today,
      endDate: end,
      timings: ["08:30", "20:30"],
      mealInstruction: "After food",
    },
  ];
}

const initialComplaints: Complaint[] = [
  {
    id: "CMP-101",
    reporterName: "Sample Patient",
    role: "patient",
    subject: "Delayed delivery beyond 45 min estimate (Sample)",
    category: "Delivery",
    details: "Sample complaint entry for Admin resolution workflow demonstration.",
    status: "open",
    createdAt: Date.now() - 86400000,
  },
];

const initialUsers: Store["registeredUsers"] = [
  {
    id: "USR-P1",
    name: "Sample Patient",
    email: "patient@carevia.example",
    role: "patient",
    status: "Active (Demo)",
  },
  {
    id: "USR-D1",
    name: "Dr. Sample Aarav Sharma",
    email: "aarav@carevia.example",
    role: "doctor",
    status: "Active (Demo)",
  },
  {
    id: "USR-PH1",
    name: "Mahapura CarePlus Pharmacy",
    email: "careplus@carevia.example",
    role: "pharmacy",
    status: "Active (Demo)",
  },
  {
    id: "USR-A1",
    name: "CAREVIA Operations Admin",
    email: "admin@carevia.example",
    role: "admin",
    status: "Active (Demo)",
  },
];

export function StoreProvider({ children }: { children: ReactNode }) {
  // Only the cart (product ids + quantities) is persisted; never personal or medical records.
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [rxUploads, setRxUploads] = useState<RxUpload[]>([]);
  const [rxVerifiedForCart, setRxVerifiedForCart] = useState(false);
  const [reminders, setReminders] = useState<MedicineReminder[]>(() => createInitialReminders());
  const [doseOverrides, setDoseOverrides] = useState<
    Record<string, { status: DoseStatus; snoozedUntil?: string }>
  >({});
  const [doctorProfiles, setDoctorProfiles] = useState<Doctor[]>(() => initialDoctors);
  const [partnerPharmacies, setPartnerPharmacies] = useState<PartnerPharmacy[]>(() =>
    getPartnerPharmaciesForLocation(DEFAULT_USER_COORDS.lat, DEFAULT_USER_COORDS.lon),
  );
  const [consultThreads, setConsultThreads] = useState<ConsultThread[]>([
    {
      id: "CHAT-DEMO-1",
      doctorId: "d1",
      doctorName: "Dr. Sample Aarav Sharma",
      specialty: "General Physician",
      patientName: "Sample Patient",
      reason: "Follow-up on fever and hydration guidance (sample thread)",
      fee: 299,
      status: "accepted",
      createdAt: Date.now() - 3600000,
      messages: [
        {
          id: "MSG-1",
          sender: "patient",
          senderName: "Sample Patient",
          text: "Hello Doctor, sharing my temperature log from yesterday.",
          at: Date.now() - 3500000,
        },
        {
          id: "MSG-2",
          sender: "doctor",
          senderName: "Dr. Sample Aarav Sharma",
          text: "Thank you. Keep hydrating and let me know if your fever stays above 101°F or lasts more than 3 days (sample consultation message).",
          at: Date.now() - 3300000,
        },
      ],
    },
  ]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    pharmacyCommissionPct: 12,
    consultationCommissionPct: 15,
    starterPlanInr: 999,
    growthPlanInr: 2499,
    enterprisePlanInr: 4999,
    premiumListingInr: 1499,
  });
  const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints);
  const [registeredUsers, setRegisteredUsers] = useState(initialUsers);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setCart(JSON.parse(raw));
    } catch {
      // Ignore storage errors in restricted contexts
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, loaded]);

  // Keep partner pharmacy coordinates anchored relative to user location when coordinates change
  useEffect(() => {
    if (location?.lat !== undefined && location?.lon !== undefined) {
      const fresh = getPartnerPharmaciesForLocation(location.lat, location.lon);
      setPartnerPharmacies((prev) =>
        fresh.map((f) => {
          const existing = prev.find((p) => p.id === f.id);
          return existing
            ? {
                ...f,
                name: existing.name,
                licenseNumber: existing.licenseNumber,
                verified: existing.verified,
                subscriptionPlan: existing.subscriptionPlan,
                premiumListing: existing.premiumListing,
                inventory: existing.inventory,
                ...(existing.priceOverrides ? { priceOverrides: existing.priceOverrides } : {}),
              }
            : f;
        }),
      );
    }
  }, [location?.lat, location?.lon]);

  const value = useMemo<Store>(() => {
    const clamp = (id: string, qty: number) =>
      Math.max(0, Math.min(qty, getProduct(id)?.stock ?? 0, 10));
    return {
      cart,
      add: (id, qty = 1) =>
        setCart((c) => {
          const ex = c.find((l) => l.id === id);
          if (ex) return c.map((l) => (l.id === id ? { ...l, qty: clamp(id, l.qty + qty) } : l));
          const q = clamp(id, qty);
          return q > 0 ? [...c, { id, qty: q }] : c;
        }),
      setQty: (id, qty) =>
        setCart((c) =>
          qty <= 0
            ? c.filter((l) => l.id !== id)
            : c.map((l) => (l.id === id ? { ...l, qty: clamp(id, qty) } : l)),
        ),
      remove: (id) => setCart((c) => c.filter((l) => l.id !== id)),
      clearCart: () => {
        setCart([]);
        setRxVerifiedForCart(false);
      },
      cartCount: cart.reduce((s, l) => s + l.qty, 0),
      location,
      setLocation,
      user,
      setUser,
      switchDemoRole: (role) => {
        const defaults: Record<UserRole, User> = {
          patient: {
            id: "USR-P1",
            name: "Sample Patient",
            email: "patient@carevia.example",
            mobile: "9876543210",
            role: "patient",
            authSource: "demo",
          },
          doctor: {
            id: "USR-D1",
            name: "Dr. Sample Aarav Sharma",
            email: "aarav@carevia.example",
            mobile: "9876501122",
            role: "doctor",
            authSource: "demo",
          },
          pharmacy: {
            id: "USR-PH1",
            name: "Mahapura CarePlus Pharmacy",
            email: "careplus@carevia.example",
            mobile: "9876503344",
            role: "pharmacy",
            authSource: "demo",
          },
          admin: {
            id: "USR-A1",
            name: "CAREVIA Platform Admin",
            email: "admin@carevia.example",
            mobile: "9876505566",
            role: "admin",
            authSource: "demo",
          },
        };
        setUser(defaults[role]);
      },
      addresses,
      addAddress: (a) => setAddresses((x) => [a, ...x]),
      orders,
      placeOrder: (o) => {
        const stages = ORDER_STAGES.filter((s) => o.hasRx || s !== "Prescription Verification");
        const commissionRatePct = platformSettings.pharmacyCommissionPct;
        const commissionAmount = Math.round((o.subtotal * commissionRatePct) / 100);
        const order: Order = {
          ...o,
          id: uid("CV"),
          createdAt: Date.now(),
          stages,
          stage: 0,
          commissionRatePct,
          commissionAmount,
        };
        setOrders((x) => [order, ...x]);
        return order;
      },
      advanceOrder: (id) =>
        setOrders((x) =>
          x.map((o) =>
            o.id === id ? { ...o, stage: Math.min(o.stage + 1, o.stages.length - 1) } : o,
          ),
        ),
      appointments,
      addAppointment: (a) => {
        const commissionAmount = Math.round(
          (a.fee * platformSettings.consultationCommissionPct) / 100,
        );
        const appt: Appointment = { ...a, id: uid("AP"), commissionAmount };
        setAppointments((x) => [appt, ...x]);
        return appt;
      },
      cancelAppointment: (id) =>
        setAppointments((x) => x.map((a) => (a.id === id ? { ...a, status: "Cancelled" } : a))),
      rescheduleAppointment: (id, date, time) =>
        setAppointments((x) =>
          x.map((a) => (a.id === id ? { ...a, date, time, status: "Rescheduled (demo)" } : a)),
        ),
      updateAppointmentStatus: (id, status) =>
        setAppointments((x) => x.map((a) => (a.id === id ? { ...a, status } : a))),
      rxUploads,
      addRx: (fileName) => {
        const r = {
          id: uid("RX"),
          fileName,
          at: Date.now(),
          status: "Awaiting pharmacist review (demo)",
        };
        setRxUploads((x) => [r, ...x]);
        return r;
      },
      rxVerifiedForCart,
      setRxVerifiedForCart,
      reminders,
      addReminder: (r) => {
        const created: MedicineReminder = { ...r, id: uid("REM") };
        setReminders((prev) => [created, ...prev]);
        return created;
      },
      removeReminder: (id) => setReminders((prev) => prev.filter((r) => r.id !== id)),
      doseOverrides,
      markDose: (key, status, snoozedUntil) =>
        setDoseOverrides((prev) => ({
          ...prev,
          [key]: { status, ...(snoozedUntil ? { snoozedUntil } : {}) },
        })),
      doctorProfiles,
      updateDoctorProfile: (id, patch) =>
        setDoctorProfiles((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d))),
      setDoctorVerification: (id, verificationStatus) =>
        setDoctorProfiles((prev) =>
          prev.map((d) => (d.id === id ? { ...d, verificationStatus } : d)),
        ),
      partnerPharmacies,
      updatePharmacyInventory: (pharmacyId, productId, stock, price) =>
        setPartnerPharmacies((prev) =>
          prev.map((p) => {
            if (p.id !== pharmacyId) return p;
            const nextOverrides = { ...(p.priceOverrides ?? {}) };
            if (price !== undefined && price > 0) nextOverrides[productId] = price;
            return {
              ...p,
              inventory: { ...p.inventory, [productId]: Math.max(0, stock) },
              priceOverrides: nextOverrides,
            };
          }),
        ),
      updatePharmacyDetails: (pharmacyId, patch) =>
        setPartnerPharmacies((prev) =>
          prev.map((p) => (p.id === pharmacyId ? { ...p, ...patch } : p)),
        ),
      setPharmacyVerification: (pharmacyId, verified) =>
        setPartnerPharmacies((prev) =>
          prev.map((p) => (p.id === pharmacyId ? { ...p, verified } : p)),
        ),
      consultThreads,
      requestDoctorChat: (doctor, patientName, reason) => {
        const thread: ConsultThread = {
          id: uid("CHAT"),
          doctorId: doctor.id,
          doctorName: doctor.name,
          specialty: doctor.specialty,
          patientName,
          reason,
          fee: doctor.fee,
          status: "requested",
          createdAt: Date.now(),
          messages: [
            {
              id: uid("MSG"),
              sender: "patient",
              senderName: patientName,
              text: `Consultation request: ${reason}`,
              at: Date.now(),
            },
          ],
        };
        setConsultThreads((prev) => [thread, ...prev]);
        return thread;
      },
      respondDoctorChat: (threadId, status) =>
        setConsultThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, status } : t))),
      sendDoctorChatMessage: (threadId, sender, senderName, text, attachment) =>
        setConsultThreads((prev) =>
          prev.map((t) =>
            t.id === threadId
              ? {
                  ...t,
                  messages: [
                    ...t.messages,
                    {
                      id: uid("MSG"),
                      sender,
                      senderName,
                      text,
                      ...(attachment ? { attachment } : {}),
                      at: Date.now(),
                    },
                  ],
                }
              : t,
          ),
        ),
      platformSettings,
      updatePlatformSettings: (patch) => setPlatformSettings((prev) => ({ ...prev, ...patch })),
      complaints,
      addComplaint: (c) => {
        const created: Complaint = { ...c, id: uid("CMP"), status: "open", createdAt: Date.now() };
        setComplaints((prev) => [created, ...prev]);
        return created;
      },
      updateComplaintStatus: (id, status) =>
        setComplaints((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c))),
      registeredUsers,
      toggleUserStatus: (id) =>
        setRegisteredUsers((prev) =>
          prev.map((u) =>
            u.id === id
              ? { ...u, status: u.status === "Active (Demo)" ? "Suspended" : "Active (Demo)" }
              : u,
          ),
        ),
    };
  }, [
    cart,
    location,
    user,
    addresses,
    orders,
    appointments,
    rxUploads,
    rxVerifiedForCart,
    reminders,
    doseOverrides,
    doctorProfiles,
    partnerPharmacies,
    consultThreads,
    platformSettings,
    complaints,
    registeredUsers,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside provider");
  return s;
}

export function useCartLines() {
  const { cart } = useStore();
  return cart.flatMap((l) => {
    const product = getProduct(l.id);
    return product ? [{ product, qty: l.qty }] : [];
  });
}
