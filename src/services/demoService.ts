// In-Browser Mock / Demo Service for AgendaPro
// Provides complete, reactive, and persistent state using LocalStorage
// Implements exact domain validation and conflict prevention identical to PostgreSQL

import { IApiService, PublicBookingInput, PublicBookingResult } from './api';
import { getInitialDemoState } from './demoData';
import {
  Barbershop,
  Barber,
  Service,
  BarberService,
  BusinessHour,
  BarberWorkingHour,
  BarberTimeOff,
  Customer,
  Appointment,
  AppointmentStatus,
  AvailabilitySlot,
  DashboardMetrics,
} from '../types';
import { normalizePhoneBR } from '../utils/phone';
import { generatePublicCode } from '../utils/publicCode';
import { calculateAvailableSlots, intervalsOverlap, isStatusBlocking } from '../utils/availability';
import { toISODateString } from '../utils/date';

const STORAGE_KEY = 'agendapro_demo_database_v2_anthonys';

interface DemoDatabase {
  barbershop: Barbershop;
  barbers: Barber[];
  services: Service[];
  barberServices: BarberService[];
  businessHours: BusinessHour[];
  barberWorkingHours: BarberWorkingHour[];
  barberTimeOff: BarberTimeOff[];
  customers: Customer[];
  appointments: Appointment[];
  ownerUser: {
    id: string;
    email: string;
    name: string;
  };
}

function loadDatabase(): DemoDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.barbershop?.name === "Anthony's Barbearia") {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed reading demo database from localStorage, resetting to initial seed.', e);
  }
  const initial = getInitialDemoState();
  saveDatabase(initial);
  return initial;
}

function saveDatabase(db: DemoDatabase): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.error('Failed persisting demo database to localStorage', e);
  }
}

export class DemoService implements IApiService {
  private db: DemoDatabase;

  constructor() {
    this.db = loadDatabase();
  }

  // ----------------------------------------------------
  // AUTH
  // ----------------------------------------------------
  async signIn(email: string): Promise<{ user: any; error?: string }> {
    return {
      user: {
        id: this.db.ownerUser.id,
        email: email || this.db.ownerUser.email,
        name: this.db.ownerUser.name,
      },
    };
  }

  async signUp(email: string, _password?: string, name?: string): Promise<{ user: any; error?: string }> {
    this.db.ownerUser.email = email;
    if (name) this.db.ownerUser.name = name;
    saveDatabase(this.db);
    return {
      user: {
        id: this.db.ownerUser.id,
        email: this.db.ownerUser.email,
        name: this.db.ownerUser.name,
      },
    };
  }

  async signOut(): Promise<void> {
    // Demo sign out
  }

  async getCurrentUser(): Promise<any> {
    return {
      id: this.db.ownerUser.id,
      email: this.db.ownerUser.email,
      name: this.db.ownerUser.name,
    };
  }

  async resetPassword(_email: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  // ----------------------------------------------------
  // BARBERSHOP
  // ----------------------------------------------------
  async getOwnerBarbershop(): Promise<Barbershop | null> {
    return this.db.barbershop;
  }

  async updateBarbershop(id: string, data: Partial<Barbershop>): Promise<Barbershop> {
    if (this.db.barbershop.id === id) {
      this.db.barbershop = {
        ...this.db.barbershop,
        ...data,
        updated_at: new Date().toISOString(),
      };
      saveDatabase(this.db);
    }
    return this.db.barbershop;
  }

  async getPublicBarbershop(slug: string): Promise<Barbershop | null> {
    const s = slug?.toLowerCase();
    if (
      (this.db.barbershop.slug === slug ||
        s === 'anthonys' ||
        s === 'anthonys-barbearia' ||
        s === 'mestre-navalha' ||
        s === 'navalha-de-ouro') &&
      this.db.barbershop.is_active
    ) {
      return this.db.barbershop;
    }
    return null;
  }

  async setupOnboarding(data: {
    shop: Partial<Barbershop>;
    firstService?: Partial<Service>;
    firstBarber?: Partial<Barber>;
  }): Promise<Barbershop> {
    this.db.barbershop = {
      ...this.db.barbershop,
      ...data.shop,
      updated_at: new Date().toISOString(),
    };

    if (data.firstService && data.firstService.name) {
      const srv: Service = {
        id: `srv-${Date.now()}`,
        barbershop_id: this.db.barbershop.id,
        name: data.firstService.name,
        price_cents: data.firstService.price_cents ?? 4000,
        duration_minutes: data.firstService.duration_minutes ?? 30,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.db.services.push(srv);
    }

    if (data.firstBarber && data.firstBarber.name) {
      const brb: Barber = {
        id: `barber-${Date.now()}`,
        barbershop_id: this.db.barbershop.id,
        name: data.firstBarber.name,
        is_active: true,
        sort_order: this.db.barbers.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        service_ids: this.db.services.map((s) => s.id),
      };
      this.db.barbers.push(brb);
    }

    saveDatabase(this.db);
    return this.db.barbershop;
  }

  // ----------------------------------------------------
  // SERVICES
  // ----------------------------------------------------
  async listServices(shopId: string, includeInactive = false): Promise<Service[]> {
    return this.db.services.filter(
      (s) => s.barbershop_id === shopId && (includeInactive || s.is_active)
    );
  }

  async createService(
    shopId: string,
    data: Omit<Service, 'id' | 'barbershop_id' | 'created_at' | 'updated_at'>
  ): Promise<Service> {
    const srv: Service = {
      ...data,
      id: `srv-${Date.now()}`,
      barbershop_id: shopId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.db.services.push(srv);

    // Automatically link to existing barbers by default
    this.db.barbers.forEach((b) => {
      if (!b.service_ids) b.service_ids = [];
      b.service_ids.push(srv.id);
    });

    saveDatabase(this.db);
    return srv;
  }

  async updateService(id: string, data: Partial<Service>): Promise<Service> {
    const idx = this.db.services.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Serviço não encontrado.');

    this.db.services[idx] = {
      ...this.db.services[idx],
      ...data,
      updated_at: new Date().toISOString(),
    };
    saveDatabase(this.db);
    return this.db.services[idx];
  }

  async toggleServiceActive(id: string, isActive: boolean): Promise<Service> {
    return this.updateService(id, { is_active: isActive });
  }

  // ----------------------------------------------------
  // BARBERS
  // ----------------------------------------------------
  async listBarbers(shopId: string, includeInactive = false): Promise<Barber[]> {
    return this.db.barbers.filter(
      (b) => b.barbershop_id === shopId && (includeInactive || b.is_active)
    );
  }

  async createBarber(
    shopId: string,
    data: Omit<Barber, 'id' | 'barbershop_id' | 'created_at' | 'updated_at'>
  ): Promise<Barber> {
    const barberId = `barber-${Date.now()}`;
    const brb: Barber = {
      ...data,
      id: barberId,
      barbershop_id: shopId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      service_ids: data.service_ids || this.db.services.map((s) => s.id),
    };
    this.db.barbers.push(brb);

    // Create default working hours (Mon-Sat 08:00 - 18:00, lunch 12:00-13:00)
    for (let d = 0; d <= 6; d++) {
      this.db.barberWorkingHours.push({
        id: `bwh-${barberId}-${d}`,
        barber_id: barberId,
        barbershop_id: shopId,
        day_of_week: d,
        is_working: d !== 0,
        starts_at: '08:00',
        ends_at: '18:00',
        break_starts_at: d !== 0 ? '12:00' : null,
        break_ends_at: d !== 0 ? '13:00' : null,
      });
    }

    saveDatabase(this.db);
    return brb;
  }

  async updateBarber(id: string, data: Partial<Barber>): Promise<Barber> {
    const idx = this.db.barbers.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error('Barbeiro não encontrado.');

    this.db.barbers[idx] = {
      ...this.db.barbers[idx],
      ...data,
      updated_at: new Date().toISOString(),
    };
    saveDatabase(this.db);
    return this.db.barbers[idx];
  }

  async toggleBarberActive(id: string, isActive: boolean): Promise<Barber> {
    return this.updateBarber(id, { is_active: isActive });
  }

  async assignBarberServices(barberId: string, serviceIds: string[]): Promise<void> {
    const barber = this.db.barbers.find((b) => b.id === barberId);
    if (barber) {
      barber.service_ids = serviceIds;
      barber.updated_at = new Date().toISOString();
      saveDatabase(this.db);
    }
  }

  async getBarberWorkingHours(barberId: string): Promise<BarberWorkingHour[]> {
    return this.db.barberWorkingHours.filter((wh) => wh.barber_id === barberId);
  }

  async updateBarberWorkingHours(barberId: string, hours: BarberWorkingHour[]): Promise<void> {
    this.db.barberWorkingHours = this.db.barberWorkingHours.filter((wh) => wh.barber_id !== barberId);
    this.db.barberWorkingHours.push(...hours);
    saveDatabase(this.db);
  }

  async getBarberTimeOff(barberId: string): Promise<BarberTimeOff[]> {
    return this.db.barberTimeOff.filter((to) => to.barber_id === barberId);
  }

  async addBarberTimeOff(data: Omit<BarberTimeOff, 'id' | 'created_at'>): Promise<BarberTimeOff> {
    const timeOff: BarberTimeOff = {
      ...data,
      id: `to-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.db.barberTimeOff.push(timeOff);
    saveDatabase(this.db);
    return timeOff;
  }

  async deleteBarberTimeOff(id: string): Promise<void> {
    this.db.barberTimeOff = this.db.barberTimeOff.filter((to) => to.id !== id);
    saveDatabase(this.db);
  }

  // ----------------------------------------------------
  // BUSINESS HOURS
  // ----------------------------------------------------
  async getBusinessHours(shopId: string): Promise<BusinessHour[]> {
    return this.db.businessHours.filter((bh) => bh.barbershop_id === shopId);
  }

  async updateBusinessHours(shopId: string, hours: BusinessHour[]): Promise<void> {
    this.db.businessHours = this.db.businessHours.filter((bh) => bh.barbershop_id !== shopId);
    this.db.businessHours.push(...hours);
    saveDatabase(this.db);
  }

  // ----------------------------------------------------
  // CUSTOMERS
  // ----------------------------------------------------
  async listCustomers(shopId: string, search = ''): Promise<Customer[]> {
    const q = search.trim().toLowerCase();
    const cleanPhone = normalizePhoneBR(search);

    return this.db.customers
      .filter((c) => {
        if (c.barbershop_id !== shopId) return false;
        if (!q) return true;
        return (
          c.name.toLowerCase().includes(q) ||
          c.phone_normalized.includes(cleanPhone)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getCustomerById(id: string): Promise<{ customer: Customer; history: Appointment[] } | null> {
    const customer = this.db.customers.find((c) => c.id === id);
    if (!customer) return null;

    const history = this.db.appointments
      .filter((a) => a.customer_id === id)
      .map((a) => this.hydrateAppointment(a))
      .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());

    return { customer, history };
  }

  async createCustomer(shopId: string, name: string, phone: string): Promise<Customer> {
    const phoneNorm = normalizePhoneBR(phone);
    let cust = this.db.customers.find(
      (c) => c.barbershop_id === shopId && c.phone_normalized === phoneNorm
    );
    if (!cust) {
      cust = {
        id: `cust-${Date.now()}`,
        barbershop_id: shopId,
        name: name.trim(),
        phone_normalized: phoneNorm,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_appointments: 0,
      };
      this.db.customers.push(cust);
      saveDatabase(this.db);
    }
    return cust;
  }

  async updateCustomer(id: string, name: string, phone: string): Promise<Customer> {
    const cust = this.db.customers.find((c) => c.id === id);
    if (!cust) throw new Error('Cliente não encontrado.');

    cust.name = name.trim();
    cust.phone_normalized = normalizePhoneBR(phone);
    cust.updated_at = new Date().toISOString();
    saveDatabase(this.db);
    return cust;
  }

  // ----------------------------------------------------
  // APPOINTMENTS
  // ----------------------------------------------------
  private hydrateAppointment(appt: Appointment): Appointment {
    return {
      ...appt,
      customer: this.db.customers.find((c) => c.id === appt.customer_id),
      barber: this.db.barbers.find((b) => b.id === appt.barber_id),
      service: this.db.services.find((s) => s.id === appt.service_id),
    };
  }

  async listAppointmentsByDate(shopId: string, dateStr: string): Promise<Appointment[]> {
    return this.db.appointments
      .filter((a) => {
        if (a.barbershop_id !== shopId) return false;
        const apptDate = toISODateString(new Date(a.starts_at));
        return apptDate === dateStr;
      })
      .map((a) => this.hydrateAppointment(a))
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }

  async listAppointmentsByRange(shopId: string, startDateStr: string, endDateStr: string): Promise<Appointment[]> {
    const start = new Date(startDateStr).getTime();
    const end = new Date(endDateStr).getTime();

    return this.db.appointments
      .filter((a) => {
        if (a.barbershop_id !== shopId) return false;
        const apptTime = new Date(a.starts_at).getTime();
        return apptTime >= start && apptTime <= end;
      })
      .map((a) => this.hydrateAppointment(a))
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }

  async createManualAppointment(data: {
    barbershop_id: string;
    barber_id: string;
    service_id: string;
    customer_id?: string;
    customer_name?: string;
    customer_phone?: string;
    starts_at: string;
  }): Promise<{ success: boolean; appointment?: Appointment; message?: string }> {
    const service = this.db.services.find((s) => s.id === data.service_id);
    if (!service || !service.is_active) {
      return { success: false, message: 'Serviço inválido ou desativado.' };
    }

    const barber = this.db.barbers.find((b) => b.id === data.barber_id);
    if (!barber || !barber.is_active) {
      return { success: false, message: 'Profissional inválido ou desativado.' };
    }

    const startsAt = new Date(data.starts_at);
    const endsAt = new Date(startsAt.getTime() + service.duration_minutes * 60 * 1000);

    // Conflict check (Section 10.7)
    const hasConflict = this.db.appointments.some((a) => {
      if (a.barber_id !== data.barber_id) return false;
      if (!isStatusBlocking(a.status)) return false;

      const aStart = new Date(a.starts_at);
      const aEnd = new Date(a.ends_at);
      return intervalsOverlap(startsAt, endsAt, aStart, aEnd);
    });

    if (hasConflict) {
      return {
        success: false,
        message: 'Existe um conflito de horário para este barbeiro. Escolha outro horário.',
      };
    }

    // Get or create customer
    let customerId = data.customer_id;
    if (!customerId) {
      if (!data.customer_name || !data.customer_phone) {
        return { success: false, message: 'Informe o nome e telefone do cliente.' };
      }
      const cust = await this.createCustomer(
        data.barbershop_id,
        data.customer_name,
        data.customer_phone
      );
      customerId = cust.id;
    }

    const newAppt: Appointment = {
      id: `appt-${Date.now()}`,
      barbershop_id: data.barbershop_id,
      barber_id: data.barber_id,
      service_id: data.service_id,
      customer_id: customerId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: 'confirmed',
      booking_source: 'admin',
      price_cents_snapshot: service.price_cents,
      duration_minutes_snapshot: service.duration_minutes,
      service_name_snapshot: service.name,
      public_code: generatePublicCode(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.db.appointments.push(newAppt);
    saveDatabase(this.db);

    return {
      success: true,
      appointment: this.hydrateAppointment(newAppt),
    };
  }

  async updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    const idx = this.db.appointments.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Agendamento não encontrado.');

    this.db.appointments[idx] = {
      ...this.db.appointments[idx],
      status,
      updated_at: new Date().toISOString(),
    };
    saveDatabase(this.db);
    return this.hydrateAppointment(this.db.appointments[idx]);
  }

  async cancelAppointment(id: string, _reason?: string): Promise<Appointment> {
    return this.updateAppointmentStatus(id, 'cancelled');
  }

  // ----------------------------------------------------
  // DASHBOARD
  // ----------------------------------------------------
  async getDashboardMetrics(shopId: string, dateStr: string): Promise<DashboardMetrics> {
    const dayAppointments = this.db.appointments.filter((a) => {
      if (a.barbershop_id !== shopId) return false;
      const apptDate = toISODateString(new Date(a.starts_at));
      return apptDate === dateStr;
    });

    let pending = 0;
    let confirmed = 0;
    let in_progress = 0;
    let completed = 0;
    let cancelled = 0;
    let revenueCents = 0;

    dayAppointments.forEach((a) => {
      if (a.status === 'pending') pending++;
      if (a.status === 'confirmed') confirmed++;
      if (a.status === 'in_progress') in_progress++;
      if (a.status === 'completed') completed++;
      if (a.status === 'cancelled') cancelled++;

      // Revenue estimate: completed or confirmed or in_progress (Section 7.1)
      if (a.status === 'completed' || a.status === 'confirmed' || a.status === 'in_progress') {
        revenueCents += a.price_cents_snapshot;
      }
    });

    const nowTime = new Date().getTime();
    const nextAppointments = this.db.appointments
      .filter((a) => {
        if (a.barbershop_id !== shopId) return false;
        if (!isStatusBlocking(a.status)) return false;
        return new Date(a.ends_at).getTime() >= nowTime;
      })
      .map((a) => this.hydrateAppointment(a))
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
      .slice(0, 5);

    return {
      total_today: dayAppointments.length,
      pending,
      confirmed,
      in_progress,
      completed,
      cancelled,
      estimated_revenue_cents: revenueCents,
      next_appointments: nextAppointments,
    };
  }

  // ----------------------------------------------------
  // PUBLIC BOOKING
  // ----------------------------------------------------
  async getPublicAvailableSlots(
    shopId: string,
    serviceId: string,
    barberId: string | null | undefined,
    dateStr: string
  ): Promise<AvailabilitySlot[]> {
    const service = this.db.services.find((s) => s.id === serviceId && s.is_active);
    if (!service) return [];

    return calculateAvailableSlots({
      date: dateStr,
      durationMinutes: service.duration_minutes,
      serviceId,
      barbers: this.db.barbers,
      businessHours: this.db.businessHours.filter((bh) => bh.barbershop_id === shopId),
      barberWorkingHours: this.db.barberWorkingHours.filter((wh) => wh.barbershop_id === shopId),
      barberTimeOff: this.db.barberTimeOff.filter((to) => to.barbershop_id === shopId),
      existingAppointments: this.db.appointments.filter((a) => a.barbershop_id === shopId),
      selectedBarberId: barberId,
      now: new Date(),
    });
  }

  async bookPublicAppointment(input: PublicBookingInput): Promise<PublicBookingResult> {
    // 1. Spam honeypot protection (Section 14.7)
    if (input.honeypot) {
      return { success: false, message: 'Requisição inválida.' };
    }

    const { barbershop_id, service_id, starts_at, customer_name, customer_phone } = input;
    let barberId = input.barber_id;

    const shop = this.db.barbershop;
    if (shop.id !== barbershop_id || !shop.is_active) {
      return { success: false, code: 'SHOP_NOT_FOUND', message: 'Barbearia indisponível.' };
    }

    const service = this.db.services.find((s) => s.id === service_id && s.is_active);
    if (!service) {
      return { success: false, code: 'SERVICE_NOT_FOUND', message: 'Serviço não encontrado ou desativado.' };
    }

    const start = new Date(starts_at);
    if (start.getTime() <= Date.now()) {
      return { success: false, code: 'PAST_TIME', message: 'Não é possível agendar horários no passado.' };
    }

    const end = new Date(start.getTime() + service.duration_minutes * 60 * 1000);

    // If "any" barber chosen, find first available barber who offers service
    if (!barberId) {
      const candidateBarbers = this.db.barbers.filter((b) => {
        if (!b.is_active) return false;
        if (b.service_ids && !b.service_ids.includes(service_id)) return false;

        // Check active appointment overlap
        const hasConflict = this.db.appointments.some((a) => {
          if (a.barber_id !== b.id) return false;
          if (!isStatusBlocking(a.status)) return false;
          return intervalsOverlap(start, end, new Date(a.starts_at), new Date(a.ends_at));
        });
        if (hasConflict) return false;

        // Check time off overlap
        const hasTimeOff = this.db.barberTimeOff.some((to) => {
          if (to.barber_id !== b.id) return false;
          return intervalsOverlap(start, end, new Date(to.starts_at), new Date(to.ends_at));
        });
        if (hasTimeOff) return false;

        return true;
      });

      if (candidateBarbers.length === 0) {
        return {
          success: false,
          code: 'NO_BARBER_AVAILABLE',
          message: 'Nenhum profissional disponível para este horário.',
        };
      }
      barberId = candidateBarbers[0].id;
    } else {
      // Validate chosen barber
      const barber = this.db.barbers.find((b) => b.id === barberId && b.is_active);
      if (!barber) {
        return { success: false, code: 'BARBER_NOT_FOUND', message: 'Profissional não disponível.' };
      }
      if (barber.service_ids && !barber.service_ids.includes(service_id)) {
        return {
          success: false,
          code: 'BARBER_SERVICE_MISMATCH',
          message: 'O profissional selecionado não realiza este serviço.',
        };
      }

      // Check conflict (Section 10.7)
      const hasConflict = this.db.appointments.some((a) => {
        if (a.barber_id !== barberId) return false;
        if (!isStatusBlocking(a.status)) return false;
        return intervalsOverlap(start, end, new Date(a.starts_at), new Date(a.ends_at));
      });

      if (hasConflict) {
        return {
          success: false,
          code: 'SLOT_CONFLICT',
          message: 'O horário selecionado acabou de ser ocupado. Por favor, escolha outro horário.',
        };
      }
    }

    // Upsert customer by normalized phone
    const phoneNorm = normalizePhoneBR(customer_phone);
    let customer = this.db.customers.find(
      (c) => c.barbershop_id === barbershop_id && c.phone_normalized === phoneNorm
    );
    if (!customer) {
      customer = {
        id: `cust-${Date.now()}`,
        barbershop_id,
        name: customer_name.trim(),
        phone_normalized: phoneNorm,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_appointments: 1,
        last_appointment_at: toISODateString(start),
      };
      this.db.customers.push(customer);
    } else {
      customer.name = customer_name.trim();
      customer.total_appointments = (customer.total_appointments || 0) + 1;
      customer.last_appointment_at = toISODateString(start);
      customer.updated_at = new Date().toISOString();
    }

    const initialStatus: AppointmentStatus =
      shop.booking_confirmation_mode === 'manual' ? 'pending' : 'confirmed';

    const newAppt: Appointment = {
      id: `appt-${Date.now()}`,
      barbershop_id,
      barber_id: barberId,
      service_id,
      customer_id: customer.id,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      status: initialStatus,
      booking_source: 'public',
      price_cents_snapshot: service.price_cents,
      duration_minutes_snapshot: service.duration_minutes,
      service_name_snapshot: service.name,
      public_code: generatePublicCode(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.db.appointments.push(newAppt);
    saveDatabase(this.db);

    return {
      success: true,
      appointment: this.hydrateAppointment(newAppt),
    };
  }
}
