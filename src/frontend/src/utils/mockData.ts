import type { Doctor, Product, Reminder, Visit } from "../hooks/useQueries";
import { msToNs } from "./dateUtils";

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

export const MOCK_DOCTORS: Doctor[] = [
  {
    id: 1n,
    name: "Dr. Priya Sharma",
    specialty: "Ophthalmologist",
    clinicName: "Sharma Eye Care",
    address: "12 MG Road, Bengaluru",
    areaTerritory: "South Bengaluru",
    phone: "+91 98451 23456",
    email: "dr.priya@sharmaeye.in",
    notes: "Prefers morning calls. Very interested in dry eye solutions.",
  },
  {
    id: 2n,
    name: "Dr. Rajesh Mehta",
    specialty: "Retina Specialist",
    clinicName: "Mehta Vision Centre",
    address: "45 Linking Road, Mumbai",
    areaTerritory: "Mumbai West",
    phone: "+91 99201 78901",
    email: "dr.mehta@mvision.in",
    notes: "Key opinion leader. Attends regular conferences.",
  },
  {
    id: 3n,
    name: "Dr. Kavitha Nair",
    specialty: "Pediatric Ophthalmologist",
    clinicName: "Nair Childrens Eye Clinic",
    address: "8 Anna Salai, Chennai",
    areaTerritory: "Chennai Central",
    phone: "+91 97890 34512",
    email: "drkavitha@naireyeclinic.in",
    notes: "Focus on pediatric conditions. Interested in myopia control.",
  },
  {
    id: 4n,
    name: "Dr. Arun Verma",
    specialty: "Cornea Specialist",
    clinicName: "Verma Eye Hospital",
    address: "23 Civil Lines, Delhi",
    areaTerritory: "Delhi NCR",
    phone: "+91 98110 65432",
    email: "drarun@vermaeyehospital.com",
    notes: "Interested in latest corneal treatments.",
  },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 1n,
    name: "ClearView Drops",
    category: "Dry Eye Treatment",
    description:
      "Advanced lubricating eye drops with hyaluronic acid for long-lasting relief from dry eye symptoms.",
    keyBenefits:
      "12-hour relief, preservative-free, suitable for contact lens wearers",
    isActive: true,
  },
  {
    id: 2n,
    name: "RetinaPro Capsules",
    category: "Nutritional Supplement",
    description:
      "Comprehensive ocular nutrition formula with lutein, zeaxanthin, and omega-3 for retinal health.",
    keyBenefits:
      "Supports macular health, antioxidant protection, clinically proven formula",
    isActive: true,
  },
  {
    id: 3n,
    name: "GlaucoGuard Drops",
    category: "Glaucoma Management",
    description:
      "Prostaglandin analog for once-daily intraocular pressure reduction in open-angle glaucoma.",
    keyBenefits:
      "24-hour IOP control, once-daily dosing, minimal systemic side effects",
    isActive: true,
  },
  {
    id: 4n,
    name: "AllerEase Spray",
    category: "Allergy Treatment",
    description:
      "Mast cell stabilizer and antihistamine combination for allergic conjunctivitis.",
    keyBenefits: "Dual action, rapid onset, 8-hour relief",
    isActive: true,
  },
  {
    id: 5n,
    name: "PostOp Shield Gel",
    category: "Post-Surgical Care",
    description:
      "Antibacterial ophthalmic gel for post-cataract and refractive surgery care.",
    keyBenefits:
      "Broad spectrum coverage, accelerated healing, single-use vials",
    isActive: false,
  },
];

export const MOCK_VISITS: Visit[] = [
  {
    id: 1n,
    doctorId: 1n,
    date: msToNs(now - day * 0.5),
    outcome: "positive" as never,
    callNotes:
      "Discussed ClearView Drops efficacy data. Dr. Sharma was very receptive and agreed to trial with 10 patients.",
    productsDiscussed: [1n],
    nextVisitDate: msToNs(now + day * 14),
  },
  {
    id: 2n,
    doctorId: 2n,
    date: msToNs(now - day * 2),
    outcome: "neutral" as never,
    callNotes:
      "Reviewed RetinaPro Capsules clinical data. Dr. Mehta requested more comparative studies before prescribing.",
    productsDiscussed: [2n],
    nextVisitDate: msToNs(now + day * 30),
  },
  {
    id: 3n,
    doctorId: 3n,
    date: msToNs(now - day * 4),
    outcome: "positive" as never,
    callNotes:
      "Excellent response to AllerEase Spray presentation. Will recommend to all allergy patients this season.",
    productsDiscussed: [4n],
    nextVisitDate: msToNs(now + day * 7),
  },
  {
    id: 4n,
    doctorId: 4n,
    date: msToNs(now - day * 6),
    outcome: "negative" as never,
    callNotes:
      "Dr. Verma prefers competitor product for now. Need to follow up with more clinical evidence.",
    productsDiscussed: [3n],
    nextVisitDate: msToNs(now + day * 21),
  },
];

export const MOCK_REMINDERS: Reminder[] = [
  {
    id: 1n,
    title: "Follow up with Dr. Sharma",
    note: "Bring latest ClearView Drops clinical trial data and samples",
    dueDate: msToNs(now + day * 2),
    isDone: false,
    linkedDoctorId: 1n,
  },
  {
    id: 2n,
    title: "Submit monthly visit report",
    note: "Compile all visit summaries and outcomes for December",
    dueDate: msToNs(now + day * 5),
    isDone: false,
    linkedDoctorId: undefined,
  },
  {
    id: 3n,
    title: "Conference attendance — AIOS Mumbai",
    note: "All India Ophthalmological Society conference — meet key doctors",
    dueDate: msToNs(now + day * 12),
    isDone: false,
    linkedDoctorId: undefined,
  },
  {
    id: 4n,
    title: "Product samples reorder",
    note: "GlaucoGuard and RetinaPro stock running low, place order",
    dueDate: msToNs(now - day * 1),
    isDone: true,
    linkedDoctorId: undefined,
  },
];
