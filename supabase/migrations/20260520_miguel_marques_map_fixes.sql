-- Miguel Marques: map fixes — missing lots, typo corrections, plan config sync
-- Quadra O was truncated (12 → 44 lots), V had lot#75 typo, O/M missing inner lots

DO $$
DECLARE
  dev_id UUID;
BEGIN
  SELECT id INTO dev_id FROM public.developments WHERE slug = 'loteamento-miguel-marques';
  IF dev_id IS NULL THEN RAISE EXCEPTION 'Development loteamento-miguel-marques not found'; END IF;

  -- ─── Fix Quadra V: lot_number 75 → 25 (typo in original seed) ────────────────
  UPDATE public.subdivision_lots
     SET lot_number = 25
   WHERE development_id = dev_id AND quadra = 'V' AND lot_number = 75;

  -- ─── Complete Quadra O (was truncated at 12; full data from PDF) ──────────────
  INSERT INTO public.subdivision_lots (development_id, quadra, lot_number, area_m2, price, status)
  VALUES
  (dev_id,'O',13,160.00,35000.00,'DISPONIVEL'),
  (dev_id,'O',14,160.00,35000.00,'DISPONIVEL'),
  (dev_id,'O',15,160.00,35000.00,'DISPONIVEL'),
  (dev_id,'O',16,160.00,35000.00,'DISPONIVEL'),
  (dev_id,'O',17,160.00,35000.00,'DISPONIVEL'),
  (dev_id,'O',18,160.00,35000.00,'DISPONIVEL'),
  (dev_id,'O',19,160.00,35000.00,'DISPONIVEL'),
  (dev_id,'O',20,160.00,35000.00,'VENDIDO'),
  (dev_id,'O',21,160.00,35000.00,'VENDIDO'),
  (dev_id,'O',22,160.00,35000.00,'VENDIDO'),
  (dev_id,'O',23,160.00,35000.00,'DISPONIVEL'),
  (dev_id,'O',24,160.00,35000.00,'DISPONIVEL'),
  (dev_id,'O',25,160.00,35000.00,'DISPONIVEL'),
  (dev_id,'O',26,160.00,35000.00,'DISPONIVEL'),
  (dev_id,'O',27,160.00,35000.00,'DISPONIVEL'),
  (dev_id,'O',28,160.00,35000.00,'DISPONIVEL'),
  (dev_id,'O',29,160.00,35000.00,'DISPONIVEL'),
  (dev_id,'O',30,160.00,35000.00,'DISPONIVEL'),
  (dev_id,'O',31,160.00,35000.00,'DISPONIVEL'),
  (dev_id,'O',32,160.00,35000.00,'DISPONIVEL'),
  (dev_id,'O',33,160.00,35000.00,'DISPONIVEL'),
  (dev_id,'O',34,160.00,35000.00,'DISPONIVEL'),
  (dev_id,'O',35,160.00,35000.00,'DISPONIVEL'),
  (dev_id,'O',36,160.00,35000.00,'DISPONIVEL'),
  (dev_id,'O',37,160.00,35000.00,'DISPONIVEL'),
  (dev_id,'O',38,160.00,35000.00,'DISPONIVEL'),
  (dev_id,'O',39,160.00,35000.00,'DISPONIVEL'),
  (dev_id,'O',40,160.00,35000.00,'DISPONIVEL'),
  (dev_id,'O',41,200.00,43750.00,'DISPONIVEL'),
  (dev_id,'O',42,200.00,43750.00,'DISPONIVEL'),
  (dev_id,'O',43,200.00,43750.00,'DISPONIVEL'),
  (dev_id,'O',44,200.00,43750.00,'DISPONIVEL')
  ON CONFLICT (development_id, quadra, lot_number) DO NOTHING;

  -- ─── Complete Quadra M (was truncated at 25; full data from PDF) ─────────────
  INSERT INTO public.subdivision_lots (development_id, quadra, lot_number, area_m2, price, status)
  VALUES
  (dev_id,'M',26,160.00,37000.00,'DISPONIVEL'),
  (dev_id,'M',27,160.00,37000.00,'DISPONIVEL'),
  (dev_id,'M',28,160.00,37000.00,'DISPONIVEL'),
  (dev_id,'M',29,160.00,37000.00,'DISPONIVEL'),
  (dev_id,'M',30,160.00,37000.00,'DISPONIVEL'),
  (dev_id,'M',31,160.00,37000.00,'DISPONIVEL'),
  (dev_id,'M',32,160.00,37000.00,'NEGOCIACAO'),
  (dev_id,'M',33,160.00,37000.00,'VENDIDO'),
  (dev_id,'M',34,160.00,37000.00,'VENDIDO'),
  (dev_id,'M',35,160.00,37000.00,'VENDIDO'),
  (dev_id,'M',36,160.00,37000.00,'VENDIDO'),
  (dev_id,'M',37,160.00,37000.00,'VENDIDO'),
  (dev_id,'M',38,160.00,37000.00,'VENDIDO'),
  (dev_id,'M',39,277.70,64218.13,'VENDIDO'),
  (dev_id,'M',40,255.49,59082.06,'VENDIDO'),
  (dev_id,'M',41,233.29,53948.31,'VENDIDO'),
  (dev_id,'M',42,211.08,48812.25,'VENDIDO'),
  (dev_id,'M',43,190.47,41665.31,'DISPONIVEL'),
  (dev_id,'M',44,206.64,45202.50,'DISPONIVEL'),
  (dev_id,'M',45,222.82,48741.88,'DISPONIVEL'),
  (dev_id,'M',46,238.99,52279.06,'DISPONIVEL'),
  (dev_id,'M',47,200.00,43750.00,'DISPONIVEL'),
  (dev_id,'M',48,200.00,43750.00,'DISPONIVEL'),
  (dev_id,'M',49,200.00,43750.00,'DISPONIVEL'),
  (dev_id,'M',50,200.00,43750.00,'DISPONIVEL')
  ON CONFLICT (development_id, quadra, lot_number) DO NOTHING;

  -- ─── Complete Quadra H (was truncated at 20; lots 21–42 from PDF pattern) ────
  INSERT INTO public.subdivision_lots (development_id, quadra, lot_number, area_m2, price, status)
  VALUES
  (dev_id,'H',21,160.00,31000.00,'DISPONIVEL'),
  (dev_id,'H',22,160.00,31000.00,'DISPONIVEL'),
  (dev_id,'H',23,160.00,31000.00,'DISPONIVEL'),
  (dev_id,'H',24,160.00,31000.00,'DISPONIVEL'),
  (dev_id,'H',25,160.00,31000.00,'DISPONIVEL'),
  (dev_id,'H',26,160.00,31000.00,'DISPONIVEL'),
  (dev_id,'H',27,160.00,31000.00,'DISPONIVEL'),
  (dev_id,'H',28,160.00,31000.00,'DISPONIVEL'),
  (dev_id,'H',29,160.00,31000.00,'DISPONIVEL'),
  (dev_id,'H',30,160.00,31000.00,'DISPONIVEL'),
  (dev_id,'H',31,160.00,31000.00,'DISPONIVEL'),
  (dev_id,'H',32,160.00,31000.00,'DISPONIVEL'),
  (dev_id,'H',33,160.00,31000.00,'DISPONIVEL'),
  (dev_id,'H',34,160.00,31000.00,'DISPONIVEL'),
  (dev_id,'H',35,160.00,31000.00,'DISPONIVEL'),
  (dev_id,'H',36,160.00,31000.00,'DISPONIVEL'),
  (dev_id,'H',37,160.00,31000.00,'DISPONIVEL'),
  (dev_id,'H',38,160.00,31000.00,'DISPONIVEL'),
  (dev_id,'H',39,192.01,37201.94,'VENDIDO'),
  (dev_id,'H',40,160.00,31000.00,'VENDIDO'),
  (dev_id,'H',41,160.00,31000.00,'VENDIDO'),
  (dev_id,'H',42,160.00,31000.00,'VENDIDO')
  ON CONFLICT (development_id, quadra, lot_number) DO NOTHING;

  -- ─── Update price_from on development to reflect current market minimum ──────
  UPDATE public.developments
     SET price_from = (
           SELECT MIN(price) FROM public.subdivision_lots
            WHERE development_id = dev_id AND status = 'DISPONIVEL' AND price IS NOT NULL
         ),
         price_min = (
           SELECT MIN(price) FROM public.subdivision_lots
            WHERE development_id = dev_id AND price IS NOT NULL
         ),
         updated_at = NOW()
   WHERE id = dev_id;

  RAISE NOTICE 'Miguel Marques map fixes applied for development: %', dev_id;
END $$;
