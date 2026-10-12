// Core Domain Types for AgendaPro

export type AppointmentStatus = 
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type BookingSource = 'public' | 'admin';

export type ConfirmationMode = 'auto' | 'manual';

export interface Barbershop {
  id: string;
  owner_user_id: string;
  name: string;
  slug: string;
  description?: string | null;
  phone: string;
  whatsapp?: string | null;
  address?: string | null;
  logo_url?: string | null;
  timezone: string;
  booking_confirmation_mode: ConfirmationMode;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Barber {
  id: string;
  barbershop_id: string;
  name: string;
  description?: string | null;
  photo_url?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  service_ids?: string[];
}

export interface Service {
  id: string;
  barbershop_id: string;
  name: string;
  description?: string | null;
  price_cents: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BarberService {
  barber_id: string;
  service_id: string;
  barbershop_id: string;
}

export interface BusinessHour {
  id: string;
  barbershop_id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  is_closed: boolean;
  opens_at: string; // "08:00"
  closes_at: string; // "19:00"
}

export interface BarberWorkingHour {
  id: string;
  barber_id: string;
  barbershop_id: string;
  day_of_week: number;
  is_working: boolean;
  starts_at: string; // "08:00"
  ends_at: string; // "18:00"
  break_starts_at?: string | null; // "12:00"
  break_ends_at?: string | null; // "13:00"
}

export interface BarberTimeOff {
  id: string;
  barbershop_id: string;
  barber_id: string;
  starts_at: string; // ISO
  ends_at: string; // ISO
  reason?: string | null;
  created_at: string;
}

export interface Customer {
  id: string;
  barbershop_id: string;
  name: string;
  phone_normalized: string;
  created_at: string;
  updated_at: string;
  total_appointments?: number;
  last_appointment_at?: string | null;
}

export interface Appointment {
  id: string;
  barbershop_id: string;
  barber_id: string;
  service_id: string;
  customer_id: string;
  starts_at: string; // ISO
  ends_at: string; // ISO
  status: AppointmentStatus;
  booking_source: BookingSource;
  price_cents_snapshot: number;
  duration_minutes_snapshot: number;
  service_name_snapshot: string;
  public_code: string;
  created_by_user_id?: string | null;
  created_at: string;
  updated_at: string;

  // Joined relations for UI
  customer?: Customer;
  barber?: Barber;
  service?: Service;
}

export interface AvailabilitySlot {
  time: string; // "09:00"
  starts_at: string; // ISO
  ends_at: string; // ISO
  barber_id: string;
  barber_name: string;
}

export interface DashboardMetrics {
  total_today: number;
  pending: number;
  confirmed: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  estimated_revenue_cents: number;
  next_appointments: Appointment[];
}

export interface UserSession {
  user: {
    id: string;
    email: string;
    name?: string;
  } | null;
  barbershop: Barbershop | null;
  isLoading: boolean;
  isDemo: boolean;
}
