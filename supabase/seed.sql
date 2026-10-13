-- AGENDAPRO SEED: ANTHONY'S BARBEARIA (Maceió/AL)
-- Estilo • Respeito • Autoestima

DO $$
DECLARE
  v_owner_id uuid := '00000000-0000-0000-0000-000000000001';
  v_shop_id uuid := '11111111-1111-1111-1111-111111111111';
  
  v_barber_anthony uuid := '22222222-2222-2222-2222-222222222221';
  v_barber_carlos uuid := '22222222-2222-2222-2222-222222222222';
  v_barber_lucas uuid := '22222222-2222-2222-2222-222222222223';

  v_srv_corte uuid := '33333333-3333-3333-3333-333333333331';
  v_srv_barba uuid := '33333333-3333-3333-3333-333333333332';
  v_srv_combo uuid := '33333333-3333-3333-3333-333333333333';
  v_srv_sobrancelha uuid := '33333333-3333-3333-3333-333333333334';
  v_srv_pezinho uuid := '33333333-3333-3333-3333-333333333335';
  v_srv_pigmentacao uuid := '33333333-3333-3333-3333-333333333336';

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

  -- 1. Barbershop: Anthony's Barbearia
  INSERT INTO barbershops (
    id, owner_user_id, name, slug, description, phone, whatsapp, address, 
    timezone, booking_confirmation_mode, is_active
  ) VALUES (
    v_shop_id,
    v_owner_id,
    'Anthony''s Barbearia',
    'anthonys-barbearia',
    'Estilo • Respeito • Autoestima. Mais que um corte, é um cuidado com você!',
    '(82) 99876-5432',
    '(82) 99876-5432',
    'Rua do Comércio, 520 - Centro, Maceió - AL',
    'America/Maceio',
    'auto',
    true
  );

  -- 2. Barbers
  INSERT INTO barbers (id, barbershop_id, name, description, photo_url, is_active, sort_order) VALUES
  (v_barber_anthony, v_shop_id, 'Anthony Mestre', 'Fundador e mestre navalheiro especializado em visagismo e cortes clássicos.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop', true, 1),
  (v_barber_carlos, v_shop_id, 'Carlos Silva', 'Especialista em barboterapia, pigmentação e visagismo facial.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop', true, 2),
  (v_barber_lucas, v_shop_id, 'Lucas Andrade', 'Especialista em degradês modernos, fade e acabamento com lâmina.', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop', true, 3);

  -- 3. Services (Tabela Oficial)
  INSERT INTO services (id, barbershop_id, name, description, price_cents, duration_minutes, is_active) VALUES
  (v_srv_corte, v_shop_id, 'Corte de Cabelo', 'Corte masculino personalizado com tesoura e máquina, finalização precisa.', 2500, 30, true),
  (v_srv_barba, v_shop_id, 'Barba', 'Alinhamento, toalha quente, hidratação e desenho na navalha afiada.', 2000, 25, true),
  (v_srv_combo, v_shop_id, 'Corte + Barba', 'Experiência completa: corte de cabelo + barba alinhada com toalha quente.', 4000, 50, true),
  (v_srv_sobrancelha, v_shop_id, 'Sobrancelha', 'Design e alinhamento na navalha para realce e harmonia do olhar.', 500, 15, true),
  (v_srv_pezinho, v_shop_id, 'Pezinho', 'Acabamento dos contornos da nuca, costeletas e testa na lâmina descartável.', 500, 15, true),
  (v_srv_pigmentacao, v_shop_id, 'Pigmentação', 'Disfarce de fios brancos e preenchimento de falhas no cabelo ou barba.', 1000, 20, true);

  -- 4. Barber Services Mapping
  -- All barbers perform all 6 services
  INSERT INTO barber_services (barber_id, service_id, barbershop_id) VALUES
  (v_barber_anthony, v_srv_corte, v_shop_id),
  (v_barber_anthony, v_srv_barba, v_shop_id),
  (v_barber_anthony, v_srv_combo, v_shop_id),
  (v_barber_anthony, v_srv_sobrancelha, v_shop_id),
  (v_barber_anthony, v_srv_pezinho, v_shop_id),
  (v_barber_anthony, v_srv_pigmentacao, v_shop_id),

  (v_barber_carlos, v_srv_corte, v_shop_id),
  (v_barber_carlos, v_srv_barba, v_shop_id),
  (v_barber_carlos, v_srv_combo, v_shop_id),
  (v_barber_carlos, v_srv_sobrancelha, v_shop_id),
  (v_barber_carlos, v_srv_pezinho, v_shop_id),
  (v_barber_carlos, v_srv_pigmentacao, v_shop_id),

  (v_barber_lucas, v_srv_corte, v_shop_id),
  (v_barber_lucas, v_srv_barba, v_shop_id),
  (v_barber_lucas, v_srv_combo, v_shop_id),
  (v_barber_lucas, v_srv_sobrancelha, v_shop_id),
  (v_barber_lucas, v_srv_pezinho, v_shop_id),
  (v_barber_lucas, v_srv_pigmentacao, v_shop_id);

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
  -- Anthony: Mon-Fri 08:00-18:00 (Break 12:00-13:00), Sat 08:00-14:00
  FOR day_idx IN 1..5 LOOP
    INSERT INTO barber_working_hours (barber_id, barbershop_id, day_of_week, is_working, starts_at, ends_at, break_starts_at, break_ends_at)
    VALUES (v_barber_anthony, v_shop_id, day_idx, true, '08:00', '18:00', '12:00', '13:00');
  END LOOP;
  INSERT INTO barber_working_hours (barber_id, barbershop_id, day_of_week, is_working, starts_at, ends_at, break_starts_at, break_ends_at)
  VALUES (v_barber_anthony, v_shop_id, 6, true, '08:00', '14:00', NULL, NULL);
  INSERT INTO barber_working_hours (barber_id, barbershop_id, day_of_week, is_working, starts_at, ends_at)
  VALUES (v_barber_anthony, v_shop_id, 0, false, '08:00', '18:00');

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

  -- 9. Appointments
  INSERT INTO appointments (
    barbershop_id, barber_id, service_id, customer_id, 
    starts_at, ends_at, status, booking_source, 
    price_cents_snapshot, duration_minutes_snapshot, service_name_snapshot, public_code
  ) VALUES
  (
    v_shop_id, v_barber_anthony, v_srv_corte, v_cust_bruno,
    (v_today + time '09:00')::timestamptz, (v_today + time '09:30')::timestamptz,
    'confirmed', 'public', 2500, 30, 'Corte de Cabelo', 'AP-ANT0900'
  ),
  (
    v_shop_id, v_barber_anthony, v_srv_combo, v_cust_eduardo,
    (v_today + time '10:00')::timestamptz, (v_today + time '10:50')::timestamptz,
    'confirmed', 'admin', 4000, 50, 'Corte + Barba', 'AP-ANT1000'
  ),
  (
    v_shop_id, v_barber_carlos, v_srv_barba, v_cust_mateus,
    (v_today + time '11:00')::timestamptz, (v_today + time '11:25')::timestamptz,
    'in_progress', 'public', 2000, 25, 'Barba', 'AP-ANT1100'
  ),
  (
    v_shop_id, v_barber_lucas, v_srv_corte, v_cust_gabriel,
    (v_today + time '14:30')::timestamptz, (v_today + time '15:00')::timestamptz,
    'pending', 'public', 2500, 30, 'Corte de Cabelo', 'AP-ANT1430'
  );

END $$;
