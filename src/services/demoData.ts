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
} from '../types';
import { toISODateString, combineDateAndTime } from '../utils/date';

export function getInitialDemoState() {
  const now = new Date();
  const todayStr = toISODateString(now);

  const shopId = 'shop-mestre-navalha';
  const ownerUserId = 'user-owner-rodrigo';

  const barbershop: Barbershop = {
    id: shopId,
    owner_user_id: ownerUserId,
    name: 'Barbearia Mestre Navalha',
    slug: 'mestre-navalha',
    description: 'Tradição, navalha afiada e toalha quente no coração de Maceió. Ambiente climatizado com café expresso e cerveja artesanal.',
    phone: '(82) 98765-4321',
    whatsapp: '(82) 98765-4321',
    address: 'Rua do Sol, 452 - Ponta Verde, Maceió - AL',
    logo_url: null,
    timezone: 'America/Maceio',
    booking_confirmation_mode: 'auto',
    is_active: true,
    created_at: new Date(now.getTime() - 90 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  };

  const barbers: Barber[] = [
    {
      id: 'barber-rodrigo',
      barbershop_id: shopId,
      name: 'Rodrigo Mestre',
      description: 'Fundador e mestre navalheiro com 12 anos de experiência na arte da barbearia clássica.',
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
      is_active: true,
      sort_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      service_ids: ['srv-corte', 'srv-barba', 'srv-combo', 'srv-acabamento', 'srv-pigmentacao'],
    },
    {
      id: 'barber-carlos',
      barbershop_id: shopId,
      name: 'Carlos Silva',
      description: 'Especialista em barboterapia, visagismo facial e alinhamento de fios.',
      photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces',
      is_active: true,
      sort_order: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      service_ids: ['srv-barba', 'srv-combo', 'srv-acabamento', 'srv-pigmentacao'],
    },
    {
      id: 'barber-lucas',
      barbershop_id: shopId,
      name: 'Lucas Andrade',
      description: 'Especialista em degradês contemporâneos, fade americano, freestyle e cortes clássicos.',
      photo_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop&crop=faces',
      is_active: true,
      sort_order: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      service_ids: ['srv-corte', 'srv-combo', 'srv-acabamento'],
    },
  ];

  const services: Service[] = [
    {
      id: 'srv-corte',
      barbershop_id: shopId,
      name: 'Corte Tradicional',
      description: 'Corte completo com tesoura e máquina, finalizado com navalha, lavagem e penteado profissional.',
      price_cents: 4500, // R$ 45,00
      duration_minutes: 30,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'srv-barba',
      barbershop_id: shopId,
      name: 'Barba Terapia com Toalha Quente',
      description: 'Tratamento com óleos essenciais, massagem facial, duas toalhas quentes e navalha descartável.',
      price_cents: 3500, // R$ 35,00
      duration_minutes: 30,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'srv-combo',
      barbershop_id: shopId,
      name: 'Combo Corte + Barba',
      description: 'A experiência completa de cuidado masculino com corte personalizado e barboterapia.',
      price_cents: 7000, // R$ 70,00
      duration_minutes: 60,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'srv-acabamento',
      barbershop_id: shopId,
      name: 'Acabamento / Pezinho',
      description: 'Alinhamento dos contornos da nuca e costeletas na navalha com pós-barba refrescante.',
      price_cents: 2000, // R$ 20,00
      duration_minutes: 15,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'srv-pigmentacao',
      barbershop_id: shopId,
      name: 'Pigmentação de Barba',
      description: 'Cobertura de fios brancos e preenchimento de falhas com tintura antialérgica especial.',
      price_cents: 2500, // R$ 25,00
      duration_minutes: 20,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const barberServices: BarberService[] = [
    { barber_id: 'barber-rodrigo', service_id: 'srv-corte', barbershop_id: shopId },
    { barber_id: 'barber-rodrigo', service_id: 'srv-barba', barbershop_id: shopId },
    { barber_id: 'barber-rodrigo', service_id: 'srv-combo', barbershop_id: shopId },
    { barber_id: 'barber-rodrigo', service_id: 'srv-acabamento', barbershop_id: shopId },
    { barber_id: 'barber-rodrigo', service_id: 'srv-pigmentacao', barbershop_id: shopId },
    { barber_id: 'barber-carlos', service_id: 'srv-barba', barbershop_id: shopId },
    { barber_id: 'barber-carlos', service_id: 'srv-combo', barbershop_id: shopId },
    { barber_id: 'barber-carlos', service_id: 'srv-acabamento', barbershop_id: shopId },
    { barber_id: 'barber-carlos', service_id: 'srv-pigmentacao', barbershop_id: shopId },
    { barber_id: 'barber-lucas', service_id: 'srv-corte', barbershop_id: shopId },
    { barber_id: 'barber-lucas', service_id: 'srv-combo', barbershop_id: shopId },
    { barber_id: 'barber-lucas', service_id: 'srv-acabamento', barbershop_id: shopId },
  ];

  const businessHours: BusinessHour[] = [
    { id: 'bh-0', barbershop_id: shopId, day_of_week: 0, is_closed: true, opens_at: '08:00', closes_at: '18:00' },
    { id: 'bh-1', barbershop_id: shopId, day_of_week: 1, is_closed: false, opens_at: '08:00', closes_at: '19:00' },
    { id: 'bh-2', barbershop_id: shopId, day_of_week: 2, is_closed: false, opens_at: '08:00', closes_at: '19:00' },
    { id: 'bh-3', barbershop_id: shopId, day_of_week: 3, is_closed: false, opens_at: '08:00', closes_at: '19:00' },
    { id: 'bh-4', barbershop_id: shopId, day_of_week: 4, is_closed: false, opens_at: '08:00', closes_at: '19:00' },
    { id: 'bh-5', barbershop_id: shopId, day_of_week: 5, is_closed: false, opens_at: '08:00', closes_at: '20:00' },
    { id: 'bh-6', barbershop_id: shopId, day_of_week: 6, is_closed: false, opens_at: '08:00', closes_at: '18:00' },
  ];

  const barberWorkingHours: BarberWorkingHour[] = [];

  // Rodrigo working hours
  for (let d = 0; d <= 6; d++) {
    if (d === 0) {
      barberWorkingHours.push({
        id: `bwh-rodrigo-${d}`,
        barber_id: 'barber-rodrigo',
        barbershop_id: shopId,
        day_of_week: d,
        is_working: false,
        starts_at: '08:00',
        ends_at: '18:00',
      });
    } else if (d === 6) {
      barberWorkingHours.push({
        id: `bwh-rodrigo-${d}`,
        barber_id: 'barber-rodrigo',
        barbershop_id: shopId,
        day_of_week: d,
        is_working: true,
        starts_at: '08:00',
        ends_at: '14:00',
      });
    } else {
      barberWorkingHours.push({
        id: `bwh-rodrigo-${d}`,
        barber_id: 'barber-rodrigo',
        barbershop_id: shopId,
        day_of_week: d,
        is_working: true,
        starts_at: '08:00',
        ends_at: '18:00',
        break_starts_at: '12:00',
        break_ends_at: '13:00',
      });
    }
  }

  // Carlos working hours (Tue-Sat)
  for (let d = 0; d <= 6; d++) {
    if (d === 0 || d === 1) {
      barberWorkingHours.push({
        id: `bwh-carlos-${d}`,
        barber_id: 'barber-carlos',
        barbershop_id: shopId,
        day_of_week: d,
        is_working: false,
        starts_at: '09:00',
        ends_at: '19:00',
      });
    } else {
      barberWorkingHours.push({
        id: `bwh-carlos-${d}`,
        barber_id: 'barber-carlos',
        barbershop_id: shopId,
        day_of_week: d,
        is_working: true,
        starts_at: '09:00',
        ends_at: '19:00',
        break_starts_at: '13:00',
        break_ends_at: '14:00',
      });
    }
  }

  // Lucas working hours (Mon-Sat)
  for (let d = 0; d <= 6; d++) {
    if (d === 0) {
      barberWorkingHours.push({
        id: `bwh-lucas-${d}`,
        barber_id: 'barber-lucas',
        barbershop_id: shopId,
        day_of_week: d,
        is_working: false,
        starts_at: '10:00',
        ends_at: '19:00',
      });
    } else if (d === 6) {
      barberWorkingHours.push({
        id: `bwh-lucas-${d}`,
        barber_id: 'barber-lucas',
        barbershop_id: shopId,
        day_of_week: d,
        is_working: true,
        starts_at: '08:00',
        ends_at: '16:00',
        break_starts_at: '12:00',
        break_ends_at: '13:00',
      });
    } else {
      barberWorkingHours.push({
        id: `bwh-lucas-${d}`,
        barber_id: 'barber-lucas',
        barbershop_id: shopId,
        day_of_week: d,
        is_working: true,
        starts_at: '10:00',
        ends_at: '19:00',
        break_starts_at: '14:00',
        break_ends_at: '15:00',
      });
    }
  }

  const barberTimeOff: BarberTimeOff[] = [
    {
      id: 'to-carlos-1',
      barbershop_id: shopId,
      barber_id: 'barber-carlos',
      starts_at: new Date(now.getTime() + 86400000).toISOString(),
      ends_at: new Date(now.getTime() + 86400000 + 7200000).toISOString(),
      reason: 'Consulta médica de rotina',
      created_at: new Date().toISOString(),
    },
  ];

  const customers: Customer[] = [
    {
      id: 'cust-bruno',
      barbershop_id: shopId,
      name: 'Bruno Carvalho',
      phone_normalized: '82991234567',
      created_at: new Date(now.getTime() - 60 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      total_appointments: 6,
      last_appointment_at: todayStr,
    },
    {
      id: 'cust-eduardo',
      barbershop_id: shopId,
      name: 'Eduardo Lima',
      phone_normalized: '82998765432',
      created_at: new Date(now.getTime() - 40 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      total_appointments: 4,
      last_appointment_at: todayStr,
    },
    {
      id: 'cust-mateus',
      barbershop_id: shopId,
      name: 'Mateus Albuquerque',
      phone_normalized: '82993456789',
      created_at: new Date(now.getTime() - 20 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      total_appointments: 2,
      last_appointment_at: todayStr,
    },
    {
      id: 'cust-gabriel',
      barbershop_id: shopId,
      name: 'Gabriel Ramos',
      phone_normalized: '82988887777',
      created_at: new Date(now.getTime() - 10 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      total_appointments: 3,
      last_appointment_at: todayStr,
    },
    {
      id: 'cust-thiago',
      barbershop_id: shopId,
      name: 'Thiago Farias',
      phone_normalized: '82981112233',
      created_at: new Date(now.getTime() - 5 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      total_appointments: 1,
      last_appointment_at: todayStr,
    },
  ];

  // Dynamic appointments for today to showcase different statuses
  const appointments: Appointment[] = [
    {
      id: 'appt-1',
      barbershop_id: shopId,
      barber_id: 'barber-rodrigo',
      service_id: 'srv-corte',
      customer_id: 'cust-bruno',
      starts_at: combineDateAndTime(now, '09:00').toISOString(),
      ends_at: combineDateAndTime(now, '09:30').toISOString(),
      status: 'completed',
      booking_source: 'public',
      price_cents_snapshot: 4500,
      duration_minutes_snapshot: 30,
      service_name_snapshot: 'Corte Tradicional',
      public_code: 'AP-MN0900',
      created_at: new Date(now.getTime() - 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'appt-2',
      barbershop_id: shopId,
      barber_id: 'barber-rodrigo',
      service_id: 'srv-combo',
      customer_id: 'cust-eduardo',
      starts_at: combineDateAndTime(now, '10:00').toISOString(),
      ends_at: combineDateAndTime(now, '11:00').toISOString(),
      status: 'in_progress',
      booking_source: 'admin',
      price_cents_snapshot: 7000,
      duration_minutes_snapshot: 60,
      service_name_snapshot: 'Combo Corte + Barba',
      public_code: 'AP-MN1000',
      created_at: new Date(now.getTime() - 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'appt-3',
      barbershop_id: shopId,
      barber_id: 'barber-carlos',
      service_id: 'srv-barba',
      customer_id: 'cust-mateus',
      starts_at: combineDateAndTime(now, '11:00').toISOString(),
      ends_at: combineDateAndTime(now, '11:30').toISOString(),
      status: 'confirmed',
      booking_source: 'public',
      price_cents_snapshot: 3500,
      duration_minutes_snapshot: 30,
      service_name_snapshot: 'Barba Terapia com Toalha Quente',
      public_code: 'AP-MN1100',
      created_at: new Date(now.getTime() - 43200000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'appt-4',
      barbershop_id: shopId,
      barber_id: 'barber-lucas',
      service_id: 'srv-corte',
      customer_id: 'cust-gabriel',
      starts_at: combineDateAndTime(now, '14:30').toISOString(),
      ends_at: combineDateAndTime(now, '15:00').toISOString(),
      status: 'pending',
      booking_source: 'public',
      price_cents_snapshot: 4500,
      duration_minutes_snapshot: 30,
      service_name_snapshot: 'Corte Tradicional',
      public_code: 'AP-MN1430',
      created_at: new Date(now.getTime() - 21600000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'appt-5',
      barbershop_id: shopId,
      barber_id: 'barber-rodrigo',
      service_id: 'srv-corte',
      customer_id: 'cust-thiago',
      starts_at: combineDateAndTime(now, '15:30').toISOString(),
      ends_at: combineDateAndTime(now, '16:00').toISOString(),
      status: 'confirmed',
      booking_source: 'admin',
      price_cents_snapshot: 4500,
      duration_minutes_snapshot: 30,
      service_name_snapshot: 'Corte Tradicional',
      public_code: 'AP-MN1530',
      created_at: new Date(now.getTime() - 10800000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  return {
    barbershop,
    barbers,
    services,
    barberServices,
    businessHours,
    barberWorkingHours,
    barberTimeOff,
    customers,
    appointments,
    ownerUser: {
      id: ownerUserId,
      email: 'proprietario@mestrenavalha.com.br',
      name: 'Rodrigo Mestre',
    },
  };
}
