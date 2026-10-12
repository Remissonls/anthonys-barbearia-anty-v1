import { describe, it, expect, beforeEach } from 'vitest';
import { DemoService } from '../services/demoService';

describe('Concurrency and Concurrency Conflict Protection (Section 21.4)', () => {
  let service: DemoService;

  beforeEach(() => {
    // Clear localStorage to reset clean state
    localStorage.clear();
    service = new DemoService();
  });

  it('accepts only one booking and rejects concurrent conflicting booking with SLOT_CONFLICT', async () => {
    const shop = await service.getOwnerBarbershop();
    expect(shop).not.toBeNull();

    const services = await service.listServices(shop!.id);
    const serviceCorte = services.find((s) => s.id === 'srv-corte') || services[0];
    const barbers = await service.listBarbers(shop!.id);
    const barber = barbers[0];

    // Pick a future time tomorrow at 10:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const startsAtIso = tomorrow.toISOString();

    // Fire two simultaneous public booking requests for the SAME barber and SAME slot!
    const [result1, result2] = await Promise.all([
      service.bookPublicAppointment({
        barbershop_id: shop!.id,
        service_id: serviceCorte.id,
        barber_id: barber.id,
        starts_at: startsAtIso,
        customer_name: 'Cliente Concorrente A',
        customer_phone: '82999991111',
      }),
      service.bookPublicAppointment({
        barbershop_id: shop!.id,
        service_id: serviceCorte.id,
        barber_id: barber.id,
        starts_at: startsAtIso,
        customer_name: 'Cliente Concorrente B',
        customer_phone: '82999992222',
      }),
    ]);

    // One must succeed, and one must fail with controlled conflict
    const successCount = (result1.success ? 1 : 0) + (result2.success ? 1 : 0);
    const conflictCount =
      (result1.code === 'SLOT_CONFLICT' ? 1 : 0) + (result2.code === 'SLOT_CONFLICT' ? 1 : 0);

    expect(successCount).toBe(1);
    expect(conflictCount).toBe(1);

    const failedResult = !result1.success ? result1 : result2;
    expect(failedResult.message).toContain('ocupado');
  });

  it('preserves historical price and duration snapshot when service price is updated later', async () => {
    const shop = await service.getOwnerBarbershop();
    const services = await service.listServices(shop!.id);
    const corte = services[0];
    const originalPrice = corte.price_cents;

    const futureTime = new Date();
    futureTime.setDate(futureTime.getDate() + 2);
    futureTime.setHours(11, 0, 0, 0);

    // Book appointment
    const booking = await service.bookPublicAppointment({
      barbershop_id: shop!.id,
      service_id: corte.id,
      starts_at: futureTime.toISOString(),
      customer_name: 'Cliente Snapshot',
      customer_phone: '82988889999',
    });

    expect(booking.success).toBe(true);
    const apptId = booking.appointment!.id;
    expect(booking.appointment!.price_cents_snapshot).toBe(originalPrice);

    // Update service price from original (e.g. R$ 45) to R$ 60 (6000 cents)
    await service.updateService(corte.id, { price_cents: 6000 });

    // Fetch the appointment again
    const appts = await service.listAppointmentsByRange(
      shop!.id,
      new Date(futureTime.getTime() - 3600000).toISOString(),
      new Date(futureTime.getTime() + 3600000).toISOString()
    );
    const reloadedAppt = appts.find((a) => a.id === apptId);

    // The appointment snapshot MUST remain unchanged at the original price!
    expect(reloadedAppt).toBeDefined();
    expect(reloadedAppt!.price_cents_snapshot).toBe(originalPrice);
    expect(reloadedAppt!.price_cents_snapshot).not.toBe(6000);
  });
});
