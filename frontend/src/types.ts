/**
 * Auto-generated TypeScript types and Zod schemas from ProjectContract.
 * Model interfaces match the Django backend exactly.
 */
import { z } from 'zod';

// DRF returns a related object either as its pk or nested; parse both to the pk
// so the parsed type matches the number typed FK fields on the interfaces.
const zRelation = z.union([z.coerce.number().int(), z.object({ id: z.coerce.number().int() }).passthrough()]).transform((v) => (typeof v === 'number' ? v : v.id));

// ── User ──
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone: string;
  date_of_birth: string | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export const UserSchema = z.object({
  id: z.coerce.number(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  role: z.string(),
  phone: z.string(),
  date_of_birth: z.string().nullable(),
  email_verified: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
}).passthrough();

// ── Service ──
export interface Service {
  id: number;
  name: string;
  slug: string;
  description: string;
  duration_minutes: number;
  icon: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const ServiceSchema = z.object({
  id: z.coerce.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  duration_minutes: z.coerce.number().int(),
  icon: z.string(),
  is_active: z.boolean(),
  display_order: z.coerce.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
}).passthrough();

// ── DoctorProfile ──
export interface DoctorProfile {
  id: number;
  user: number;
  full_name: string;
  specialty: string;
  bio: string;
  photo: string | null;
  accepts_new_patients: boolean;
  consultation_minutes: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const DoctorProfileSchema = z.object({
  id: z.coerce.number(),
  user: zRelation,
  full_name: z.string(),
  specialty: z.string(),
  bio: z.string(),
  photo: z.string().nullable().nullable(),
  accepts_new_patients: z.boolean(),
  consultation_minutes: z.coerce.number().int(),
  display_order: z.coerce.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
}).passthrough();

// ── ClinicHour ──
export interface ClinicHour {
  id: number;
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
}

export const ClinicHourSchema = z.object({
  id: z.coerce.number(),
  day_of_week: z.coerce.number().int(),
  opens_at: z.string().nullable(),
  closes_at: z.string().nullable(),
  is_closed: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
}).passthrough();

// ── ContactMessage ──
export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  is_handled: boolean;
  created_at: string;
  updated_at: string;
}

export const ContactMessageSchema = z.object({
  id: z.coerce.number(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  message: z.string(),
  is_handled: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
}).passthrough();

// ── Appointment ──
export interface Appointment {
  id: number;
  patient: number;
  doctor: number;
  service: number | null;
  start_time: string;
  end_time: string;
  status: string;
  reason: string;
  checked_in_at: string | null;
  booked_by: number | null;
  created_at: string;
  updated_at: string;
}

export const AppointmentSchema = z.object({
  id: z.coerce.number(),
  patient: zRelation,
  doctor: zRelation,
  service: zRelation.nullable(),
  start_time: z.string(),
  end_time: z.string(),
  status: z.string(),
  reason: z.string(),
  checked_in_at: z.string().nullable(),
  booked_by: zRelation.nullable(),
  created_at: z.string(),
  updated_at: z.string(),
}).passthrough();

// ── VisitNote ──
export interface VisitNote {
  id: number;
  appointment: number;
  patient: number;
  doctor: number;
  chief_complaint: string;
  diagnosis: string;
  notes: string;
  follow_up_instructions: string;
  created_at: string;
  updated_at: string;
}

export const VisitNoteSchema = z.object({
  id: z.coerce.number(),
  appointment: zRelation,
  patient: zRelation,
  doctor: zRelation,
  chief_complaint: z.string(),
  diagnosis: z.string(),
  notes: z.string(),
  follow_up_instructions: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
}).passthrough();

// ── Prescription ──
export interface Prescription {
  id: number;
  patient: number;
  doctor: number;
  appointment: number | null;
  product: number | null;
  medicine_name: string;
  dosage: string;
  instructions: string;
  notes: string;
  refills_allowed: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const PrescriptionSchema = z.object({
  id: z.coerce.number(),
  patient: zRelation,
  doctor: zRelation,
  appointment: zRelation.nullable(),
  product: zRelation.nullable(),
  medicine_name: z.string(),
  dosage: z.string(),
  instructions: z.string(),
  notes: z.string(),
  refills_allowed: z.coerce.number().int(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
}).passthrough();

// ── MedicalDocument ──
export interface MedicalDocument {
  id: number;
  patient: number;
  title: string;
  document_type: string;
  file: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
  updated_at: string;
}

export const MedicalDocumentSchema = z.object({
  id: z.coerce.number(),
  patient: zRelation,
  title: z.string(),
  document_type: z.string(),
  file: z.string().nullable(),
  content_type: z.string(),
  size_bytes: z.coerce.number().int().nonnegative(),
  created_at: z.string(),
  updated_at: z.string(),
}).passthrough();

// ── Invoice ──
export interface Invoice {
  id: number;
  user: number;
  appointment: number | null;
  created_by: number | null;
  description: string;
  total_amount: number;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  stripe_session_id: string | null;
}

export const InvoiceSchema = z.object({
  id: z.coerce.number(),
  user: zRelation,
  appointment: zRelation.nullable(),
  created_by: zRelation.nullable(),
  description: z.string(),
  total_amount: z.coerce.number(),
  status: z.string(),
  due_date: z.string().nullable(),
  paid_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  stripe_session_id: z.string().nullable(),
}).passthrough();

// ── Product ──
export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  stock_quantity: number;
  image: string | null;
  requires_prescription: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const ProductSchema = z.object({
  id: z.coerce.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  category: z.string(),
  price: z.coerce.number(),
  stock_quantity: z.coerce.number().int().nonnegative(),
  image: z.string().nullable().nullable(),
  requires_prescription: z.boolean(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
}).passthrough();

// ── Order ──
export interface Order {
  id: number;
  user: number;
  prescription: number | null;
  order_type: string;
  fulfillment_method: string;
  status: string;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  delivery_address: string;
  phone: string;
  notes: string;
  approved_by: number | null;
  approved_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  stripe_session_id: string | null;
}

export const OrderSchema = z.object({
  id: z.coerce.number(),
  user: zRelation,
  prescription: zRelation.nullable(),
  order_type: z.string(),
  fulfillment_method: z.string(),
  status: z.string(),
  subtotal: z.coerce.number(),
  delivery_fee: z.coerce.number(),
  total_amount: z.coerce.number(),
  delivery_address: z.string(),
  phone: z.string(),
  notes: z.string(),
  approved_by: zRelation.nullable(),
  approved_at: z.string().nullable(),
  paid_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  stripe_session_id: z.string().nullable(),
}).passthrough();

// ── OrderItem ──
export interface OrderItem {
  id: number;
  order: number;
  product: number | null;
  medicine_name: string;
  quantity: number;
  unit_price: number;
  created_at: string;
  updated_at: string;
}

export const OrderItemSchema = z.object({
  id: z.coerce.number(),
  order: zRelation,
  product: zRelation.nullable(),
  medicine_name: z.string(),
  quantity: z.coerce.number().int().nonnegative(),
  unit_price: z.coerce.number(),
  created_at: z.string(),
  updated_at: z.string(),
}).passthrough();

// ── Paginated Response ──
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    count: z.coerce.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(itemSchema),
  });

