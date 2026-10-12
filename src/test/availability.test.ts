import { describe, it, expect } from 'vitest';
import { calculateAvailableSlots, intervalsOverlap } from '../utils/availability';
import {
  Barber,
  BusinessHour,
  BarberWorkingHour,
  BarberTimeOff,
  Appointment,
} from '../types';

describe('Availability Engine & Conflict Prevention', () => {
  const mockBarber: Barber = {
    id: 'barber-1',
    barbershop_id: 'shop-1',
    name: 'Rodrigo Mestre',
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    service_ids: ['srv-corte', 'srv-barba'],
  };

  // Mon-Sat: 08:00 - 18:00, Sun: Closed
  const mockBusinessHours: BusinessHour[] = [
    { id: 'bh-0', barbershop_id: 'shop-1', day_of_week: 0, is_closed: true, opens_at: '08:00', closes_at: '18:00' },
    { id: 'bh-1', barbershop_id: 'shop-1', day_of_week: 1, is_closed: false, opens_at: '08:00', closes_at: '18:00' },
    { id: 'bh-2', barbershop_id: 'shop-1', day_of_week: 2, is_closed: false, opens_at: '08:00', closes_at: '18:00' },
  ];

  // Mon: 08:00 - 18:00, Break: 12:00 - 13:00
  const mockWorkingHours: BarberWorkingHour[] = [
    {
      id: 'wh-1',
      barber_id: 'barber-1',
      barbershop_id: 'shop-1',
      day_of_week: 1,
      is_working: true,
      starts_at: '08:00',
      ends_at: '18:00',
      break_starts_at: '12:00',
      break_ends_at: '13:00',
    },
  ];

  it('calculates half-open intervals overlap correctly', () => {
    // 10:00 to 10:30 and 10:30 to 11:00 should NOT overlap
    const t10_00 = new Date('2026-10-12T10:00:00');
    const t10_30 = new Date('2026-10-12T10:30:00');
    const t11_00 = new Date('2026-10-12T11:00:00');

    expect(intervalsOverlap(t10_00, t10_30, t10_30, t11_00)).toBe(false);

    // 10:15 to 10:45 and 10:30 to 11:00 SHOULD overlap
    const t10_15 = new Date('2026-10-12T10:15:00');
    const t10_45 = new Date('2026-10-12T10:45:00');
    expect(intervalsOverlap(t10_15, t10_45, t10_30, t11_00)).toBe(true);
  });

  it('returns empty slots when barbershop is closed on Sunday', () => {
    // 2026-10-18 is a Sunday
    const slots = calculateAvailableSlots({
      date: '2026-10-18',
      durationMinutes: 30,
      serviceId: 'srv-corte',
      barbers: [mockBarber],
      businessHours: mockBusinessHours,
      barberWorkingHours: mockWorkingHours,
      barberTimeOff: [],
      existingAppointments: [],
      now: new Date('2026-10-10T00:00:00'),
    });

    expect(slots).toHaveLength(0);
  });

  it('excludes slots overlapping barber lunch break', () => {
    // 2026-10-12 is Monday
    const slots = calculateAvailableSlots({
      date: '2026-10-12',
      durationMinutes: 30,
      serviceId: 'srv-corte',
      barbers: [mockBarber],
      businessHours: mockBusinessHours,
      barberWorkingHours: mockWorkingHours,
      barberTimeOff: [],
      existingAppointments: [],
      now: new Date('2026-10-10T00:00:00'),
    });

    const times = slots.map((s) => s.time);

    // 11:30 ends at 12:00 -> should be allowed
    expect(times).toContain('11:30');

    // 11:45 ends at 12:15 -> overlaps break 12:00-13:00 -> excluded!
    expect(times).not.toContain('11:45');

    // 12:00, 12:15, 12:30, 12:45 overlap break -> excluded!
    expect(times).not.toContain('12:00');
    expect(times).not.toContain('12:15');
    expect(times).not.toContain('12:30');
    expect(times).not.toContain('12:45');

    // 13:00 starts at break end -> allowed!
    expect(times).toContain('13:00');
  });

  it('excludes slots overlapping existing confirmed or pending appointments', () => {
    const existingAppointments: Appointment[] = [
      {
        id: 'appt-1',
        barbershop_id: 'shop-1',
        barber_id: 'barber-1',
        service_id: 'srv-corte',
        customer_id: 'cust-1',
        starts_at: new Date('2026-10-12T09:00:00').toISOString(),
        ends_at: new Date('2026-10-12T09:30:00').toISOString(),
        status: 'confirmed',
        booking_source: 'public',
        price_cents_snapshot: 4500,
        duration_minutes_snapshot: 30,
        service_name_snapshot: 'Corte Tradicional',
        public_code: 'AP-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    const slots = calculateAvailableSlots({
      date: '2026-10-12',
      durationMinutes: 30,
      serviceId: 'srv-corte',
      barbers: [mockBarber],
      businessHours: mockBusinessHours,
      barberWorkingHours: mockWorkingHours,
      barberTimeOff: [],
      existingAppointments,
      now: new Date('2026-10-10T00:00:00'),
    });

    const times = slots.map((s) => s.time);
    expect(times).not.toContain('09:00');
    expect(times).not.toContain('09:15');
  });

  it('allows slots previously occupied by cancelled appointments', () => {
    const cancelledAppt: Appointment = {
      id: 'appt-cancelled',
      barbershop_id: 'shop-1',
      barber_id: 'barber-1',
      service_id: 'srv-corte',
      customer_id: 'cust-1',
      starts_at: '2026-10-12T14:00:00.000Z',
      ends_at: '2026-10-12T14:30:00.000Z',
      status: 'cancelled',
      booking_source: 'public',
      price_cents_snapshot: 4500,
      duration_minutes_snapshot: 30,
      service_name_snapshot: 'Corte Tradicional',
      public_code: 'AP-CANCEL',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const slots = calculateAvailableSlots({
      date: '2026-10-12',
      durationMinutes: 30,
      serviceId: 'srv-corte',
      barbers: [mockBarber],
      businessHours: mockBusinessHours,
      barberWorkingHours: mockWorkingHours,
      barberTimeOff: [],
      existingAppointments: [cancelledAppt],
      now: new Date('2026-10-10T00:00:00'),
    });

    const times = slots.map((s) => s.time);
    expect(times).toContain('14:00');
  });

  it('does not offer slots that would end after barbershop closing time', () => {
    // Closing at 18:00, 60 min service
    const slots = calculateAvailableSlots({
      date: '2026-10-12',
      durationMinutes: 60,
      serviceId: 'srv-corte',
      barbers: [mockBarber],
      businessHours: mockBusinessHours,
      barberWorkingHours: mockWorkingHours,
      barberTimeOff: [],
      existingAppointments: [],
      now: new Date('2026-10-10T00:00:00'),
    });

    const times = slots.map((s) => s.time);
    // 17:00 ends at 18:00 (closing time) -> allowed
    expect(times).toContain('17:00');
    // 17:15 ends at 18:15 (after closing) -> disallowed!
    expect(times).not.toContain('17:15');
    expect(times).not.toContain('17:30');
  });
});
