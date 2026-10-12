-- AGENDAPRO MIGRATION 00001: INITIAL SCHEMA & MULTITENANCY
-- Extensions required for UUID and exclusion constraints
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Custom Types
DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_source AS ENUM ('public', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE confirmation_mode AS ENUM ('auto', 'manual');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. Barbershops
CREATE TABLE IF NOT EXISTS barbershops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  phone text NOT NULL,
  whatsapp text,
  address text,
  logo_url text,
  timezone text NOT NULL DEFAULT 'America/Maceio',
  booking_confirmation_mode confirmation_mode NOT NULL DEFAULT 'auto',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Barbers
CREATE TABLE IF NOT EXISTS barbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  photo_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Services
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Barber Services (mapping which barbers perform which services)
CREATE TABLE IF NOT EXISTS barber_services (
  barber_id uuid NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  barbershop_id uuid NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  PRIMARY KEY (barber_id, service_id)
);

-- 5. Business Hours (per barbershop)
CREATE TABLE IF NOT EXISTS business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_closed boolean NOT NULL DEFAULT false,
  opens_at time NOT NULL DEFAULT '08:00:00',
  closes_at time NOT NULL DEFAULT '19:00:00',
  CONSTRAINT uq_business_hours_day UNIQUE (barbershop_id, day_of_week),
  CONSTRAINT check_business_hours_span CHECK (is_closed OR closes_at > opens_at)
);

-- 6. Barber Working Hours (individual schedule per barber)
CREATE TABLE IF NOT EXISTS barber_working_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  barbershop_id uuid NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  is_working boolean NOT NULL DEFAULT true,
  starts_at time NOT NULL DEFAULT '08:00:00',
  ends_at time NOT NULL DEFAULT '19:00:00',
  break_starts_at time,
  break_ends_at time,
  CONSTRAINT uq_barber_working_day UNIQUE (barber_id, day_of_week),
  CONSTRAINT check_barber_working_span CHECK (NOT is_working OR ends_at > starts_at),
  CONSTRAINT check_barber_break_span CHECK (
    break_starts_at IS NULL OR (
      break_ends_at IS NOT NULL AND 
      break_ends_at > break_starts_at AND 
      break_starts_at >= starts_at AND 
      break_ends_at <= ends_at
    )
  )
);

-- 7. Barber Time Off (exceptional absences and blocks)
CREATE TABLE IF NOT EXISTS barber_time_off (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  barber_id uuid NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_time_off_span CHECK (ends_at > starts_at)
);

-- 8. Customers
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone_normalized text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_customer_phone UNIQUE (barbershop_id, phone_normalized)
);

-- 9. Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id uuid NOT NULL REFERENCES barbershops(id) ON DELETE CASCADE,
  barber_id uuid NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status appointment_status NOT NULL DEFAULT 'pending',
  booking_source booking_source NOT NULL DEFAULT 'public',
  price_cents_snapshot integer NOT NULL CHECK (price_cents_snapshot >= 0),
  duration_minutes_snapshot integer NOT NULL CHECK (duration_minutes_snapshot > 0),
  service_name_snapshot text NOT NULL,
  public_code text NOT NULL UNIQUE,
  created_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_appointment_span CHECK (ends_at > starts_at)
);

-- CRITICAL EXCLUSION CONSTRAINT: CONCURRENCY & OVERLAP PROTECTION
-- Prevents overlapping active bookings for the same barber using btree_gist
ALTER TABLE appointments
DROP CONSTRAINT IF EXISTS no_overlapping_appointments;

ALTER TABLE appointments
ADD CONSTRAINT no_overlapping_appointments
EXCLUDE USING gist (
  barber_id WITH =,
  tstzrange(starts_at, ends_at) WITH &&
)
WHERE (status IN ('pending', 'confirmed', 'in_progress'));

-- Indexes for querying performance
CREATE INDEX IF NOT EXISTS idx_appointments_shop_starts ON appointments(barbershop_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_appointments_barber_starts ON appointments(barber_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_customers_search ON customers(barbershop_id, name, phone_normalized);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(barbershop_id, is_active);
CREATE INDEX IF NOT EXISTS idx_barbers_active ON barbers(barbershop_id, is_active);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Barbershops Policies
CREATE POLICY "Owners can manage own barbershop"
ON barbershops FOR ALL
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Public can view active barbershop by slug"
ON barbershops FOR SELECT
USING (is_active = true);

-- Barbers Policies
CREATE POLICY "Owners can manage own barbers"
ON barbers FOR ALL
USING (barbershop_id IN (SELECT id FROM barbershops WHERE owner_user_id = auth.uid()))
WITH CHECK (barbershop_id IN (SELECT id FROM barbershops WHERE owner_user_id = auth.uid()));

CREATE POLICY "Public can view active barbers of active shop"
ON barbers FOR SELECT
USING (
  is_active = true AND 
  barbershop_id IN (SELECT id FROM barbershops WHERE is_active = true)
);

-- Services Policies
CREATE POLICY "Owners can manage own services"
ON services FOR ALL
USING (barbershop_id IN (SELECT id FROM barbershops WHERE owner_user_id = auth.uid()))
WITH CHECK (barbershop_id IN (SELECT id FROM barbershops WHERE owner_user_id = auth.uid()));

CREATE POLICY "Public can view active services of active shop"
ON services FOR SELECT
USING (
  is_active = true AND 
  barbershop_id IN (SELECT id FROM barbershops WHERE is_active = true)
);

-- Barber Services Policies
CREATE POLICY "Owners can manage barber services"
ON barber_services FOR ALL
USING (barbershop_id IN (SELECT id FROM barbershops WHERE owner_user_id = auth.uid()))
WITH CHECK (barbershop_id IN (SELECT id FROM barbershops WHERE owner_user_id = auth.uid()));

CREATE POLICY "Public can view barber services"
ON barber_services FOR SELECT
USING (barbershop_id IN (SELECT id FROM barbershops WHERE is_active = true));

-- Business Hours Policies
CREATE POLICY "Owners can manage business hours"
ON business_hours FOR ALL
USING (barbershop_id IN (SELECT id FROM barbershops WHERE owner_user_id = auth.uid()))
WITH CHECK (barbershop_id IN (SELECT id FROM barbershops WHERE owner_user_id = auth.uid()));

CREATE POLICY "Public can view business hours"
ON business_hours FOR SELECT
USING (barbershop_id IN (SELECT id FROM barbershops WHERE is_active = true));

-- Barber Working Hours Policies
CREATE POLICY "Owners can manage barber working hours"
ON barber_working_hours FOR ALL
USING (barbershop_id IN (SELECT id FROM barbershops WHERE owner_user_id = auth.uid()))
WITH CHECK (barbershop_id IN (SELECT id FROM barbershops WHERE owner_user_id = auth.uid()));

CREATE POLICY "Public can view barber working hours"
ON barber_working_hours FOR SELECT
USING (barbershop_id IN (SELECT id FROM barbershops WHERE is_active = true));

-- Barber Time Off Policies
CREATE POLICY "Owners can manage barber time off"
ON barber_time_off FOR ALL
USING (barbershop_id IN (SELECT id FROM barbershops WHERE owner_user_id = auth.uid()))
WITH CHECK (barbershop_id IN (SELECT id FROM barbershops WHERE owner_user_id = auth.uid()));

-- Customers Policies (Strictly private: only owner)
CREATE POLICY "Owners can manage own customers"
ON customers FOR ALL
USING (barbershop_id IN (SELECT id FROM barbershops WHERE owner_user_id = auth.uid()))
WITH CHECK (barbershop_id IN (SELECT id FROM barbershops WHERE owner_user_id = auth.uid()));

-- Appointments Policies (Strictly private: only owner)
CREATE POLICY "Owners can manage own appointments"
ON appointments FOR ALL
USING (barbershop_id IN (SELECT id FROM barbershops WHERE owner_user_id = auth.uid()))
WITH CHECK (barbershop_id IN (SELECT id FROM barbershops WHERE owner_user_id = auth.uid()));

-- TRANSACTIONAL DATABASE FUNCTION FOR PUBLIC BOOKINGS
-- Security definer ensures safe atomic execution while isolating customer records
CREATE OR REPLACE FUNCTION book_public_appointment(
  p_barbershop_id uuid,
  p_service_id uuid,
  p_barber_id uuid, -- NULL if "any available"
  p_starts_at timestamptz,
  p_customer_name text,
  p_customer_phone text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_shop barbershops%ROWTYPE;
  v_service services%ROWTYPE;
  v_barber_id uuid := p_barber_id;
  v_ends_at timestamptz;
  v_customer_id uuid;
  v_phone_normalized text;
  v_status appointment_status;
  v_public_code text;
  v_new_appointment appointments%ROWTYPE;
BEGIN
  -- 1. Validate Barbershop
  SELECT * INTO v_shop FROM barbershops WHERE id = p_barbershop_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'SHOP_NOT_FOUND', 'message', 'Barbearia não encontrada ou inativa.');
  END IF;

  -- 2. Validate Service
  SELECT * INTO v_service FROM services WHERE id = p_service_id AND barbershop_id = p_barbershop_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'SERVICE_NOT_FOUND', 'message', 'Serviço não encontrado ou indisponível.');
  END IF;

  -- 3. Calculate Ends At from snapshot duration
  v_ends_at := p_starts_at + (v_service.duration_minutes || ' minutes')::interval;

  -- 4. Check future date
  IF p_starts_at <= now() THEN
    RETURN jsonb_build_object('success', false, 'code', 'PAST_TIME', 'message', 'Não é possível agendar horários no passado.');
  END IF;

  -- 5. If "any barber" requested, find the first available barber who offers this service
  IF v_barber_id IS NULL THEN
    SELECT b.id INTO v_barber_id
    FROM barbers b
    JOIN barber_services bs ON bs.barber_id = b.id AND bs.service_id = p_service_id
    WHERE b.barbershop_id = p_barbershop_id AND b.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM appointments a
        WHERE a.barber_id = b.id
          AND a.status IN ('pending', 'confirmed', 'in_progress')
          AND tstzrange(a.starts_at, a.ends_at) && tstzrange(p_starts_at, v_ends_at)
      )
      AND NOT EXISTS (
        SELECT 1 FROM barber_time_off bto
        WHERE bto.barber_id = b.id
          AND tstzrange(bto.starts_at, bto.ends_at) && tstzrange(p_starts_at, v_ends_at)
      )
    ORDER BY b.sort_order, b.name
    LIMIT 1;

    IF v_barber_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'code', 'NO_BARBER_AVAILABLE', 'message', 'Nenhum profissional disponível para este horário.');
    END IF;
  ELSE
    -- Verify chosen barber performs the service and is active
    IF NOT EXISTS (
      SELECT 1 FROM barber_services bs
      JOIN barbers b ON b.id = bs.barber_id
      WHERE bs.barber_id = v_barber_id AND bs.service_id = p_service_id AND b.is_active = true
    ) THEN
      RETURN jsonb_build_object('success', false, 'code', 'BARBER_SERVICE_MISMATCH', 'message', 'O profissional selecionado não realiza este serviço.');
    END IF;
  END IF;

  -- 6. Normalize phone (strip non-digits)
  v_phone_normalized := regexp_replace(p_customer_phone, '\D', '', 'g');
  IF length(v_phone_normalized) < 10 THEN
    RETURN jsonb_build_object('success', false, 'code', 'INVALID_PHONE', 'message', 'Telefone inválido. Informe o DDD e o número.');
  END IF;

  -- 7. Upsert Customer (find existing by shop + normalized phone or insert)
  SELECT id INTO v_customer_id FROM customers WHERE barbershop_id = p_barbershop_id AND phone_normalized = v_phone_normalized;
  IF v_customer_id IS NULL THEN
    INSERT INTO customers (barbershop_id, name, phone_normalized)
    VALUES (p_barbershop_id, trim(p_customer_name), v_phone_normalized)
    RETURNING id INTO v_customer_id;
  ELSE
    UPDATE customers SET name = trim(p_customer_name), updated_at = now() WHERE id = v_customer_id;
  END IF;

  -- 8. Determine Status based on confirmation mode
  IF v_shop.booking_confirmation_mode = 'manual' THEN
    v_status := 'pending';
  ELSE
    v_status := 'confirmed';
  END IF;

  -- 9. Generate random non-sequential public code (e.g. AP-9B2X7)
  v_public_code := 'AP-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));

  -- 10. Insert Appointment inside transaction with snapshot data
  BEGIN
    INSERT INTO appointments (
      barbershop_id,
      barber_id,
      service_id,
      customer_id,
      starts_at,
      ends_at,
      status,
      booking_source,
      price_cents_snapshot,
      duration_minutes_snapshot,
      service_name_snapshot,
      public_code
    )
    VALUES (
      p_barbershop_id,
      v_barber_id,
      p_service_id,
      v_customer_id,
      p_starts_at,
      v_ends_at,
      v_status,
      'public',
      v_service.price_cents,
      v_service.duration_minutes,
      v_service.name,
      v_public_code
    )
    RETURNING * INTO v_new_appointment;

    RETURN jsonb_build_object(
      'success', true,
      'appointment', jsonb_build_object(
        'id', v_new_appointment.id,
        'public_code', v_new_appointment.public_code,
        'starts_at', v_new_appointment.starts_at,
        'ends_at', v_new_appointment.ends_at,
        'status', v_new_appointment.status,
        'service_name', v_new_appointment.service_name_snapshot,
        'price_cents', v_new_appointment.price_cents_snapshot,
        'duration_minutes', v_new_appointment.duration_minutes_snapshot,
        'barber_id', v_new_appointment.barber_id
      )
    );
  EXCEPTION
    -- Catch PostgreSQL 23P01 exclusion_violation
    WHEN exclusion_violation THEN
      RETURN jsonb_build_object(
        'success', false,
        'code', 'SLOT_CONFLICT',
        'message', 'Este horário acabou de ser ocupado. Por favor, selecione outro horário.'
      );
  END;
END;
$$;
