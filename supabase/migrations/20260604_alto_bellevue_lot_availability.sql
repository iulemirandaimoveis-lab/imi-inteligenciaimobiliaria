-- Alto Bellevue – Atualização de disponibilidade de lotes
-- Fonte: Planilha Mi Gestão exportada em 04/06/2026
-- 384 lotes em 16 quadras (A–P)
-- DISPONIVEL: 195 | VENDIDO: 176 | NEGOCIACAO: 13

DO $$
DECLARE
  dev_id UUID := 'ab7d1fc1-f069-4e3b-a515-8e1204c11247';
BEGIN

  -- ─── VENDIDO (176 lotes) ─────────────────────────────────
  UPDATE public.subdivision_lots SET status = 'VENDIDO', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'A' AND lot_number IN (12, 13);
  UPDATE public.subdivision_lots SET status = 'VENDIDO', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'B' AND lot_number IN (1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14);
  UPDATE public.subdivision_lots SET status = 'VENDIDO', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'C' AND lot_number IN (6);
  UPDATE public.subdivision_lots SET status = 'VENDIDO', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'D' AND lot_number IN (1, 14, 18, 19);
  UPDATE public.subdivision_lots SET status = 'VENDIDO', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'E' AND lot_number IN (1, 2, 3, 4, 5, 6, 7, 15, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 38);
  UPDATE public.subdivision_lots SET status = 'VENDIDO', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'F' AND lot_number IN (1, 2, 3, 11, 12, 14, 15, 16, 17, 18, 20, 27);
  UPDATE public.subdivision_lots SET status = 'VENDIDO', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'G' AND lot_number IN (1, 11, 12, 21);
  UPDATE public.subdivision_lots SET status = 'VENDIDO', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'H' AND lot_number IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 27, 31, 32, 33, 34, 35, 36, 37, 38, 44, 45);
  UPDATE public.subdivision_lots SET status = 'VENDIDO', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'I' AND lot_number IN (1, 2, 8, 9, 10, 11, 12, 15, 16);
  UPDATE public.subdivision_lots SET status = 'VENDIDO', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'J' AND lot_number IN (1, 7, 9, 10, 11, 12, 13, 14, 15, 16, 24);
  UPDATE public.subdivision_lots SET status = 'VENDIDO', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'K' AND lot_number IN (1, 2, 7, 8, 10, 11, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 31, 32);
  UPDATE public.subdivision_lots SET status = 'VENDIDO', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'L' AND lot_number IN (1, 13, 14, 19, 20, 21, 23, 24);
  UPDATE public.subdivision_lots SET status = 'VENDIDO', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'M' AND lot_number IN (1, 2, 3, 4, 5, 6, 7, 8, 13, 14, 20, 21, 23, 24, 25, 26, 27);
  UPDATE public.subdivision_lots SET status = 'VENDIDO', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'N' AND lot_number IN (1, 2, 5, 6, 9, 11, 12, 14, 20, 21, 26, 27, 28, 29, 30, 31);

  -- ─── NEGOCIACAO (13 lotes) ─────────────────────────────────
  UPDATE public.subdivision_lots SET status = 'NEGOCIACAO', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'A' AND lot_number IN (1, 2, 3, 4);
  UPDATE public.subdivision_lots SET status = 'NEGOCIACAO', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'D' AND lot_number IN (15);
  UPDATE public.subdivision_lots SET status = 'NEGOCIACAO', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'H' AND lot_number IN (26);
  UPDATE public.subdivision_lots SET status = 'NEGOCIACAO', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'I' AND lot_number IN (13, 14);
  UPDATE public.subdivision_lots SET status = 'NEGOCIACAO', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'M' AND lot_number IN (9, 12, 15);
  UPDATE public.subdivision_lots SET status = 'NEGOCIACAO', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'N' AND lot_number IN (15);
  UPDATE public.subdivision_lots SET status = 'NEGOCIACAO', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'P' AND lot_number IN (13);

  -- ─── DISPONIVEL (195 lotes) ─────────────────────────────────
  UPDATE public.subdivision_lots SET status = 'DISPONIVEL', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'A' AND lot_number IN (5, 6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25);
  UPDATE public.subdivision_lots SET status = 'DISPONIVEL', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'B' AND lot_number IN (2, 3, 15, 16, 17, 18, 19);
  UPDATE public.subdivision_lots SET status = 'DISPONIVEL', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'C' AND lot_number IN (1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13);
  UPDATE public.subdivision_lots SET status = 'DISPONIVEL', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'D' AND lot_number IN (2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 16, 17, 20, 21, 22, 23, 24, 25);
  UPDATE public.subdivision_lots SET status = 'DISPONIVEL', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'E' AND lot_number IN (8, 9, 10, 11, 12, 13, 14, 16, 30, 31, 32, 33, 34, 35, 36, 37);
  UPDATE public.subdivision_lots SET status = 'DISPONIVEL', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'F' AND lot_number IN (4, 5, 6, 7, 8, 9, 10, 13, 19, 21, 22, 23, 24, 25, 26);
  UPDATE public.subdivision_lots SET status = 'DISPONIVEL', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'G' AND lot_number IN (2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 14, 15, 16, 17, 18, 19, 20);
  UPDATE public.subdivision_lots SET status = 'DISPONIVEL', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'H' AND lot_number IN (24, 25, 28, 29, 30, 39, 40, 41, 42, 43, 46);
  UPDATE public.subdivision_lots SET status = 'DISPONIVEL', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'I' AND lot_number IN (3, 4, 5, 6, 7);
  UPDATE public.subdivision_lots SET status = 'DISPONIVEL', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'J' AND lot_number IN (2, 3, 4, 5, 6, 8, 17, 18, 19, 20, 21, 22, 23);
  UPDATE public.subdivision_lots SET status = 'DISPONIVEL', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'K' AND lot_number IN (3, 4, 5, 6, 9, 12, 13, 30);
  UPDATE public.subdivision_lots SET status = 'DISPONIVEL', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'L' AND lot_number IN (2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16, 17, 18, 22);
  UPDATE public.subdivision_lots SET status = 'DISPONIVEL', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'M' AND lot_number IN (10, 11, 16, 17, 18, 19, 22);
  UPDATE public.subdivision_lots SET status = 'DISPONIVEL', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'N' AND lot_number IN (3, 4, 7, 8, 10, 13, 16, 17, 18, 19, 22, 23, 24, 25);
  UPDATE public.subdivision_lots SET status = 'DISPONIVEL', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'O' AND lot_number IN (1, 2, 3);
  UPDATE public.subdivision_lots SET status = 'DISPONIVEL', updated_at = NOW()
    WHERE development_id = dev_id AND quadra = 'P' AND lot_number IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);

END $$;