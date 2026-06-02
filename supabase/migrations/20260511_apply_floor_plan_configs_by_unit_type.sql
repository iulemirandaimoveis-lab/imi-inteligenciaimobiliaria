-- Apply bedroom/bathroom counts based on unit type for Jazz Boulevard (Fusion units)
-- Studio: 1 quarto, 1 banheiro
-- Apartamento: 2 quartos, 2 banheiros

UPDATE development_units
SET bedrooms = 1, bathrooms = 1
WHERE development_id = '8be07eca-532a-4356-9365-b458822c8a3a'
  AND unit_type = 'Studio';

UPDATE development_units
SET bedrooms = 2, bathrooms = 2
WHERE development_id = '8be07eca-532a-4356-9365-b458822c8a3a'
  AND unit_type = 'Apartamento';
