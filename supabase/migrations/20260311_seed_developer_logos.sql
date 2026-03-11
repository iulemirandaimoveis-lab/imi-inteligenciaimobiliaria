-- Seed developer logos with local paths from public/images/logos/
-- These will work as relative URLs until logos are uploaded to Supabase Storage
-- To migrate to Storage: upload each file and update with the Supabase Storage URL

UPDATE developers
SET logo_url = '/images/logos/cyrela.png'
WHERE (logo_url IS NULL OR logo_url = '')
  AND LOWER(name) LIKE '%cyrela%';

UPDATE developers
SET logo_url = '/images/logos/mouradubeux.png'
WHERE (logo_url IS NULL OR logo_url = '')
  AND LOWER(name) LIKE '%moura dubeux%' OR LOWER(name) LIKE '%mouradubeux%';

UPDATE developers
SET logo_url = '/images/logos/rioave.png'
WHERE (logo_url IS NULL OR logo_url = '')
  AND LOWER(name) LIKE '%rio ave%' OR LOWER(name) LIKE '%rioave%';

UPDATE developers
SET logo_url = '/images/logos/alliance.png'
WHERE (logo_url IS NULL OR logo_url = '')
  AND LOWER(name) LIKE '%alliance%';

UPDATE developers
SET logo_url = '/images/logos/setai.png'
WHERE (logo_url IS NULL OR logo_url = '')
  AND LOWER(name) LIKE '%setai%';

UPDATE developers
SET logo_url = '/images/logos/damac.png'
WHERE (logo_url IS NULL OR logo_url = '')
  AND LOWER(name) LIKE '%damac%';

UPDATE developers
SET logo_url = '/images/logos/Kempinski.png'
WHERE (logo_url IS NULL OR logo_url = '')
  AND LOWER(name) LIKE '%kempinski%';
