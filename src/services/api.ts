import {
  Barbershop,
  Barber,
  Service,
  BusinessHour,
  BarberWorkingHour,
  BarberTimeOff,
  Customer,
  Appointment,
  AppointmentStatus,
  AvailabilitySlot,
  DashboardMetrics,
} from '../types';

export interface PublicBookingInput {
  barbershop_id: string;
  service_id: string;
  barber_id?: string | null;
  starts_at: string; // ISO
  customer_name: string;
  customer_phone: string;
  honeypot?: string;
}

export interface PublicBookingResult {
  success: boolean;
  code?: string;
  message?: string;
  appointment?: Appointment;
}

export interface IApiService {
  // Auth
  signIn(email: string, password?: string): Promise<{ user: any; error?: string }>;
  signUp(email: string, password?: string, name?: string): Promise<{ user: any; error?: string }>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<any>;
  resetPassword(email: string): Promise<{ success: boolean; error?: string }>;

  // Barbershop
  getOwnerBarbershop(): Promise<Barbershop | null>;
  updateBarbershop(id: string, data: Partial<Barbershop>): Promise<Barbershop>;
  getPublicBarbershop(slug: string): Promise<Barbershop | null>;
  setupOnboarding(data: {
    shop: Partial<Barbershop>;
    firstService?: Partial<Service>;
    firstBarber?: Partial<Barber>;
  }): Promise<Barbershop>;

  // Services
  listServices(shopId: string, includeInactive?: boolean): Promise<Service[]>;
  createService(shopId: string, data: Omit<Service, 'id' | 'barbershop_id' | 'created_at' | 'updated_at'>): Promise<Service>;
  updateService(id: string, data: Partial<Service>): Promise<Service>;
  toggleServiceActive(id: string, isActive: boolean): Promise<Service>;

  // Barbers
  listBarbers(shopId: string, includeInactive?: boolean): Promise<Barber[]>;
  createBarber(shopId: string, data: Omit<Barber, 'id' | 'barbershop_id' | 'created_at' | 'updated_at'>): Promise<Barber>;
  updateBarber(id: string, data: Partial<Barber>): Promise<Barber>;
  toggleBarberActive(id: string, isActive: boolean): Promise<Barber>;
  assignBarberServices(barberId: string, serviceIds: string[]): Promise<void>;
  getBarberWorkingHours(barberId: string): Promise<BarberWorkingHour[]>;
  updateBarberWorkingHours(barberId: string, hours: BarberWorkingHour[]): Promise<void>;
  getBarberTimeOff(barberId: string): Promise<BarberTimeOff[]>;
  addBarberTimeOff(data: Omit<BarberTimeOff, 'id' | 'created_at'>): Promise<BarberTimeOff>;
  deleteBarberTimeOff(id: string): Promise<void>;

  // Business Hours
  getBusinessHours(shopId: string): Promise<BusinessHour[]>;
  updateBusinessHours(shopId: string, hours: BusinessHour[]): Promise<void>;

  // Customers
  listCustomers(shopId: string, search?: string): Promise<Customer[]>;
  getCustomerById(id: string): Promise<{ customer: Customer; history: Appointment[] } | null>;
  createCustomer(shopId: string, name: string, phone: string): Promise<Customer>;
  updateCustomer(id: string, name: string, phone: string): Promise<Customer>;

  // Appointments
  listAppointmentsByDate(shopId: string, date: string): Promise<Appointment[]>;
  listAppointmentsByRange(shopId: string, startDate: string, endDate: string): Promise<Appointment[]>;
  createManualAppointment(data: {
    barbershop_id: string;
    barber_id: string;
    service_id: string;
    customer_id?: string;
    customer_name?: string;
    customer_phone?: string;
    starts_at: string;
  }): Promise<{ success: boolean; appointment?: Appointment; message?: string }>;
  updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<Appointment>;
  cancelAppointment(id: string, reason?: string): Promise<Appointment>;

  // Dashboard
  getDashboardMetrics(shopId: string, dateStr: string): Promise<DashboardMetrics>;

  // Public Booking
  getPublicAvailableSlots(
    shopId: string,
    serviceId: string,
    barberId: string | null | undefined,
    dateStr: string
  ): Promise<AvailabilitySlot[]>;
  bookPublicAppointment(input: PublicBookingInput): Promise<PublicBookingResult>;
}
