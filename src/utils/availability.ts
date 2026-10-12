// AgendaPro Availability Domain Calculation Engine
// Complies strictly with Section 10 of AgendaPro specification.

import {
  Barber,
  BusinessHour,
  BarberWorkingHour,
  BarberTimeOff,
  Appointment,
  AvailabilitySlot,
} from '../types';
import { combineDateAndTime, parseISODateString } from './date';

export interface AvailabilityParams {
  date: string; // "YYYY-MM-DD"
  durationMinutes: number;
  serviceId: string;
  barbers: Barber[];
  businessHours: BusinessHour[];
  barberWorkingHours: BarberWorkingHour[];
  barberTimeOff: BarberTimeOff[];
  existingAppointments: Appointment[];
  selectedBarberId?: string | null; // null or empty for "any"
  now?: Date; // Reference current time (defaults to new Date())
  cadenceMinutes?: number; // Defaults to 15 min
}

/**
 * Checks whether two time ranges [startA, endA) and [startB, endB) overlap.
 * Uses half-open interval rule: start is inclusive, end is exclusive.
 * [10:00, 10:30) and [10:30, 11:00) DO NOT overlap.
 */
export function intervalsOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean {
  return startA.getTime() < endB.getTime() && endA.getTime() > startB.getTime();
}

/**
 * Determines whether a given appointment status currently occupies a time slot.
 * Section 10.4: 'pending', 'confirmed', 'in_progress' occupy slots.
 * 'completed', 'cancelled', 'no_show' DO NOT occupy slots.
 */
export function isStatusBlocking(status: string): boolean {
  return status === 'pending' || status === 'confirmed' || status === 'in_progress';
}

/**
 * Calculates available timeslots for a given date according to all business rules.
 */
export function calculateAvailableSlots(params: AvailabilityParams): AvailabilitySlot[] {
  const {
    date: dateStr,
    durationMinutes,
    serviceId,
    barbers,
    businessHours,
    barberWorkingHours,
    barberTimeOff,
    existingAppointments,
    selectedBarberId,
    now = new Date(),
    cadenceMinutes = 15,
  } = params;

  if (durationMinutes <= 0) return [];

  const targetDate = parseISODateString(dateStr);
  const dayOfWeek = targetDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

  // 1. Check Barbershop Business Hours for this day
  const shopHours = businessHours.find((bh) => bh.day_of_week === dayOfWeek);
  if (!shopHours || shopHours.is_closed) {
    return []; // Closed on this day
  }

  const shopOpen = combineDateAndTime(targetDate, shopHours.opens_at);
  const shopClose = combineDateAndTime(targetDate, shopHours.closes_at);

  if (shopClose <= shopOpen) return [];

  // 2. Filter eligible barbers
  // If specific barber chosen, check if active and offers service
  // If "any", check all active barbers that offer this service
  const eligibleBarbers = barbers.filter((b) => {
    if (!b.is_active) return false;
    if (selectedBarberId && b.id !== selectedBarberId) return false;
    if (b.service_ids && !b.service_ids.includes(serviceId)) return false;
    return true;
  });

  if (eligibleBarbers.length === 0) return [];

  const slotsMap = new Map<string, AvailabilitySlot>();

  // Iterate in 15-minute intervals from shopOpen to shopClose
  let currentStart = new Date(shopOpen);

  while (currentStart < shopClose) {
    const currentEnd = new Date(currentStart.getTime() + durationMinutes * 60 * 1000);

    // Rule: Service must finish at or before shop closing time
    if (currentEnd > shopClose) {
      break;
    }

    // Rule: Slot cannot start in the past
    if (currentStart <= now) {
      currentStart = new Date(currentStart.getTime() + cadenceMinutes * 60 * 1000);
      continue;
    }

    // Check if at least one eligible barber is available for this slot
    for (const barber of eligibleBarbers) {
      // 3. Check Barber Working Hours for this day
      const bwh = barberWorkingHours.find(
        (wh) => wh.barber_id === barber.id && wh.day_of_week === dayOfWeek
      );

      if (!bwh || !bwh.is_working) {
        continue;
      }

      const barberStart = combineDateAndTime(targetDate, bwh.starts_at);
      const barberEnd = combineDateAndTime(targetDate, bwh.ends_at);

      // Must fit strictly within barber's shift
      if (currentStart < barberStart || currentEnd > barberEnd) {
        continue;
      }

      // 4. Check Barber Lunch / Break
      if (bwh.break_starts_at && bwh.break_ends_at) {
        const breakStart = combineDateAndTime(targetDate, bwh.break_starts_at);
        const breakEnd = combineDateAndTime(targetDate, bwh.break_ends_at);

        if (intervalsOverlap(currentStart, currentEnd, breakStart, breakEnd)) {
          continue; // Overlaps lunch break
        }
      }

      // 5. Check Barber Time Off / Blocks
      const hasTimeOff = barberTimeOff.some((to) => {
        if (to.barber_id !== barber.id) return false;
        const toStart = new Date(to.starts_at);
        const toEnd = new Date(to.ends_at);
        return intervalsOverlap(currentStart, currentEnd, toStart, toEnd);
      });

      if (hasTimeOff) {
        continue;
      }

      // 6. Check Existing Active Appointments for this barber
      const hasConflict = existingAppointments.some((appt) => {
        if (appt.barber_id !== barber.id) return false;
        if (!isStatusBlocking(appt.status)) return false;

        const apptStart = new Date(appt.starts_at);
        const apptEnd = new Date(appt.ends_at);

        return intervalsOverlap(currentStart, currentEnd, apptStart, apptEnd);
      });

      if (!hasConflict) {
        // This barber is free for this slot!
        const timeKey = `${String(currentStart.getHours()).padStart(2, '0')}:${String(
          currentStart.getMinutes()
        ).padStart(2, '0')}`;

        if (!slotsMap.has(timeKey)) {
          slotsMap.set(timeKey, {
            time: timeKey,
            starts_at: currentStart.toISOString(),
            ends_at: currentEnd.toISOString(),
            barber_id: barber.id,
            barber_name: barber.name,
          });
        }
        break; // Slot is confirmed available for at least one barber
      }
    }

    currentStart = new Date(currentStart.getTime() + cadenceMinutes * 60 * 1000);
  }

  // Return sorted array of slots
  return Array.from(slotsMap.values()).sort((a, b) => a.time.localeCompare(b.time));
}
