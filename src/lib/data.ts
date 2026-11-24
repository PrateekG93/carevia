import tablets from "@/assets/p-tablets.jpg";
import syrup from "@/assets/p-syrup.jpg";
import care from "@/assets/p-care.jpg";

// Unique First Aid Kit & Essential product photographs
import bandagesImg from "@/assets/products/bandages.jpg";
import antisepticImg from "@/assets/products/antiseptic.jpg";
import cottonRollImg from "@/assets/products/cotton-roll.jpg";
import thermometerImg from "@/assets/products/thermometer.jpg";
import surgicalGlovesImg from "@/assets/products/surgical-gloves.jpg";
import gauzePadsImg from "@/assets/products/gauze-pads.jpg";
import medicalTapeImg from "@/assets/products/medical-tape.jpg";
import firstAidScissorsImg from "@/assets/products/first-aid-scissors.jpg";
import burnDressingsImg from "@/assets/products/burn-dressings.jpg";
import medicalMasksImg from "@/assets/products/medical-masks.jpg";

export type Category = { id: string; name: string };
export const categories: Category[] = [
  { id: "first-aid", name: "First Aid Kit & Wound Care" },
  { id: "fever-pain", name: "Fever and Pain Relief" },
  { id: "cold-cough", name: "Cold and Cough" },
  { id: "digestive", name: "Digestive Health" },
  { id: "vitamins", name: "Vitamins and Supplements" },
  { id: "personal-care", name: "Personal Care" },
  { id: "devices", name: "Healthcare Devices" },
  { id: "essentials", name: "Everyday Healthcare Essentials" },
];

export type Product = {
  id: string;
  name: string;
  genericName?: string | undefined;
  category: string;
  strength?: string | undefined;
  pack: string;
  price: number;
  stock: number;
  rx: boolean;
  image: string;
  description: string;
  firstAidEssential?: boolean;
};

const p = (
  id: string,
  name: string,
  category: string,
  pack: string,
  price: number,
  stock: number,
  image: string,
  description: string,
  strength?: string,
  rx = false,
  firstAidEssential = false,
  genericName?: string,
): Product => ({
  id,
  name,
  category,
  pack,
  price,
  stock,
  image,
  description,
  strength,
  rx,
  firstAidEssential,
  genericName,
});

export const products: Product[] = [
  // Redesigned First Aid Kit Essentials — 10 unique product photographs, descriptions & prices
  p(
    "bandage-roll",
    "Elastic Crepe & Adhesive Bandages",
    "first-aid",
    "1 crepe roll (10 cm) + 20 assorted strips",
    115,
    70,
    bandagesImg,
    "Breathable woven crepe support bandage paired with sterile adhesive strips for sprains, minor cuts, and everyday wound protection.",
    undefined,
    false,
    true,
  ),
  p(
    "antiseptic-solution",
    "Clinical Antiseptic Solution",
    "first-aid",
    "150 ml amber bottle",
    105,
    90,
    antisepticImg,
    "Gentle topical antiseptic liquid designed for cleansing minor cuts, scrapes, abrasions, and disinfecting first-aid skin surfaces.",
    "Chlorhexidine & Cetrimide",
    false,
    true,
  ),
  p(
    "cotton-roll",
    "Absorbent Medical Cotton Roll",
    "first-aid",
    "100 g hygienic sterile roll",
    65,
    60,
    cottonRollImg,
    "100% pure soft surgical-grade absorbent cotton wool roll for wound swabbing, antiseptic application, and cushioned dressing.",
    undefined,
    false,
    true,
  ),
  p(
    "thermometer",
    "Digital Clinical Thermometer",
    "first-aid",
    "1 unit with protective case",
    229,
    30,
    thermometerImg,
    "Fast 10-second flexible-tip digital thermometer with clear LCD readout, fever alert beep, and last-reading memory.",
    "±0.1°C accuracy",
    false,
    true,
  ),
  p(
    "surgical-gloves",
    "Sterile Nitrile Surgical Gloves",
    "first-aid",
    "Box of 10 pairs (Powder-free)",
    190,
    55,
    surgicalGlovesImg,
    "Latex-free, powder-free sterile nitrile examination and surgical gloves offering puncture resistance for safe wound care.",
    "Size M",
    false,
    true,
  ),
  p(
    "gauze-pads",
    "Sterile Woven Gauze Pads",
    "first-aid",
    "Pack of 10 sterile pouches (10×10 cm)",
    95,
    65,
    gauzePadsImg,
    "Individually sealed 8-ply absorbent sterile cotton gauze swabs for dressing open wounds, post-procedure care, and fluid absorption.",
    "10 × 10 cm",
    false,
    true,
  ),
  p(
    "medical-tape",
    "Hypoallergenic Microporous Medical Tape",
    "first-aid",
    "2 rolls (2.5 cm × 9 m each)",
    85,
    75,
    medicalTapeImg,
    "Gentle breathable surgical paper tape that secures dressings and gauze firmly without irritating sensitive skin.",
    "2.5 cm",
    false,
    true,
  ),
  p(
    "first-aid-scissors",
    "Stainless Steel First Aid Scissors",
    "first-aid",
    "1 blunt-tip bandage shear",
    175,
    40,
    firstAidScissorsImg,
    "Autoclavable brushed stainless steel angled bandage scissors with a protective blunt tip for safely cutting dressings and tape.",
    "14 cm",
    false,
    true,
  ),
  p(
    "burn-dressings",
    "Soothing Hydrogel Burn Dressings",
    "first-aid",
    "Pack of 4 sterile pads (10×10 cm)",
    260,
    25,
    burnDressingsImg,
    "Cooling, non-adherent sterile hydrogel dressings that rapidly soothe minor thermal burns, scalds, and protect against contamination.",
    "Sterile Hydrogel",
    false,
    true,
  ),
  p(
    "face-masks",
    "3-Ply Medical Face Masks",
    "first-aid",
    "Box of 50 disposable masks",
    160,
    200,
    medicalMasksImg,
    "Fluid-resistant 3-layer melt-blown medical masks with adjustable nose clip and soft elastic ear loops for clinical & home protection.",
    "BFE ≥ 98%",
    false,
    true,
  ),
  p(
    "first-aid-kit",
    "CAREVIA Complete Home First Aid Kit",
    "first-aid",
    "1 kit, 35 medical items",
    549,
    18,
    care,
    "Complete family emergency kit combining bandages, antiseptic, gauze pads, medical tape, scissors, burn pad, thermometer, gloves, and masks.",
  ),

  // Core Medicines & Healthcare Catalog
  p(
    "paracetamol-500",
    "Paracetamol Tablets",
    "fever-pain",
    "Strip of 15 tablets",
    30,
    120,
    tablets,
    "Commonly used for relief of mild to moderate pain and fever. Follow label directions.",
    "500 mg",
    false,
    false,
    "Acetaminophen",
  ),
  p(
    "ibuprofen-400",
    "Ibuprofen Tablets",
    "fever-pain",
    "Strip of 10 tablets",
    45,
    60,
    tablets,
    "Anti-inflammatory pain reliever. Not suitable for everyone — read the label or ask a pharmacist.",
    "400 mg",
    false,
    false,
    "Ibuprofen",
  ),
  p(
    "diclofenac-gel",
    "Diclofenac Pain Relief Gel",
    "fever-pain",
    "30 g tube",
    110,
    0,
    care,
    "Topical gel for local muscle and joint pain. Available via extended pharmacy search when out locally.",
    "1% w/w",
    false,
    false,
    "Diclofenac Diethylamine",
  ),
  p(
    "cough-syrup",
    "Herbal Cough Syrup",
    "cold-cough",
    "100 ml bottle",
    95,
    40,
    syrup,
    "Soothing syrup for throat irritation associated with cough.",
  ),
  p(
    "cetirizine-10",
    "Cetirizine Tablets",
    "cold-cough",
    "Strip of 10 tablets",
    25,
    80,
    tablets,
    "Antihistamine for allergy symptoms such as sneezing and runny nose.",
    "10 mg",
    false,
    false,
    "Cetirizine Hydrochloride",
  ),
  p(
    "steam-capsules",
    "Menthol Steam Inhalation Capsules",
    "cold-cough",
    "Pack of 10",
    60,
    25,
    tablets,
    "For steam inhalation to ease nasal congestion.",
  ),
  p(
    "ors-sachet",
    "Oral Rehydration Salts",
    "digestive",
    "Pack of 5 sachets",
    75,
    150,
    care,
    "WHO-formula electrolytes to help replace fluids lost through dehydration.",
    "21 g",
    false,
    false,
    "Sodium Chloride + Dextrose",
  ),
  p(
    "antacid-syrup",
    "Antacid Suspension",
    "digestive",
    "170 ml bottle",
    120,
    35,
    syrup,
    "Fast-acting suspension for relief of acidity and heartburn.",
  ),
  p(
    "pantoprazole-40",
    "Pantoprazole Tablets",
    "digestive",
    "Strip of 15 tablets",
    140,
    50,
    tablets,
    "Prescription medicine used for acid-related conditions. A valid prescription is required.",
    "40 mg",
    true,
    false,
    "Pantoprazole Sodium",
  ),
  p(
    "vitamin-c",
    "Vitamin C Chewable Tablets",
    "vitamins",
    "Bottle of 60",
    199,
    45,
    tablets,
    "Dietary supplement. Not intended to diagnose, treat, or cure any disease.",
    "500 mg",
  ),
  p(
    "vitamin-d3",
    "Vitamin D3 Capsules",
    "vitamins",
    "Bottle of 30",
    249,
    14,
    tablets,
    "Dietary supplement for bone and immune vitamin D support.",
    "1000 IU",
  ),
  p(
    "multivitamin",
    "Daily Multivitamin",
    "vitamins",
    "Bottle of 30",
    349,
    28,
    tablets,
    "Balanced daily multivitamin and mineral supplement.",
  ),
  p(
    "hand-sanitizer",
    "Clinical Hand Sanitizer",
    "personal-care",
    "500 ml pump",
    160,
    100,
    syrup,
    "70% alcohol-based antimicrobial hand rub with skin moisturizers.",
  ),
  p(
    "moisturiser",
    "Fragrance-Free Moisturising Lotion",
    "personal-care",
    "200 ml",
    280,
    22,
    syrup,
    "Gentle ceramide-rich lotion for dry and sensitive skin.",
  ),
  p(
    "bp-monitor",
    "Automatic BP Monitor",
    "devices",
    "1 unit",
    1899,
    8,
    care,
    "Upper-arm oscillometric blood pressure monitor for home tracking.",
  ),
  p(
    "pulse-oximeter",
    "Fingertip Pulse Oximeter",
    "devices",
    "1 unit",
    999,
    0,
    care,
    "Measures SpO2 oxygen saturation and pulse rate. Available via extended pharmacy search.",
  ),
  p(
    "azithromycin-500",
    "Azithromycin Tablets",
    "essentials",
    "Strip of 3 tablets",
    120,
    40,
    tablets,
    "Prescription antibiotic. Only available with a valid prescription reviewed by a licensed pharmacist.",
    "500 mg",
    true,
    false,
    "Azithromycin",
  ),
];

export const getProduct = (id: string) => products.find((x) => x.id === id);

export type DoctorVerificationStatus =
  "Verified (Demo)" | "Pending Council API Verification" | "Rejected";

export type Doctor = {
  id: string;
  name: string;
  qualification: string;
  specialty: string;
  experience: number;
  fee: number;
  languages: string[];
  slots: string[];
  registrationNumber: string;
  medicalCouncil: string;
  verificationStatus: DoctorVerificationStatus;
  offersOnline: boolean;
  offersOffline: boolean;
  clinicName: string;
  city: string;
  lat: number;
  lon: number;
};

export const specialties = [
  "General Physician",
  "Dermatologist",
  "Pediatrician",
  "Gynecologist",
  "ENT Specialist",
  "Psychiatrist",
];

export const doctors: Doctor[] = [
  {
    id: "d1",
    name: "Dr. Sample Aarav Sharma",
    qualification: "MBBS, MD (General Medicine)",
    specialty: "General Physician",
    experience: 8,
    fee: 299,
    languages: ["English", "Hindi"],
    slots: ["09:00", "09:30", "11:00", "14:00", "18:30"],
    registrationNumber: "RMC-44920 (Demo)",
    medicalCouncil: "Rajasthan Medical Council",
    verificationStatus: "Verified (Demo)",
    offersOnline: true,
    offersOffline: true,
    clinicName: "CAREVIA Partner Polyclinic — Mahapura, Ajmer Road",
    city: "Mahapura, Jaipur",
    lat: 26.8375,
    lon: 75.6766,
  },
  {
    id: "d2",
    name: "Dr. Sample Meera Rathore",
    qualification: "MBBS, MD (Dermatology)",
    specialty: "Dermatologist",
    experience: 11,
    fee: 499,
    languages: ["English", "Hindi"],
    slots: ["10:00", "12:30", "16:00"],
    registrationNumber: "RMC-51209 (Demo)",
    medicalCouncil: "Rajasthan Medical Council",
    verificationStatus: "Verified (Demo)",
    offersOnline: true,
    offersOffline: true,
    clinicName: "Jaipur Skin & Care Clinic — Mahapura Mod, Jaipur",
    city: "Mahapura, Jaipur",
    lat: 26.8412,
    lon: 75.6834,
  },
  {
    id: "d3",
    name: "Dr. Sample Kabir Choudhary",
    qualification: "MBBS, MD (Paediatrics)",
    specialty: "Pediatrician",
    experience: 6,
    fee: 399,
    languages: ["English", "Hindi"],
    slots: ["08:30", "13:00", "17:00", "19:00"],
    registrationNumber: "RMC-67311 (Demo)",
    medicalCouncil: "Rajasthan Medical Council",
    verificationStatus: "Pending Council API Verification",
    offersOnline: true,
    offersOffline: true,
    clinicName: "Bhankrota Child Care Centre — Near Mahapura, Jaipur",
    city: "Bhankrota, Jaipur",
    lat: 26.8548,
    lon: 75.6942,
  },
  {
    id: "d4",
    name: "Dr. Sample Ananya Shekhawat",
    qualification: "MBBS, MS (OBG)",
    specialty: "Gynecologist",
    experience: 14,
    fee: 599,
    languages: ["English", "Hindi"],
    slots: ["11:30", "15:00", "17:30"],
    registrationNumber: "RMC-40288 (Demo)",
    medicalCouncil: "Rajasthan Medical Council",
    verificationStatus: "Verified (Demo)",
    offersOnline: true,
    offersOffline: true,
    clinicName: "PinkCity Women's Wellness — SEZ Road, Mahapura, Jaipur",
    city: "Mahapura, Jaipur",
    lat: 26.8304,
    lon: 75.6698,
  },
  {
    id: "d5",
    name: "Dr. Sample Rohan Verma",
    qualification: "MBBS",
    specialty: "General Physician",
    experience: 4,
    fee: 249,
    languages: ["English", "Hindi"],
    slots: ["07:00", "13:30", "21:00", "22:30"],
    registrationNumber: "RMC-91043 (Demo)",
    medicalCouncil: "Rajasthan Medical Council",
    verificationStatus: "Pending Council API Verification",
    offersOnline: true,
    offersOffline: true,
    clinicName: "Ajmer Road Health Desk — Mahapura Crossing, Jaipur",
    city: "Mahapura, Jaipur",
    lat: 26.8398,
    lon: 75.6721,
  },
  {
    id: "d6",
    name: "Dr. Sample Isha Agarwal",
    qualification: "MBBS, MS (ENT)",
    specialty: "ENT Specialist",
    experience: 9,
    fee: 449,
    languages: ["English", "Hindi"],
    slots: ["10:30", "14:30", "18:00"],
    registrationNumber: "RMC-33819 (Demo)",
    medicalCouncil: "Rajasthan Medical Council",
    verificationStatus: "Verified (Demo)",
    offersOnline: true,
    offersOffline: true,
    clinicName: "Mansarovar & Mahapura ENT Care — Jaipur",
    city: "Mansarovar, Jaipur",
    lat: 26.8582,
    lon: 75.7488,
  },
  {
    id: "d7",
    name: "Dr. Sample Vikram Mathur",
    qualification: "MBBS, MD (Psychiatry)",
    specialty: "Psychiatrist",
    experience: 12,
    fee: 699,
    languages: ["English", "Hindi"],
    slots: ["12:00", "17:30", "19:30"],
    registrationNumber: "RMC-29415 (Demo)",
    medicalCouncil: "Rajasthan Medical Council",
    verificationStatus: "Verified (Demo)",
    offersOnline: true,
    offersOffline: false,
    clinicName: "Vaishali & Mahapura Telehealth Desk — Jaipur",
    city: "Vaishali Nagar, Jaipur",
    lat: 26.9045,
    lon: 75.7444,
  },
];

export const DELIVERY_FREE_ABOVE = 499;
export const deliveryFee = (
  subtotal: number,
  option: "standard" | "express",
  extendedDistanceCharge = 0,
) => {
  if (subtotal === 0) return 0;
  const base = subtotal >= DELIVERY_FREE_ABOVE ? 0 : 40;
  return base + (option === "express" ? 50 : 0) + extendedDistanceCharge;
};

export const formatINR = (n: number) => "₹" + n.toLocaleString("en-IN");

export const ORDER_STAGES = [
  "Order Placed",
  "Prescription Verification",
  "Confirmed by Pharmacy",
  "Preparing Order",
  "Out for Delivery",
  "Delivered",
] as const;

export const PHARMACY_PLANS = [
  {
    name: "Starter" as const,
    monthlyInr: 999,
    features: [
      "5 km radius storefront listing",
      "Standard order & Rx queue",
      "Basic inventory & price editor",
    ],
  },
  {
    name: "Growth" as const,
    monthlyInr: 2499,
    features: [
      "Priority 30-min dispatch badge",
      "Extended-radius order routing",
      "POS sync readiness & analytics",
    ],
  },
  {
    name: "Enterprise" as const,
    monthlyInr: 4999,
    features: [
      "Multi-branch inventory control",
      "Featured marketplace placement",
      "Dedicated SLA & revenue exports",
    ],
  },
];
