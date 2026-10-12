// Real Supabase Data Access Implementation for AgendaPro
// Uses PostgreSQL RLS policies and atomic RPC procedures.

import { supabase } from './supabaseClient';
import { IApiService, PublicBookingInput, PublicBookingResult } from './api';
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
import { normalizePhoneBR } from '../utils/phone';

export class SupabaseService implements IApiService {
  private get client() {
    if (!supabase) {
      throw new Error('Supabase client não está inicializado. Configure as variáveis de ambiente.');
    }
    return supabase;
  }

  // ----------------------------------------------------
  // AUTH
  // ----------------------------------------------------
  async signIn(email: string, password = ''): Promise<{ user: any; error?: string }> {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) return { user: null, error: error.message };
    return { user: data.user };
  }

  async signUp(email: string, password = '', name?: string): Promise<{ user: any; error?: string }> {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return { user: null, error: error.message };
    return { user: data.user };
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }

  async getCurrentUser(): Promise<any> {
    const { data } = await this.client.auth.getUser();
    return data?.user || null;
  }

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await this.client.auth.resetPasswordForEmail(email);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  // ----------------------------------------------------
  // BARBERSHOP
  // ----------------------------------------------------
  async getOwnerBarbershop(): Promise<Barbershop | null> {
    const user = await this.getCurrentUser();
    if (!user) return null;

    const { data, error } = await this.client
      .from('barbershops')
      .select('*')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (error || !data) return null;
    return data as Barbershop;
  }

  async updateBarbershop(id: string, data: Partial<Barbershop>): Promise<Barbershop> {
    const { data: updated, error } = await this.client
      .from('barbershops')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated as Barbershop;
  }

  async getPublicBarbershop(slug: string): Promise<Barbershop | null> {
    const { data, error } = await this.client
      .from('barbershops')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) return null;
    return data as Barbershop;
  }

  async setupOnboarding(data: {
    shop: Partial<Barbershop>;
    firstService?: Partial<Service>;
    firstBarber?: Partial<Barber>;
  }): Promise<Barbershop> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado.');

    const { data: shop, error: shopErr } = await this.client
      .from('barbershops')
      .insert({
        ...data.shop,
        owner_user_id: user.id,
      })
      .select()
      .single();

    if (shopErr) throw new Error(shopErr.message);

    // Initial business hours
    const defaultHours = [
      { barbershop_id: shop.id, day_of_week: 0, is_closed: true, opens_at: '08:00', closes_at: '18:00' },
      { barbershop_id: shop.id, day_of_week: 1, is_closed: false, opens_at: '08:00', closes_at: '19:00' },
      { barbershop_id: shop.id, day_of_week: 2, is_closed: false, opens_at: '08:00', closes_at: '19:00' },
      { barbershop_id: shop.id, day_of_week: 3, is_closed: false, opens_at: '08:00', closes_at: '19:00' },
      { barbershop_id: shop.id, day_of_week: 4, is_closed: false, opens_at: '08:00', closes_at: '19:00' },
      { barbershop_id: shop.id, day_of_week: 5, is_closed: false, opens_at: '08:00', closes_at: '20:00' },
      { barbershop_id: shop.id, day_of_week: 6, is_closed: false, opens_at: '08:00', closes_at: '18:00' },
    ];
    await this.client.from('business_hours').insert(defaultHours);

    let firstServiceId: string | null = null;
    if (data.firstService && data.firstService.name) {
      const { data: srv } = await this.client
        .from('services')
        .insert({
          ...data.firstService,
          barbershop_id: shop.id,
        })
        .select()
        .single();
      if (srv) firstServiceId = srv.id;
    }

    if (data.firstBarber && data.firstBarber.name) {
      const { data: brb } = await this.client
        .from('barbers')
        .insert({
          ...data.firstBarber,
          barbershop_id: shop.id,
        })
        .select()
        .single();

      if (brb && firstServiceId) {
        await this.client.from('barber_services').insert({
          barber_id: brb.id,
          service_id: firstServiceId,
          barbershop_id: shop.id,
        });
      }
    }

    return shop as Barbershop;
  }

  // ----------------------------------------------------
  // SERVICES
  // ----------------------------------------------------
  async listServices(shopId: string, includeInactive = false): Promise<Service[]> {
    let query = this.client.from('services').select('*').eq('barbershop_id', shopId);
    if (!includeInactive) query = query.eq('is_active', true);

    const { data, error } = await query.order('name');
    if (error) throw new Error(error.message);
    return (data || []) as Service[];
  }

  async createService(
    shopId: string,
    data: Omit<Service, 'id' | 'barbershop_id' | 'created_at' | 'updated_at'>
  ): Promise<Service> {
    const { data: srv, error } = await this.client
      .from('services')
      .insert({ ...data, barbershop_id: shopId })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return srv as Service;
  }

  async updateService(id: string, data: Partial<Service>): Promise<Service> {
    const { data: srv, error } = await this.client
      .from('services')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return srv as Service;
  }

  async toggleServiceActive(id: string, isActive: boolean): Promise<Service> {
    return this.updateService(id, { is_active: isActive });
  }

  // ----------------------------------------------------
  // BARBERS
  // ----------------------------------------------------
  async listBarbers(shopId: string, includeInactive = false): Promise<Barber[]> {
    let query = this.client.from('barbers').select('*, barber_services(service_id)').eq('barbershop_id', shopId);
    if (!includeInactive) query = query.eq('is_active', true);

    const { data, error } = await query.order('sort_order').order('name');
    if (error) throw new Error(error.message);

    return (data || []).map((b: any) => ({
      ...b,
      service_ids: b.barber_services?.map((bs: any) => bs.service_id) || [],
    })) as Barber[];
  }

  async createBarber(
    shopId: string,
    data: Omit<Barber, 'id' | 'barbershop_id' | 'created_at' | 'updated_at'>
  ): Promise<Barber> {
    const { service_ids, ...barberData } = data;
    const { data: brb, error } = await this.client
      .from('barbers')
      .insert({ ...barberData, barbershop_id: shopId })
      .select()
      .single();

    if (error) throw new Error(error.message);

    if (service_ids && service_ids.length > 0) {
      await this.assignBarberServices(brb.id, service_ids);
    }

    return brb as Barber;
  }

  async updateBarber(id: string, data: Partial<Barber>): Promise<Barber> {
    const { service_ids, ...barberData } = data;
    const { data: brb, error } = await this.client
      .from('barbers')
      .update({ ...barberData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    if (service_ids) {
      await this.assignBarberServices(id, service_ids);
    }

    return brb as Barber;
  }

  async toggleBarberActive(id: string, isActive: boolean): Promise<Barber> {
    return this.updateBarber(id, { is_active: isActive });
  }

  async assignBarberServices(barberId: string, serviceIds: string[]): Promise<void> {
    // Delete existing mappings
    await this.client.from('barber_services').delete().eq('barber_id', barberId);

    if (serviceIds.length === 0) return;

    // Get barber shop id
    const { data: barber } = await this.client.from('barbers').select('barbershop_id').eq('id', barberId).single();
    if (!barber) return;

    const rows = serviceIds.map((sid) => ({
      barber_id: barberId,
      service_id: sid,
      barbershop_id: barber.barbershop_id,
    }));

    await this.client.from('barber_services').insert(rows);
  }

  async getBarberWorkingHours(barberId: string): Promise<BarberWorkingHour[]> {
    const { data, error } = await this.client
      .from('barber_working_hours')
      .select('*')
      .eq('barber_id', barberId)
      .order('day_of_week');

    if (error) throw new Error(error.message);
    return (data || []) as BarberWorkingHour[];
  }

  async updateBarberWorkingHours(barberId: string, hours: BarberWorkingHour[]): Promise<void> {
    await this.client.from('barber_working_hours').upsert(hours);
  }

  async getBarberTimeOff(barberId: string): Promise<BarberTimeOff[]> {
    const { data, error } = await this.client
      .from('barber_time_off')
      .select('*')
      .eq('barber_id', barberId)
      .order('starts_at');

    if (error) throw new Error(error.message);
    return (data || []) as BarberTimeOff[];
  }

  async addBarberTimeOff(data: Omit<BarberTimeOff, 'id' | 'created_at'>): Promise<BarberTimeOff> {
    const { data: to, error } = await this.client
      .from('barber_time_off')
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return to as BarberTimeOff;
  }

  async deleteBarberTimeOff(id: string): Promise<void> {
    const { error } = await this.client.from('barber_time_off').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  // ----------------------------------------------------
  // BUSINESS HOURS
  // ----------------------------------------------------
  async getBusinessHours(shopId: string): Promise<BusinessHour[]> {
    const { data, error } = await this.client
      .from('business_hours')
      .select('*')
      .eq('barbershop_id', shopId)
      .order('day_of_week');

    if (error) throw new Error(error.message);
    return (data || []) as BusinessHour[];
  }

  async updateBusinessHours(_shopId: string, hours: BusinessHour[]): Promise<void> {
    const { error } = await this.client.from('business_hours').upsert(hours);
    if (error) throw new Error(error.message);
  }

  // ----------------------------------------------------
  // CUSTOMERS
  // ----------------------------------------------------
  async listCustomers(shopId: string, search = ''): Promise<Customer[]> {
    let query = this.client.from('customers').select('*').eq('barbershop_id', shopId);
    if (search.trim()) {
      query = query.or(`name.ilike.%${search}%,phone_normalized.like.%${normalizePhoneBR(search)}%`);
    }

    const { data, error } = await query.order('name');
    if (error) throw new Error(error.message);
    return (data || []) as Customer[];
  }

  async getCustomerById(id: string): Promise<{ customer: Customer; history: Appointment[] } | null> {
    const { data: customer, error: custErr } = await this.client
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (custErr || !customer) return null;

    const { data: history, error: histErr } = await this.client
      .from('appointments')
      .select('*, barber:barbers(*), service:services(*)')
      .eq('customer_id', id)
      .order('starts_at', { ascending: false });

    if (histErr) throw new Error(histErr.message);

    return {
      customer: customer as Customer,
      history: (history || []) as Appointment[],
    };
  }

  async createCustomer(shopId: string, name: string, phone: string): Promise<Customer> {
    const phoneNorm = normalizePhoneBR(phone);
    const { data, error } = await this.client
      .from('customers')
      .upsert({ barbershop_id: shopId, name: name.trim(), phone_normalized: phoneNorm })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Customer;
  }

  async updateCustomer(id: string, name: string, phone: string): Promise<Customer> {
    const { data, error } = await this.client
      .from('customers')
      .update({ name: name.trim(), phone_normalized: normalizePhoneBR(phone), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Customer;
  }

  // ----------------------------------------------------
  // APPOINTMENTS
  // ----------------------------------------------------
  async listAppointmentsByDate(shopId: string, dateStr: string): Promise<Appointment[]> {
    const startOfDay = `${dateStr}T00:00:00.000Z`;
    const endOfDay = `${dateStr}T23:59:59.999Z`;

    const { data, error } = await this.client
      .from('appointments')
      .select('*, customer:customers(*), barber:barbers(*), service:services(*)')
      .eq('barbershop_id', shopId)
      .gte('starts_at', startOfDay)
      .lte('starts_at', endOfDay)
      .order('starts_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []) as Appointment[];
  }

  async listAppointmentsByRange(shopId: string, startDateStr: string, endDateStr: string): Promise<Appointment[]> {
    const { data, error } = await this.client
      .from('appointments')
      .select('*, customer:customers(*), barber:barbers(*), service:services(*)')
      .eq('barbershop_id', shopId)
      .gte('starts_at', startDateStr)
      .lte('starts_at', endDateStr)
      .order('starts_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []) as Appointment[];
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
    let customerId = data.customer_id;
    if (!customerId) {
      if (!data.customer_name || !data.customer_phone) {
        return { success: false, message: 'Informe os dados do cliente.' };
      }
      const cust = await this.createCustomer(data.barbershop_id, data.customer_name, data.customer_phone);
      customerId = cust.id;
    }

    const { data: service } = await this.client.from('services').select('*').eq('id', data.service_id).single();
    if (!service) return { success: false, message: 'Serviço não encontrado.' };

    const start = new Date(data.starts_at);
    const end = new Date(start.getTime() + service.duration_minutes * 60 * 1000);

    const { data: appt, error } = await this.client
      .from('appointments')
      .insert({
        barbershop_id: data.barbershop_id,
        barber_id: data.barber_id,
        service_id: data.service_id,
        customer_id: customerId,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        status: 'confirmed',
        booking_source: 'admin',
        price_cents_snapshot: service.price_cents,
        duration_minutes_snapshot: service.duration_minutes,
        service_name_snapshot: service.name,
        public_code: 'AP-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      })
      .select('*, customer:customers(*), barber:barbers(*), service:services(*)')
      .single();

    if (error) {
      if (error.code === '23P01') {
        return { success: false, message: 'Conflito de horário! O profissional já possui agendamento neste horário.' };
      }
      return { success: false, message: error.message };
    }

    return { success: true, appointment: appt as Appointment };
  }

  async updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    const { data, error } = await this.client
      .from('appointments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, customer:customers(*), barber:barbers(*), service:services(*)')
      .single();

    if (error) throw new Error(error.message);
    return data as Appointment;
  }

  async cancelAppointment(id: string, _reason?: string): Promise<Appointment> {
    return this.updateAppointmentStatus(id, 'cancelled');
  }

  // ----------------------------------------------------
  // DASHBOARD
  // ----------------------------------------------------
  async getDashboardMetrics(shopId: string, dateStr: string): Promise<DashboardMetrics> {
    const appointments = await this.listAppointmentsByDate(shopId, dateStr);

    let pending = 0;
    let confirmed = 0;
    let in_progress = 0;
    let completed = 0;
    let cancelled = 0;
    let revenueCents = 0;

    appointments.forEach((a) => {
      if (a.status === 'pending') pending++;
      if (a.status === 'confirmed') confirmed++;
      if (a.status === 'in_progress') in_progress++;
      if (a.status === 'completed') completed++;
      if (a.status === 'cancelled') cancelled++;

      if (a.status === 'completed' || a.status === 'confirmed' || a.status === 'in_progress') {
        revenueCents += a.price_cents_snapshot;
      }
    });

    const nowIso = new Date().toISOString();
    const { data: upcoming } = await this.client
      .from('appointments')
      .select('*, customer:customers(*), barber:barbers(*), service:services(*)')
      .eq('barbershop_id', shopId)
      .in('status', ['pending', 'confirmed', 'in_progress'])
      .gte('ends_at', nowIso)
      .order('starts_at', { ascending: true })
      .limit(5);

    return {
      total_today: appointments.length,
      pending,
      confirmed,
      in_progress,
      completed,
      cancelled,
      estimated_revenue_cents: revenueCents,
      next_appointments: (upcoming || []) as Appointment[],
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
    // Call Supabase RPC
    const { data, error } = await this.client.rpc('get_available_slots', {
      p_barbershop_id: shopId,
      p_service_id: serviceId,
      p_barber_id: barberId || null,
      p_date: dateStr,
    });

    if (error) throw new Error(error.message);
    return (data || []) as AvailabilitySlot[];
  }

  async bookPublicAppointment(input: PublicBookingInput): Promise<PublicBookingResult> {
    const { data, error } = await this.client.rpc('book_public_appointment', {
      p_barbershop_id: input.barbershop_id,
      p_service_id: input.service_id,
      p_barber_id: input.barber_id || null,
      p_starts_at: input.starts_at,
      p_customer_name: input.customer_name,
      p_customer_phone: input.customer_phone,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return data as PublicBookingResult;
  }
}
