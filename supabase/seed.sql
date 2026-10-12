-- AGENDAPRO SEED: BARBEARIA MESTRE NAVALHA (Maceió/AL)

DO $$
DECLARE
  v_owner_id uuid := '00000000-0000-0000-0000-000000000001';
  v_shop_id uuid := '11111111-1111-1111-1111-111111111111';
  
  v_barber_rodrigo uuid := '22222222-2222-2222-2222-222222222221';
  v_barber_carlos uuid := '22222222-2222-2222-2222-222222222222';
  v_barber_lucas uuid := '22222222-2222-2222-2222-222222222223';

  v_srv_corte uuid := '33333333-3333-3333-3333-333333333331';
  v_srv_barba uuid := '33333333-3333-3333-3333-333333333332';
  v_srv_combo uuid := '33333333-3333-3333-3333-333333333333';
  v_srv_acabamento uuid := '33333333-3333-3333-3333-333333333334';
  v_srv_pigmentacao uuid := '33333333-3333-3333-3333-333333333335';

  v_cust_bruno uuid := '44444444-4444-4444-4444-444444444441';
  v_cust_eduardo uuid := '44444444-4444-4444-4444-444444444442';
  v_cust_mateus uuid := '44444444-4444-4444-4444-444444444443';
  v_cust_gabriel uuid := '44444444-4444-4444-4444-444444444444';
  
  v_today date := current_date;
BEGIN
  -- Clean existing seed data
  DELETE FROM appointments WHERE barbershop_id = v_shop_id;
  DELETE FROM customers WHERE barbershop_id = v_shop_id;
  DELETE FROM barber_time_off WHERE barbershop_id = v_shop_id;
  DELETE FROM barber_working_hours WHERE barbershop_id = v_shop_id;
  DELETE FROM business_hours WHERE barbershop_id = v_shop_id;
  DELETE FROM barber_services WHERE barbershop_id = v_shop_id;
  DELETE FROM services WHERE barbershop_id = v_shop_id;
  DELETE FROM barbers WHERE barbershop_id = v_shop_id;
  DELETE FROM barbershops WHERE id = v_shop_id;

  -- 1. Barbershop
  INSERT INTO barbershops (
    id, owner_user_id, name, slug, description, phone, whatsapp, address, 
    timezone, booking_confirmation_mode, is_active
  ) VALUES (
    v_shop_id,
    v_owner_id,
    'Barbearia Mestre Navalha',
    'mestre-navalha',
    'Tradição, navalha afiada e toalha quente no coração de Maceió.',
    '(82) 98765-4321',
    '(82) 98765-4321',
    'Rua do Sol, 452 - Ponta Verde, Maceió - AL',
    'America/Maceio',
    'auto',
    true
  );

  -- 2. Barbers
  INSERT INTO barbers (id, barbershop_id, name, description, photo_url, is_active, sort_order) VALUES
  (v_barber_rodrigo, v_shop_id, 'Rodrigo Mestre', 'Fundador e mestre navalheiro com 12 anos de experiência.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop', true, 1),
  (v_barber_carlos, v_shop_id, 'Carlos Silva', 'Especialista em barboterapia, visagismo e cuidados faciais.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop', true, 2),
  (v_barber_lucas, v_shop_id, 'Lucas Andrade', 'Especialista em degradês modernos, freestyle e cortes clássicos.', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop', true, 3);

  -- 3. Services
  INSERT INTO services (id, barbershop_id, name, description, price_cents, duration_minutes, is_active) VALUES
  (v_srv_corte, v_shop_id, 'Corte Tradicional', 'Corte com tesoura e máquina, finalizado com navalha e penteado.', 4500, 30, true),
  (v_srv_barba, v_shop_id, 'Barba Terapia com Toalha Quente', 'Tratamento completo com óleo essencial, toalha quente e massagem facial.', 3500, 30, true),
  (v_srv_combo, v_shop_id, 'Combo Corte + Barba', 'A experiência completa de cuidado masculino com desconto especial.', 7000, 60, true),
  (v_srv_acabamento, v_shop_id, 'Acabamento / Pezinho', 'Ajuste de contornos, nuca e costeletas na navalha.', 2000, 15, true),
  (v_srv_pigmentacao, v_shop_id, 'Pigmentação de Barba', 'Alinhamento e camuflagem de falhas com pigmento profissional.', 2500, 20, true);

  -- 4. Barber Services Mapping
  -- Rodrigo: performs all
  INSERT INTO barber_services (barber_id, service_id, barbershop_id) VALUES
  (v_barber_rodrigo, v_srv_corte, v_shop_id),
  (v_barber_rodrigo, v_srv_barba, v_shop_id),
  (v_barber_rodrigo, v_srv_combo, v_shop_id),
  (v_barber_rodrigo, v_srv_acabamento, v_shop_id),
  (v_barber_rodrigo, v_srv_pigmentacao, v_shop_id);

  -- Carlos: specialized in beard & finish
  INSERT INTO barber_services (barber_id, service_id, barbershop_id) VALUES
  (v_barber_carlos, v_srv_barba, v_shop_id),
  (v_barber_carlos, v_srv_combo, v_shop_id),
  (v_barber_carlos, v_srv_acabamento, v_shop_id),
  (v_barber_carlos, v_srv_pigmentacao, v_shop_id);

  -- Lucas: specialized in cuts & combos
  INSERT INTO barber_services (barber_id, service_id, barbershop_id) VALUES
  (v_barber_lucas, v_srv_corte, v_shop_id),
  (v_barber_lucas, v_srv_combo, v_shop_id),
  (v_barber_lucas, v_srv_acabamento, v_shop_id);

  -- 5. Business Hours (0=Sunday, 1=Monday, ..., 6=Saturday)
  INSERT INTO business_hours (barbershop_id, day_of_week, is_closed, opens_at, closes_at) VALUES
  (v_shop_id, 0, true, '08:00', '19:00'),
  (v_shop_id, 1, false, '08:00', '19:00'),
  (v_shop_id, 2, false, '08:00', '19:00'),
  (v_shop_id, 3, false, '08:00', '19:00'),
  (v_shop_id, 4, false, '08:00', '19:00'),
  (v_shop_id, 5, false, '08:00', '20:00'),
  (v_shop_id, 6, false, '08:00', '18:00');

  -- 6. Barber Working Hours
  -- Rodrigo: Mon-Fri 08:00-18:00 (Break 12:00-13:00), Sat 08:00-14:00
  FOR day_idx IN 1..5 LOOP
    INSERT INTO barber_working_hours (barber_id, barbershop_id, day_of_week, is_working, starts_at, ends_at, break_starts_at, break_ends_at)
    VALUES (v_barber_rodrigo, v_shop_id, day_idx, true, '08:00', '18:00', '12:00', '13:00');
  END LOOP;
  INSERT INTO barber_working_hours (barber_id, barbershop_id, day_of_week, is_working, starts_at, ends_at, break_starts_at, break_ends_at)
  VALUES (v_barber_rodrigo, v_shop_id, 6, true, '08:00', '14:00', NULL, NULL);
  INSERT INTO barber_working_hours (barber_id, barbershop_id, day_of_week, is_working, starts_at, ends_at)
  VALUES (v_barber_rodrigo, v_shop_id, 0, false, '08:00', '18:00');

  -- Carlos: Tue-Sat 09:00-19:00 (Break 13:00-14:00)
  INSERT INTO barber_working_hours (barber_id, barbershop_id, day_of_week, is_working, starts_at, ends_at)
  VALUES (v_barber_carlos, v_shop_id, 0, false, '09:00', '19:00'),
         (v_barber_carlos, v_shop_id, 1, false, '09:00', '19:00');
  FOR day_idx IN 2..6 LOOP
    INSERT INTO barber_working_hours (barber_id, barbershop_id, day_of_week, is_working, starts_at, ends_at, break_starts_at, break_ends_at)
    VALUES (v_barber_carlos, v_shop_id, day_idx, true, '09:00', '19:00', '13:00', '14:00');
  END LOOP;

  -- Lucas: Mon-Fri 10:00-19:00 (Break 14:00-15:00), Sat 08:00-16:00
  INSERT INTO barber_working_hours (barber_id, barbershop_id, day_of_week, is_working, starts_at, ends_at)
  VALUES (v_barber_lucas, v_shop_id, 0, false, '10:00', '19:00');
  FOR day_idx IN 1..5 LOOP
    INSERT INTO barber_working_hours (barber_id, barbershop_id, day_of_week, is_working, starts_at, ends_at, break_starts_at, break_ends_at)
    VALUES (v_barber_lucas, v_shop_id, day_idx, true, '10:00', '19:00', '14:00', '15:00');
  END LOOP;
  INSERT INTO barber_working_hours (barber_id, barbershop_id, day_of_week, is_working, starts_at, ends_at, break_starts_at, break_ends_at)
  VALUES (v_barber_lucas, v_shop_id, 6, true, '08:00', '16:00', '12:00', '13:00');

  -- 7. Time Off
  INSERT INTO barber_time_off (barbershop_id, barber_id, starts_at, ends_at, reason)
  VALUES (v_shop_id, v_barber_carlos, (v_today + interval '1 day' + time '14:00')::timestamptz, (v_today + interval '1 day' + time '16:00')::timestamptz, 'Consulta médica');

  -- 8. Customers
  INSERT INTO customers (id, barbershop_id, name, phone_normalized) VALUES
  (v_cust_bruno, v_shop_id, 'Bruno Carvalho', '82991234567'),
  (v_cust_eduardo, v_shop_id, 'Eduardo Lima', '82998765432'),
  (v_cust_mateus, v_shop_id, 'Mateus Albuquerque', '82993456789'),
  (v_cust_gabriel, v_shop_id, 'Gabriel Ramos', '82988887777');

  -- 9. Appointments (Today's sample appointments)
  INSERT INTO appointments (
    barbershop_id, barber_id, service_id, customer_id, 
    starts_at, ends_at, status, booking_source, 
    price_cents_snapshot, duration_minutes_snapshot, service_name_snapshot, public_code
  ) VALUES
  (
    v_shop_id, v_barber_rodrigo, v_srv_corte, v_cust_bruno,
    (v_today + time '09:00')::timestamptz, (v_today + time '09:30')::timestamptz,
    'confirmed', 'public', 4500, 30, 'Corte Tradicional', 'AP-MN0900'
  ),
  (
    v_shop_id, v_barber_rodrigo, v_srv_combo, v_cust_eduardo,
    (v_today + time '10:00')::timestamptz, (v_today + time '11:00')::timestamptz,
    'confirmed', 'admin', 7000, 60, 'Combo Corte + Barba', 'AP-MN1000'
  ),
  (
    v_shop_id, v_barber_carlos, v_srv_barba, v_cust_mateus,
    (v_today + time '10:30')::timestamptz, (v_today + time '11:00')::timestamptz,
    'in_progress', 'public', 3500, 30, 'Barba Terapia com Toalha Quente', 'AP-MN1030'
  ),
  (
    v_shop_id, v_barber_lucas, v_srv_corte, v_cust_gabriel,
    (v_today + time '11:30')::timestamptz, (v_today + time '12:00')::timestamptz,
    'pending', 'public', 4500, 30, 'Corte Tradicional', 'AP-MN1130'
  );

END $$;
