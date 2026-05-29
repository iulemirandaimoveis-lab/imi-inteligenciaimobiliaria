-- Alto Bellevue – Preços Oficiais (Tabela emissão 01/04/2026, validade 31/05/2026)
-- 16 quadras (A–P), 382 lotes comerciais + 1 ANTENA = 383 lotes totais
-- Substitui o seed anterior (20260518) que usava preços estimados

DO $$
DECLARE
  dev_id UUID := 'ab7d1fc1-f069-4e3b-a515-8e1204c11247';
BEGIN
  -- Atualiza registro do empreendimento com faixa de preços correta
  UPDATE public.developments SET
    price_from = 202231.68,
    price_min  = 202231.68,
    price_max  = 476570.72,
    area_from  = 289.26,
    description = 'Loteamento residencial premium em Aloísio Pinto, Garanhuns (PE). 382 lotes de 289 a 693 m² em 16 quadras, com infraestrutura completa, portaria 24h e condições especiais de financiamento.'
  WHERE id = dev_id;

  -- Remove seed anterior
  DELETE FROM public.subdivision_lots WHERE development_id = dev_id;

  -- ─── QUADRA A (25 lotes) ─────────────────────────────────────────────────
  INSERT INTO public.subdivision_lots (development_id, quadra, lot_number, area_m2, price, status) VALUES
  (dev_id,'A', 1,355.99,233529.44,'DISPONIVEL'),
  (dev_id,'A', 2,355.99,233529.44,'DISPONIVEL'),
  (dev_id,'A', 3,355.99,233529.44,'DISPONIVEL'),
  (dev_id,'A', 4,355.99,233529.44,'DISPONIVEL'),
  (dev_id,'A', 5,355.99,233529.44,'DISPONIVEL'),
  (dev_id,'A', 6,355.99,233529.44,'DISPONIVEL'),
  (dev_id,'A', 7,355.99,233529.44,'DISPONIVEL'),
  (dev_id,'A', 8,355.99,233529.44,'DISPONIVEL'),
  (dev_id,'A', 9,355.99,233529.44,'DISPONIVEL'),
  (dev_id,'A',10,355.99,233529.44,'DISPONIVEL'),
  (dev_id,'A',11,355.99,233529.44,'DISPONIVEL'),
  (dev_id,'A',12,434.81,285235.36,'DISPONIVEL'),
  (dev_id,'A',13,379.94,249240.64,'DISPONIVEL'),
  (dev_id,'A',14,351.25,230420.00,'DISPONIVEL'),
  (dev_id,'A',15,351.25,230420.00,'DISPONIVEL'),
  (dev_id,'A',16,351.25,230420.00,'DISPONIVEL'),
  (dev_id,'A',17,351.24,230413.44,'DISPONIVEL'),
  (dev_id,'A',18,351.24,230413.44,'DISPONIVEL'),
  (dev_id,'A',19,351.24,230413.44,'DISPONIVEL'),
  (dev_id,'A',20,351.24,230413.44,'DISPONIVEL'),
  (dev_id,'A',21,351.24,230413.44,'DISPONIVEL'),
  (dev_id,'A',22,351.24,230413.44,'DISPONIVEL'),
  (dev_id,'A',23,350.25,229764.00,'DISPONIVEL'),
  (dev_id,'A',24,323.30,212084.80,'DISPONIVEL'),
  (dev_id,'A',25,369.16,242168.96,'DISPONIVEL');

  -- ─── QUADRA B (19 lotes) ─────────────────────────────────────────────────
  INSERT INTO public.subdivision_lots (development_id, quadra, lot_number, area_m2, price, status) VALUES
  (dev_id,'B', 1,312.71,205137.76,'DISPONIVEL'),
  (dev_id,'B', 2,312.72,205144.32,'DISPONIVEL'),
  (dev_id,'B', 3,312.72,205144.32,'DISPONIVEL'),
  (dev_id,'B', 4,312.72,205144.32,'DISPONIVEL'),
  (dev_id,'B', 5,312.72,205144.32,'DISPONIVEL'),
  (dev_id,'B', 6,312.72,205144.32,'DISPONIVEL'),
  (dev_id,'B', 7,312.72,205144.32,'DISPONIVEL'),
  (dev_id,'B', 8,312.72,205144.32,'DISPONIVEL'),
  (dev_id,'B', 9,312.72,205144.32,'DISPONIVEL'),
  (dev_id,'B',10,352.80,231436.80,'DISPONIVEL'),
  (dev_id,'B',11,375.93,246610.08,'DISPONIVEL'),
  (dev_id,'B',12,318.73,209086.88,'DISPONIVEL'),
  (dev_id,'B',13,318.72,209080.32,'DISPONIVEL'),
  (dev_id,'B',14,318.72,209080.32,'DISPONIVEL'),
  (dev_id,'B',15,318.71,209073.76,'DISPONIVEL'),
  (dev_id,'B',16,318.71,209073.76,'DISPONIVEL'),
  (dev_id,'B',17,318.71,209073.76,'DISPONIVEL'),
  (dev_id,'B',18,318.72,209080.32,'DISPONIVEL'),
  (dev_id,'B',19,318.74,209093.44,'DISPONIVEL');

  -- ─── QUADRA C (13 lotes) ─────────────────────────────────────────────────
  INSERT INTO public.subdivision_lots (development_id, quadra, lot_number, area_m2, price, status) VALUES
  (dev_id,'C', 1,401.58,263436.48,'DISPONIVEL'),
  (dev_id,'C', 2,336.82,220953.92,'DISPONIVEL'),
  (dev_id,'C', 3,336.82,220953.92,'DISPONIVEL'),
  (dev_id,'C', 4,336.82,220953.92,'DISPONIVEL'),
  (dev_id,'C', 5,408.66,268080.96,'DISPONIVEL'),
  (dev_id,'C', 6,348.51,228622.56,'DISPONIVEL'),
  (dev_id,'C', 7,309.01,202710.56,'DISPONIVEL'),
  (dev_id,'C', 8,309.01,202710.56,'DISPONIVEL'),
  (dev_id,'C', 9,309.01,202710.56,'DISPONIVEL'),
  (dev_id,'C',10,309.01,202710.56,'DISPONIVEL'),
  (dev_id,'C',11,309.01,202710.56,'DISPONIVEL'),
  (dev_id,'C',12,308.28,202231.68,'DISPONIVEL'),
  (dev_id,'C',13,319.17,209375.52,'DISPONIVEL');

  -- ─── QUADRA D (25 lotes) ─────────────────────────────────────────────────
  INSERT INTO public.subdivision_lots (development_id, quadra, lot_number, area_m2, price, status) VALUES
  (dev_id,'D', 1,692.69,476570.72,'DISPONIVEL'),
  (dev_id,'D', 2,384.08,264247.04,'DISPONIVEL'),
  (dev_id,'D', 3,384.04,264219.52,'DISPONIVEL'),
  (dev_id,'D', 4,384.00,264192.00,'DISPONIVEL'),
  (dev_id,'D', 5,362.67,249516.96,'DISPONIVEL'),
  (dev_id,'D', 6,363.57,250136.16,'DISPONIVEL'),
  (dev_id,'D', 7,379.01,260758.88,'DISPONIVEL'),
  (dev_id,'D', 8,379.01,260758.88,'DISPONIVEL'),
  (dev_id,'D', 9,379.01,260758.88,'DISPONIVEL'),
  (dev_id,'D',10,379.01,260758.88,'DISPONIVEL'),
  (dev_id,'D',11,379.01,260758.88,'DISPONIVEL'),
  (dev_id,'D',12,379.01,260758.88,'DISPONIVEL'),
  (dev_id,'D',13,379.01,260758.88,'DISPONIVEL'),
  (dev_id,'D',14,439.10,302100.80,'DISPONIVEL'),
  (dev_id,'D',15,628.73,432566.24,'DISPONIVEL'),
  (dev_id,'D',16,358.95,246957.60,'DISPONIVEL'),
  (dev_id,'D',17,358.95,246957.60,'DISPONIVEL'),
  (dev_id,'D',18,358.95,246957.60,'DISPONIVEL'),
  (dev_id,'D',19,358.95,246957.60,'DISPONIVEL'),
  (dev_id,'D',20,358.95,246957.60,'DISPONIVEL'),
  (dev_id,'D',21,358.95,246957.60,'DISPONIVEL'),
  (dev_id,'D',22,385.44,265182.72,'DISPONIVEL'),
  (dev_id,'D',23,427.52,294133.76,'DISPONIVEL'),
  (dev_id,'D',24,427.51,294126.88,'DISPONIVEL'),
  (dev_id,'D',25,582.89,401028.32,'DISPONIVEL');

  -- ─── QUADRA E (38 lotes) ─────────────────────────────────────────────────
  INSERT INTO public.subdivision_lots (development_id, quadra, lot_number, area_m2, price, status) VALUES
  (dev_id,'E', 1,436.10,300036.80,'DISPONIVEL'),
  (dev_id,'E', 2,362.86,249647.68,'DISPONIVEL'),
  (dev_id,'E', 3,362.86,249647.68,'DISPONIVEL'),
  (dev_id,'E', 4,362.86,249647.68,'DISPONIVEL'),
  (dev_id,'E', 5,362.86,249647.68,'DISPONIVEL'),
  (dev_id,'E', 6,362.86,249647.68,'DISPONIVEL'),
  (dev_id,'E', 7,362.86,249647.68,'DISPONIVEL'),
  (dev_id,'E', 8,362.86,249647.68,'DISPONIVEL'),
  (dev_id,'E', 9,362.86,249647.68,'DISPONIVEL'),
  (dev_id,'E',10,362.86,249647.68,'DISPONIVEL'),
  (dev_id,'E',11,362.86,249647.68,'DISPONIVEL'),
  (dev_id,'E',12,362.86,249647.68,'DISPONIVEL'),
  (dev_id,'E',13,362.86,249647.68,'DISPONIVEL'),
  (dev_id,'E',14,362.86,249647.68,'DISPONIVEL'),
  (dev_id,'E',15,362.86,249647.68,'DISPONIVEL'),
  (dev_id,'E',16,362.86,249647.68,'DISPONIVEL'),
  (dev_id,'E',17,362.86,249647.68,'DISPONIVEL'),
  (dev_id,'E',18,449.89,309524.32,'DISPONIVEL'),
  (dev_id,'E',19,394.12,271154.56,'DISPONIVEL'),
  (dev_id,'E',20,356.21,245072.48,'DISPONIVEL'),
  (dev_id,'E',21,356.21,245072.48,'DISPONIVEL'),
  (dev_id,'E',22,356.21,245072.48,'DISPONIVEL'),
  (dev_id,'E',23,356.21,245072.48,'DISPONIVEL'),
  (dev_id,'E',24,356.21,245072.48,'DISPONIVEL'),
  (dev_id,'E',25,356.21,245072.48,'DISPONIVEL'),
  (dev_id,'E',26,356.21,245072.48,'DISPONIVEL'),
  (dev_id,'E',27,356.21,245072.48,'DISPONIVEL'),
  (dev_id,'E',28,356.21,245072.48,'DISPONIVEL'),
  (dev_id,'E',29,356.21,245072.48,'DISPONIVEL'),
  (dev_id,'E',30,356.21,245072.48,'DISPONIVEL'),
  (dev_id,'E',31,356.21,245072.48,'DISPONIVEL'),
  (dev_id,'E',32,356.21,245072.48,'DISPONIVEL'),
  (dev_id,'E',33,356.21,245072.48,'DISPONIVEL'),
  (dev_id,'E',34,356.21,245072.48,'DISPONIVEL'),
  (dev_id,'E',35,356.21,245072.48,'DISPONIVEL'),
  (dev_id,'E',36,356.21,245072.48,'DISPONIVEL'),
  (dev_id,'E',37,356.21,245072.48,'DISPONIVEL'),
  (dev_id,'E',38,406.07,279376.16,'DISPONIVEL');

  -- ─── QUADRA F (27 lotes) ─────────────────────────────────────────────────
  INSERT INTO public.subdivision_lots (development_id, quadra, lot_number, area_m2, price, status) VALUES
  (dev_id,'F', 1,386.58,265967.04,'DISPONIVEL'),
  (dev_id,'F', 2,343.69,236458.72,'DISPONIVEL'),
  (dev_id,'F', 3,343.96,236644.48,'DISPONIVEL'),
  (dev_id,'F', 4,343.96,236644.48,'DISPONIVEL'),
  (dev_id,'F', 5,343.96,236644.48,'DISPONIVEL'),
  (dev_id,'F', 6,343.96,236644.48,'DISPONIVEL'),
  (dev_id,'F', 7,343.96,236644.48,'DISPONIVEL'),
  (dev_id,'F', 8,343.96,236644.48,'DISPONIVEL'),
  (dev_id,'F', 9,343.96,236644.48,'DISPONIVEL'),
  (dev_id,'F',10,343.96,236644.48,'DISPONIVEL'),
  (dev_id,'F',11,343.96,236644.48,'DISPONIVEL'),
  (dev_id,'F',12,343.96,236644.48,'DISPONIVEL'),
  (dev_id,'F',13,343.96,236644.48,'DISPONIVEL'),
  (dev_id,'F',14,376.49,259025.12,'DISPONIVEL'),
  (dev_id,'F',15,375.28,258192.64,'DISPONIVEL'),
  (dev_id,'F',16,344.57,237064.16,'DISPONIVEL'),
  (dev_id,'F',17,344.57,237064.16,'DISPONIVEL'),
  (dev_id,'F',18,344.57,237064.16,'DISPONIVEL'),
  (dev_id,'F',19,344.57,237064.16,'DISPONIVEL'),
  (dev_id,'F',20,344.57,237064.16,'DISPONIVEL'),
  (dev_id,'F',21,344.57,237064.16,'DISPONIVEL'),
  (dev_id,'F',22,344.57,237064.16,'DISPONIVEL'),
  (dev_id,'F',23,344.57,237064.16,'DISPONIVEL'),
  (dev_id,'F',24,344.57,237064.16,'DISPONIVEL'),
  (dev_id,'F',25,344.57,237064.16,'DISPONIVEL'),
  (dev_id,'F',26,344.57,237064.16,'DISPONIVEL'),
  (dev_id,'F',27,363.62,250170.56,'DISPONIVEL');

  -- ─── QUADRA G (21 lotes) ─────────────────────────────────────────────────
  INSERT INTO public.subdivision_lots (development_id, quadra, lot_number, area_m2, price, status) VALUES
  (dev_id,'G', 1,383.90,264123.20,'DISPONIVEL'),
  (dev_id,'G', 2,419.31,288485.28,'DISPONIVEL'),
  (dev_id,'G', 3,347.55,239114.40,'DISPONIVEL'),
  (dev_id,'G', 4,347.55,239114.40,'DISPONIVEL'),
  (dev_id,'G', 5,347.55,239114.40,'DISPONIVEL'),
  (dev_id,'G', 6,347.55,239114.40,'DISPONIVEL'),
  (dev_id,'G', 7,347.55,239114.40,'DISPONIVEL'),
  (dev_id,'G', 8,347.55,239114.40,'DISPONIVEL'),
  (dev_id,'G', 9,347.55,239114.40,'DISPONIVEL'),
  (dev_id,'G',10,347.55,239114.40,'DISPONIVEL'),
  (dev_id,'G',11,433.76,298426.88,'DISPONIVEL'),
  (dev_id,'G',12,371.79,255791.52,'DISPONIVEL'),
  (dev_id,'G',13,359.89,247604.32,'DISPONIVEL'),
  (dev_id,'G',14,359.89,247604.32,'DISPONIVEL'),
  (dev_id,'G',15,359.89,247604.32,'DISPONIVEL'),
  (dev_id,'G',16,359.89,247604.32,'DISPONIVEL'),
  (dev_id,'G',17,359.89,247604.32,'DISPONIVEL'),
  (dev_id,'G',18,359.89,247604.32,'DISPONIVEL'),
  (dev_id,'G',19,359.89,247604.32,'DISPONIVEL'),
  (dev_id,'G',20,359.89,247604.32,'DISPONIVEL'),
  (dev_id,'G',21,359.89,247604.32,'DISPONIVEL');

  -- ─── QUADRA H (45 lotes) ─────────────────────────────────────────────────
  INSERT INTO public.subdivision_lots (development_id, quadra, lot_number, area_m2, price, status) VALUES
  (dev_id,'H', 1,401.69,295242.15,'DISPONIVEL'),
  (dev_id,'H', 2,382.87,281409.45,'DISPONIVEL'),
  (dev_id,'H', 3,368.16,270597.60,'DISPONIVEL'),
  (dev_id,'H', 4,403.83,296815.05,'DISPONIVEL'),
  (dev_id,'H', 5,417.10,306568.50,'DISPONIVEL'),
  (dev_id,'H', 6,394.10,289663.50,'DISPONIVEL'),
  (dev_id,'H', 7,402.70,295984.50,'DISPONIVEL'),
  (dev_id,'H', 8,354.45,260520.75,'DISPONIVEL'),
  (dev_id,'H', 9,344.35,253097.25,'DISPONIVEL'),
  (dev_id,'H',10,372.75,273971.25,'DISPONIVEL'),
  (dev_id,'H',11,429.49,315675.15,'DISPONIVEL'),
  (dev_id,'H',12,513.78,377628.30,'DISPONIVEL'),
  (dev_id,'H',13,552.00,405720.00,'DISPONIVEL'),
  (dev_id,'H',14,516.08,379318.80,'DISPONIVEL'),
  (dev_id,'H',15,516.07,379311.45,'DISPONIVEL'),
  (dev_id,'H',16,505.72,371704.20,'DISPONIVEL'),
  (dev_id,'H',17,548.59,403213.65,'DISPONIVEL'),
  (dev_id,'H',18,510.61,375298.35,'DISPONIVEL'),
  (dev_id,'H',19,419.61,308413.35,'DISPONIVEL'),
  (dev_id,'H',20,367.90,270406.50,'DISPONIVEL'),
  (dev_id,'H',21,319.30,234685.50,'DISPONIVEL'),
  (dev_id,'H',22,289.26,212606.10,'DISPONIVEL'),
  (dev_id,'H',23,347.94,255735.90,'DISPONIVEL'),
  (dev_id,'H',24,342.94,252060.90,'DISPONIVEL'),
  (dev_id,'H',25,347.39,255331.65,'DISPONIVEL'),
  (dev_id,'H',26,362.64,266540.40,'DISPONIVEL'),
  (dev_id,'H',27,372.18,273552.30,'DISPONIVEL'),
  (dev_id,'H',28,381.72,280564.20,'DISPONIVEL'),
  (dev_id,'H',29,391.13,287480.55,'DISPONIVEL'),
  (dev_id,'H',30,356.76,262218.60,'DISPONIVEL'),
  (dev_id,'H',31,506.25,372093.75,'DISPONIVEL'),
  (dev_id,'H',32,480.28,353005.80,'DISPONIVEL'),
  (dev_id,'H',33,501.90,368896.50,'DISPONIVEL'),
  (dev_id,'H',34,398.44,292853.40,'DISPONIVEL'),
  (dev_id,'H',35,373.81,274750.35,'DISPONIVEL'),
  (dev_id,'H',36,369.82,271817.70,'DISPONIVEL'),
  (dev_id,'H',37,368.38,270759.30,'DISPONIVEL'),
  (dev_id,'H',38,415.61,305473.35,'DISPONIVEL'),
  (dev_id,'H',39,426.20,313257.00,'DISPONIVEL'),
  (dev_id,'H',40,426.20,313257.00,'DISPONIVEL'),
  (dev_id,'H',41,426.20,313257.00,'DISPONIVEL'),
  (dev_id,'H',42,426.20,313257.00,'DISPONIVEL'),
  (dev_id,'H',43,426.20,313257.00,'DISPONIVEL'),
  (dev_id,'H',44,426.20,313257.00,'DISPONIVEL'),
  (dev_id,'H',45,584.96,429945.60,'DISPONIVEL');

  -- ─── QUADRA I (16 lotes) ─────────────────────────────────────────────────
  INSERT INTO public.subdivision_lots (development_id, quadra, lot_number, area_m2, price, status) VALUES
  (dev_id,'I', 1,380.88,262045.44,'DISPONIVEL'),
  (dev_id,'I', 2,352.77,242705.76,'DISPONIVEL'),
  (dev_id,'I', 3,352.77,242705.76,'DISPONIVEL'),
  (dev_id,'I', 4,352.77,242705.76,'DISPONIVEL'),
  (dev_id,'I', 5,352.77,242705.76,'DISPONIVEL'),
  (dev_id,'I', 6,352.77,242705.76,'DISPONIVEL'),
  (dev_id,'I', 7,352.77,242705.76,'DISPONIVEL'),
  (dev_id,'I', 8,352.77,242705.76,'DISPONIVEL'),
  (dev_id,'I', 9,352.77,242705.76,'DISPONIVEL'),
  (dev_id,'I',10,356.08,244983.04,'DISPONIVEL'),
  (dev_id,'I',11,530.34,364873.92,'DISPONIVEL'),
  (dev_id,'I',12,419.74,288781.12,'DISPONIVEL'),
  (dev_id,'I',13,419.74,288781.12,'DISPONIVEL'),
  (dev_id,'I',14,419.74,288781.12,'DISPONIVEL'),
  (dev_id,'I',15,419.74,288781.12,'DISPONIVEL'),
  (dev_id,'I',16,487.81,335613.28,'DISPONIVEL');

  -- ─── QUADRA J (24 lotes) ─────────────────────────────────────────────────
  INSERT INTO public.subdivision_lots (development_id, quadra, lot_number, area_m2, price, status) VALUES
  (dev_id,'J', 1,427.95,294429.60,'DISPONIVEL'),
  (dev_id,'J', 2,359.14,247088.32,'DISPONIVEL'),
  (dev_id,'J', 3,359.14,247088.32,'DISPONIVEL'),
  (dev_id,'J', 4,359.14,247088.32,'DISPONIVEL'),
  (dev_id,'J', 5,359.14,247088.32,'DISPONIVEL'),
  (dev_id,'J', 6,359.14,247088.32,'DISPONIVEL'),
  (dev_id,'J', 7,359.14,247088.32,'DISPONIVEL'),
  (dev_id,'J', 8,359.14,247088.32,'DISPONIVEL'),
  (dev_id,'J', 9,359.14,247088.32,'DISPONIVEL'),
  (dev_id,'J',10,359.14,247088.32,'DISPONIVEL'),
  (dev_id,'J',11,443.14,304880.32,'DISPONIVEL'),
  (dev_id,'J',12,367.16,252606.08,'DISPONIVEL'),
  (dev_id,'J',13,359.63,247425.44,'DISPONIVEL'),
  (dev_id,'J',14,359.63,247425.44,'DISPONIVEL'),
  (dev_id,'J',15,359.63,247425.44,'DISPONIVEL'),
  (dev_id,'J',16,359.63,247425.44,'DISPONIVEL'),
  (dev_id,'J',17,359.63,247425.44,'DISPONIVEL'),
  (dev_id,'J',18,359.63,247425.44,'DISPONIVEL'),
  (dev_id,'J',19,359.63,247425.44,'DISPONIVEL'),
  (dev_id,'J',20,359.63,247425.44,'DISPONIVEL'),
  (dev_id,'J',21,359.63,247425.44,'DISPONIVEL'),
  (dev_id,'J',22,359.63,247425.44,'DISPONIVEL'),
  (dev_id,'J',23,359.63,247425.44,'DISPONIVEL'),
  (dev_id,'J',24,378.79,260607.52,'DISPONIVEL');

  -- ─── QUADRA K (32 lotes) ─────────────────────────────────────────────────
  INSERT INTO public.subdivision_lots (development_id, quadra, lot_number, area_m2, price, status) VALUES
  (dev_id,'K', 1,420.25,289132.00,'DISPONIVEL'),
  (dev_id,'K', 2,364.32,250652.16,'DISPONIVEL'),
  (dev_id,'K', 3,364.32,250652.16,'DISPONIVEL'),
  (dev_id,'K', 4,364.32,250652.16,'DISPONIVEL'),
  (dev_id,'K', 5,364.32,250652.16,'DISPONIVEL'),
  (dev_id,'K', 6,364.32,250652.16,'DISPONIVEL'),
  (dev_id,'K', 7,364.32,250652.16,'DISPONIVEL'),
  (dev_id,'K', 8,364.34,250665.92,'DISPONIVEL'),
  (dev_id,'K', 9,364.32,250652.16,'DISPONIVEL'),
  (dev_id,'K',10,364.32,250652.16,'DISPONIVEL'),
  (dev_id,'K',11,364.32,250652.16,'DISPONIVEL'),
  (dev_id,'K',12,364.32,250652.16,'DISPONIVEL'),
  (dev_id,'K',13,364.32,250652.16,'DISPONIVEL'),
  (dev_id,'K',14,364.32,250652.16,'DISPONIVEL'),
  (dev_id,'K',15,431.30,296734.40,'DISPONIVEL'),
  (dev_id,'K',16,374.50,257656.00,'DISPONIVEL'),
  (dev_id,'K',17,361.89,248980.32,'DISPONIVEL'),
  (dev_id,'K',18,361.89,248980.32,'DISPONIVEL'),
  (dev_id,'K',19,361.89,248980.32,'DISPONIVEL'),
  (dev_id,'K',20,361.89,248980.32,'DISPONIVEL'),
  (dev_id,'K',21,361.89,248980.32,'DISPONIVEL'),
  (dev_id,'K',22,361.89,248980.32,'DISPONIVEL'),
  (dev_id,'K',23,361.89,248980.32,'DISPONIVEL'),
  (dev_id,'K',24,361.89,248980.32,'DISPONIVEL'),
  (dev_id,'K',25,361.89,248980.32,'DISPONIVEL'),
  (dev_id,'K',26,361.89,248980.32,'DISPONIVEL'),
  (dev_id,'K',27,361.89,248980.32,'DISPONIVEL'),
  (dev_id,'K',28,361.89,248980.32,'DISPONIVEL'),
  (dev_id,'K',29,361.89,248980.32,'DISPONIVEL'),
  (dev_id,'K',30,361.89,248980.32,'DISPONIVEL'),
  (dev_id,'K',31,361.89,248980.32,'DISPONIVEL'),
  (dev_id,'K',32,383.54,263875.52,'DISPONIVEL');

  -- ─── QUADRA L (24 lotes) ─────────────────────────────────────────────────
  INSERT INTO public.subdivision_lots (development_id, quadra, lot_number, area_m2, price, status) VALUES
  (dev_id,'L', 1,395.95,272413.60,'DISPONIVEL'),
  (dev_id,'L', 2,367.40,252771.20,'DISPONIVEL'),
  (dev_id,'L', 3,367.40,252771.20,'DISPONIVEL'),
  (dev_id,'L', 4,367.40,252771.20,'DISPONIVEL'),
  (dev_id,'L', 5,367.40,252771.20,'DISPONIVEL'),
  (dev_id,'L', 6,367.40,252771.20,'DISPONIVEL'),
  (dev_id,'L', 7,367.40,252771.20,'DISPONIVEL'),
  (dev_id,'L', 8,367.40,252771.20,'DISPONIVEL'),
  (dev_id,'L', 9,367.40,252771.20,'DISPONIVEL'),
  (dev_id,'L',10,367.40,252771.20,'DISPONIVEL'),
  (dev_id,'L',11,367.40,252771.20,'DISPONIVEL'),
  (dev_id,'L',12,367.40,252771.20,'DISPONIVEL'),
  (dev_id,'L',13,405.53,279004.64,'DISPONIVEL'),
  (dev_id,'L',14,438.93,301983.84,'DISPONIVEL'),
  (dev_id,'L',15,375.93,258639.84,'DISPONIVEL'),
  (dev_id,'L',16,375.93,258639.84,'DISPONIVEL'),
  (dev_id,'L',17,375.93,258639.84,'DISPONIVEL'),
  (dev_id,'L',18,375.93,258639.84,'DISPONIVEL'),
  (dev_id,'L',19,375.93,258639.84,'DISPONIVEL'),
  (dev_id,'L',20,375.93,258639.84,'DISPONIVEL'),
  (dev_id,'L',21,375.93,258639.84,'DISPONIVEL'),
  (dev_id,'L',22,375.93,258639.84,'DISPONIVEL'),
  (dev_id,'L',23,375.93,258639.84,'DISPONIVEL'),
  (dev_id,'L',24,451.37,310542.56,'DISPONIVEL');

  -- ─── QUADRA M (27 lotes) ─────────────────────────────────────────────────
  INSERT INTO public.subdivision_lots (development_id, quadra, lot_number, area_m2, price, status) VALUES
  (dev_id,'M', 1,417.82,287460.16,'DISPONIVEL'),
  (dev_id,'M', 2,359.76,247514.88,'DISPONIVEL'),
  (dev_id,'M', 3,359.76,247514.88,'DISPONIVEL'),
  (dev_id,'M', 4,359.76,247514.88,'DISPONIVEL'),
  (dev_id,'M', 5,359.76,247514.88,'DISPONIVEL'),
  (dev_id,'M', 6,359.76,247514.88,'DISPONIVEL'),
  (dev_id,'M', 7,359.76,247514.88,'DISPONIVEL'),
  (dev_id,'M', 8,359.76,247514.88,'DISPONIVEL'),
  (dev_id,'M', 9,359.76,247514.88,'DISPONIVEL'),
  (dev_id,'M',10,359.76,247514.88,'DISPONIVEL'),
  (dev_id,'M',11,359.76,247514.88,'DISPONIVEL'),
  (dev_id,'M',12,359.76,247514.88,'DISPONIVEL'),
  (dev_id,'M',13,411.64,283208.32,'DISPONIVEL'),
  (dev_id,'M',14,390.20,268457.60,'DISPONIVEL'),
  (dev_id,'M',15,367.25,252668.00,'DISPONIVEL'),
  (dev_id,'M',16,367.25,252668.00,'DISPONIVEL'),
  (dev_id,'M',17,367.25,252668.00,'DISPONIVEL'),
  (dev_id,'M',18,367.25,252668.00,'DISPONIVEL'),
  (dev_id,'M',19,367.25,252668.00,'DISPONIVEL'),
  (dev_id,'M',20,367.25,252668.00,'DISPONIVEL'),
  (dev_id,'M',21,367.25,252668.00,'DISPONIVEL'),
  (dev_id,'M',22,367.25,252668.00,'DISPONIVEL'),
  (dev_id,'M',23,367.25,252668.00,'DISPONIVEL'),
  (dev_id,'M',24,367.25,252668.00,'DISPONIVEL'),
  (dev_id,'M',25,367.25,252668.00,'DISPONIVEL'),
  (dev_id,'M',26,367.25,252668.00,'DISPONIVEL'),
  (dev_id,'M',27,384.95,264845.60,'DISPONIVEL');

  -- ─── QUADRA N (31 lotes – lote 9 = ANTENA 2, sem preço comercial) ────────
  INSERT INTO public.subdivision_lots (development_id, quadra, lot_number, area_m2, price, status, special_type) VALUES
  (dev_id,'N', 1,414.60,285244.80,'DISPONIVEL',NULL),
  (dev_id,'N', 2,375.72,258495.36,'DISPONIVEL',NULL),
  (dev_id,'N', 3,375.72,258495.36,'DISPONIVEL',NULL),
  (dev_id,'N', 4,375.72,258495.36,'DISPONIVEL',NULL),
  (dev_id,'N', 5,375.72,258495.36,'DISPONIVEL',NULL),
  (dev_id,'N', 6,375.72,258495.36,'DISPONIVEL',NULL),
  (dev_id,'N', 7,375.72,258495.36,'DISPONIVEL',NULL),
  (dev_id,'N', 8,375.72,258495.36,'DISPONIVEL',NULL),
  (dev_id,'N', 9,900.80,NULL,'PROPRIETARIO','ANTENA'),
  (dev_id,'N',10,353.08,242919.04,'DISPONIVEL',NULL),
  (dev_id,'N',11,353.08,242919.04,'DISPONIVEL',NULL),
  (dev_id,'N',12,353.08,242919.04,'DISPONIVEL',NULL),
  (dev_id,'N',13,353.08,242919.04,'DISPONIVEL',NULL),
  (dev_id,'N',14,409.53,281756.64,'DISPONIVEL',NULL),
  (dev_id,'N',15,391.74,269517.12,'DISPONIVEL',NULL),
  (dev_id,'N',16,358.90,246923.20,'DISPONIVEL',NULL),
  (dev_id,'N',17,358.90,246923.20,'DISPONIVEL',NULL),
  (dev_id,'N',18,358.90,246923.20,'DISPONIVEL',NULL),
  (dev_id,'N',19,358.90,246923.20,'DISPONIVEL',NULL),
  (dev_id,'N',20,358.90,246923.20,'DISPONIVEL',NULL),
  (dev_id,'N',21,358.90,246923.20,'DISPONIVEL',NULL),
  (dev_id,'N',22,358.90,246923.20,'DISPONIVEL',NULL),
  (dev_id,'N',23,358.90,246923.20,'DISPONIVEL',NULL),
  (dev_id,'N',24,358.90,246923.20,'DISPONIVEL',NULL),
  (dev_id,'N',25,358.90,246923.20,'DISPONIVEL',NULL),
  (dev_id,'N',26,358.90,246923.20,'DISPONIVEL',NULL),
  (dev_id,'N',27,358.90,246923.20,'DISPONIVEL',NULL),
  (dev_id,'N',28,358.90,246923.20,'DISPONIVEL',NULL),
  (dev_id,'N',29,358.90,246923.20,'DISPONIVEL',NULL),
  (dev_id,'N',30,358.90,246923.20,'DISPONIVEL',NULL),
  (dev_id,'N',31,387.32,266476.16,'DISPONIVEL',NULL);

  -- ─── QUADRA O (3 lotes) ──────────────────────────────────────────────────
  INSERT INTO public.subdivision_lots (development_id, quadra, lot_number, area_m2, price, status) VALUES
  (dev_id,'O',1,405.90,266270.40,'DISPONIVEL'),
  (dev_id,'O',2,360.13,236245.28,'DISPONIVEL'),
  (dev_id,'O',3,364.47,239092.32,'DISPONIVEL');

  -- ─── QUADRA P (13 lotes) ─────────────────────────────────────────────────
  INSERT INTO public.subdivision_lots (development_id, quadra, lot_number, area_m2, price, status) VALUES
  (dev_id,'P', 1,501.19,328780.64,'DISPONIVEL'),
  (dev_id,'P', 2,360.00,236160.00,'DISPONIVEL'),
  (dev_id,'P', 3,360.00,236160.00,'DISPONIVEL'),
  (dev_id,'P', 4,360.00,236160.00,'DISPONIVEL'),
  (dev_id,'P', 5,360.00,236160.00,'DISPONIVEL'),
  (dev_id,'P', 6,360.00,236160.00,'DISPONIVEL'),
  (dev_id,'P', 7,359.00,235504.00,'DISPONIVEL'),
  (dev_id,'P', 8,363.75,238620.00,'DISPONIVEL'),
  (dev_id,'P', 9,352.47,231220.32,'DISPONIVEL'),
  (dev_id,'P',10,368.74,241893.44,'DISPONIVEL'),
  (dev_id,'P',11,350.06,229639.36,'DISPONIVEL'),
  (dev_id,'P',12,338.40,221990.40,'DISPONIVEL'),
  (dev_id,'P',13,347.49,227953.44,'DISPONIVEL');

END $$;

-- Relatório de cobertura
DO $$
DECLARE
  dev_id UUID := 'ab7d1fc1-f069-4e3b-a515-8e1204c11247';
  total_lotes INT;
  lotes_com_preco INT;
  lotes_disponiveis INT;
  lotes_antena INT;
BEGIN
  SELECT COUNT(*) INTO total_lotes FROM subdivision_lots WHERE development_id = dev_id;
  SELECT COUNT(*) INTO lotes_com_preco FROM subdivision_lots WHERE development_id = dev_id AND price IS NOT NULL;
  SELECT COUNT(*) INTO lotes_disponiveis FROM subdivision_lots WHERE development_id = dev_id AND status = 'DISPONIVEL';
  SELECT COUNT(*) INTO lotes_antena FROM subdivision_lots WHERE development_id = dev_id AND special_type = 'ANTENA';

  RAISE NOTICE '=== ALTO BELLEVUE — Relatório de cobertura ===';
  RAISE NOTICE 'Total de lotes: %', total_lotes;
  RAISE NOTICE 'Lotes com preço: %', lotes_com_preco;
  RAISE NOTICE 'Lotes disponíveis: %', lotes_disponiveis;
  RAISE NOTICE 'Lotes ANTENA (sem preço comercial): %', lotes_antena;
  RAISE NOTICE 'Lotes sem preço (excl. ANTENA): %', (total_lotes - lotes_com_preco - lotes_antena);
END $$;
