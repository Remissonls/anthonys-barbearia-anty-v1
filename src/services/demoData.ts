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

  const shopId = 'shop-anthonys-barbearia';
  const ownerUserId = 'user-owner-anthony';

  const barbershop: Barbershop = {
    id: shopId,
    owner_user_id: ownerUserId,
    name: "Anthony's Barbearia",
    slug: 'anthonys-barbearia',
    description: 'Estilo • Respeito • Autoestima. Mais que um corte, é um cuidado com você!',
    phone: '(82) 99876-5432',
    whatsapp: '(82) 99876-5432',
    address: 'Rua do Comércio, 520 - Centro, Maceió - AL',
    logo_url: null,
    timezone: 'America/Maceio',
    booking_confirmation_mode: 'auto',
    is_active: true,
    created_at: new Date(now.getTime() - 90 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  };

  const services: Service[] = [
    {
      id: 'srv-corte',
      barbershop_id: shopId,
      name: 'Corte de Cabelo',
      description: 'Corte masculino personalizado com tesoura e máquina, finalização precisa.',
      price_cents: 2500, // R$ 25,00
      duration_minutes: 30,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'srv-barba',
      barbershop_id: shopId,
      name: 'Barba',
      description: 'Alinhamento, toalha quente, hidratação e desenho na navalha afiada.',
      price_cents: 2000, // R$ 20,00
      duration_minutes: 25,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'srv-combo',
      barbershop_id: shopId,
      name: 'Corte + Barba',
      description: 'Experiência completa: corte de cabelo + barba alinhada com toalha quente.',
      price_cents: 4000, // R$ 40,00
      duration_minutes: 50,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'srv-sobrancelha',
      barbershop_id: shopId,
      name: 'Sobrancelha',
      description: 'Design e alinhamento na navalha para realce e harmonia do olhar.',
      price_cents: 500, // R$ 5,00
      duration_minutes: 15,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'srv-pezinho',
      barbershop_id: shopId,
      name: 'Pezinho',
      description: 'Acabamento dos contornos da nuca, costeletas e testa na lâmina descartável.',
      price_cents: 500, // R$ 5,00
      duration_minutes: 15,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'srv-pigmentacao',
      barbershop_id: shopId,
      name: 'Pigmentação',
      description: 'Disfarce de fios brancos e preenchimento de falhas no cabelo ou barba.',
      price_cents: 1000, // R$ 10,00
      duration_minutes: 20,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const allServiceIds = services.map((s) => s.id);

  const barbers: Barber[] = [
    {
      id: 'barber-anthony',
      barbershop_id: shopId,
      name: 'Anthony Mestre',
      description: 'Mestre barbeiro especialista em corte de cabelo, barba e visagismo.',
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
      is_active: true,
      sort_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      service_ids: allServiceIds,
    },
    {
      id: 'barber-carlos',
      barbershop_id: shopId,
      name: 'Carlos Silva',
      description: 'Especialista em barboterapia, pigmentação e sobrancelha.',
      photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces',
      is_active: true,
      sort_order: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      service_ids: allServiceIds,
    },
    {
      id: 'barber-lucas',
      barbershop_id: shopId,
      name: 'Lucas Andrade',
      description: 'Especialista em degradês contemporâneos, fade e acabamento.',
      photo_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop&crop=faces',
      is_active: true,
      sort_order: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      service_ids: allServiceIds,
    },
  ];

  const barberServices: BarberService[] = [];
  barbers.forEach((b) => {
    services.forEach((s) => {
      barberServices.push({
        barber_id: b.id,
        service_id: s.id,
        barbershop_id: shopId,
      });
    });
  });

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

  // Anthony working hours
  for (let d = 0; d <= 6; d++) {
    if (d === 0) {
      barberWorkingHours.push({
        id: `bwh-anthony-${d}`,
        barber_id: 'barber-anthony',
        barbershop_id: shopId,
        day_of_week: d,
        is_working: false,
        starts_at: '08:00',
        ends_at: '18:00',
      });
    } else if (d === 6) {
      barberWorkingHours.push({
        id: `bwh-anthony-${d}`,
        barber_id: 'barber-anthony',
        barbershop_id: shopId,
        day_of_week: d,
        is_working: true,
        starts_at: '08:00',
        ends_at: '14:00',
      });
    } else {
      barberWorkingHours.push({
        id: `bwh-anthony-${d}`,
        barber_id: 'barber-anthony',
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
      barber_id: 'barber-anthony',
      service_id: 'srv-corte',
      customer_id: 'cust-bruno',
      starts_at: combineDateAndTime(now, '09:00').toISOString(),
      ends_at: combineDateAndTime(now, '09:30').toISOString(),
      status: 'completed',
      booking_source: 'public',
      price_cents_snapshot: 2500,
      duration_minutes_snapshot: 30,
      service_name_snapshot: 'Corte de Cabelo',
      public_code: 'AP-ANT0900',
      created_at: new Date(now.getTime() - 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'appt-2',
      barbershop_id: shopId,
      barber_id: 'barber-anthony',
      service_id: 'srv-combo',
      customer_id: 'cust-eduardo',
      starts_at: combineDateAndTime(now, '10:00').toISOString(),
      ends_at: combineDateAndTime(now, '10:50').toISOString(),
      status: 'in_progress',
      booking_source: 'admin',
      price_cents_snapshot: 4000,
      duration_minutes_snapshot: 50,
      service_name_snapshot: 'Corte + Barba',
      public_code: 'AP-ANT1000',
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
      ends_at: combineDateAndTime(now, '11:25').toISOString(),
      status: 'confirmed',
      booking_source: 'public',
      price_cents_snapshot: 2000,
      duration_minutes_snapshot: 25,
      service_name_snapshot: 'Barba',
      public_code: 'AP-ANT1100',
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
      price_cents_snapshot: 2500,
      duration_minutes_snapshot: 30,
      service_name_snapshot: 'Corte de Cabelo',
      public_code: 'AP-ANT1430',
      created_at: new Date(now.getTime() - 21600000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'appt-5',
      barbershop_id: shopId,
      barber_id: 'barber-anthony',
      service_id: 'srv-corte',
      customer_id: 'cust-thiago',
      starts_at: combineDateAndTime(now, '15:30').toISOString(),
      ends_at: combineDateAndTime(now, '16:00').toISOString(),
      status: 'confirmed',
      booking_source: 'admin',
      price_cents_snapshot: 2500,
      duration_minutes_snapshot: 30,
      service_name_snapshot: 'Corte de Cabelo',
      public_code: 'AP-ANT1530',
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
      email: 'proprietario@anthonysbarbearia.com.br',
      name: "Anthony Mestre",
    },
  };
}
