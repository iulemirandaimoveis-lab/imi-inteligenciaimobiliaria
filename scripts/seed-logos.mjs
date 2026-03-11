/**
 * seed-logos.mjs
 *
 * Uploads developer logo files from public/images/logos/ to Supabase Storage
 * bucket 'media' at path 'developers/{slug}.{ext}', then updates the
 * developers.logo_url column with the public Storage URL.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (or env).
 * Usage: node scripts/seed-logos.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Load .env.local manually (dotenv not required) ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.join(projectRoot, '.env.local');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL not set in .env.local');
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY not found in .env.local.');
  console.warn('Upload to Storage requires the service role key.');
  console.warn('Falling back to anon key — storage upload may fail if RLS is enabled.');
  console.warn('Add SUPABASE_SERVICE_ROLE_KEY=<key> to .env.local and re-run.\n');
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY || ANON_KEY);

// --- Configuration ---
const BUCKET = 'media';
const STORAGE_FOLDER = 'developers';
const LOGOS_DIR = path.join(projectRoot, 'public', 'images', 'logos');

// Mapping: logo filename (without ext, lowercase) → developer slug
// Key is the normalized filename stem; value is the DB slug
const FILENAME_TO_SLUG = {
  'alliance':    'alliance',
  'cyrela':      'cyrela',
  'damac':       'damac',
  'kempinski':   'kempinski-hotels',
  'mouradubeux': 'moura-dubeux',
  'rioave':      'rio-ave',
  'setai':       'setai-grupo-gp',
};

async function run() {
  console.log('=== IMI — Seed Construtoras Logos ===\n');
  console.log(`Supabase URL : ${SUPABASE_URL}`);
  console.log(`Bucket       : ${BUCKET}/${STORAGE_FOLDER}`);
  console.log(`Logos dir    : ${LOGOS_DIR}\n`);

  // 1. List logo files in public/images/logos/
  if (!fs.existsSync(LOGOS_DIR)) {
    console.error(`ERROR: Logos directory not found: ${LOGOS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(LOGOS_DIR).filter(f => /\.(png|jpg|jpeg|svg|webp)$/i.test(f));
  console.log(`Found ${files.length} logo file(s): ${files.join(', ')}\n`);

  // 2. Fetch all developers from DB
  const { data: developers, error: fetchError } = await supabase
    .from('developers')
    .select('id, name, slug, logo_url');

  if (fetchError) {
    console.error('ERROR: Failed to fetch developers:', fetchError.message);
    process.exit(1);
  }

  console.log(`Found ${developers.length} developer(s) in DB:\n`);
  for (const d of developers) {
    console.log(`  - [${d.slug}] ${d.name} → logo_url: ${d.logo_url || '(null)'}`);
  }
  console.log('');

  // 3. Process each logo file
  const results = { uploaded: [], skipped: [], errors: [], noMatch: [] };

  for (const filename of files) {
    const ext = path.extname(filename).toLowerCase();
    const stem = path.basename(filename, path.extname(filename)).toLowerCase();
    const storagePath = `${STORAGE_FOLDER}/${stem}${ext}`;

    // Match file to developer
    const slug = FILENAME_TO_SLUG[stem];
    if (!slug) {
      console.warn(`SKIP: No slug mapping for file "${filename}" (stem="${stem}")`);
      results.noMatch.push(filename);
      continue;
    }

    const developer = developers.find(d => d.slug === slug);
    if (!developer) {
      console.warn(`SKIP: Developer with slug "${slug}" not found in DB`);
      results.noMatch.push(filename);
      continue;
    }

    console.log(`Processing: ${filename} → developer "${developer.name}" (${slug})`);

    // Read file
    const filePath = path.join(LOGOS_DIR, filename);
    const fileBuffer = fs.readFileSync(filePath);
    const mimeType = ext === '.svg' ? 'image/svg+xml'
                   : ext === '.png' ? 'image/png'
                   : ext === '.webp' ? 'image/webp'
                   : 'image/jpeg';

    // Upload to Supabase Storage (upsert to allow re-runs)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error(`  ERROR uploading ${filename}: ${uploadError.message}`);
      results.errors.push({ filename, error: uploadError.message });
      continue;
    }

    console.log(`  Uploaded to storage: ${storagePath}`);

    // Build public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
    console.log(`  Public URL: ${publicUrl}`);

    // Update developer logo_url in DB
    const { error: updateError } = await supabase
      .from('developers')
      .update({ logo_url: publicUrl })
      .eq('id', developer.id);

    if (updateError) {
      console.error(`  ERROR updating DB for "${developer.name}": ${updateError.message}`);
      results.errors.push({ filename, error: updateError.message });
      continue;
    }

    console.log(`  DB updated: developers.logo_url = "${publicUrl}"`);
    results.uploaded.push({ filename, developer: developer.name, url: publicUrl });
  }

  // 4. Report developers with no logo file available
  const nullLogoDevelopers = developers.filter(d => {
    // After updates, check which still have null or local path logo_url
    const isLocal = d.logo_url && d.logo_url.startsWith('/');
    return !d.logo_url || isLocal;
  });

  // 5. Summary
  console.log('\n=== SUMMARY ===');
  console.log(`  Uploaded & DB updated : ${results.uploaded.length}`);
  if (results.uploaded.length > 0) {
    for (const r of results.uploaded) {
      console.log(`    - ${r.developer}: ${r.url}`);
    }
  }
  console.log(`  Skipped (no mapping)  : ${results.skipped.length + results.noMatch.length}`);
  if (results.noMatch.length > 0) {
    console.log(`    Files: ${results.noMatch.join(', ')}`);
  }
  console.log(`  Errors                : ${results.errors.length}`);
  if (results.errors.length > 0) {
    for (const e of results.errors) {
      console.log(`    - ${e.filename}: ${e.error}`);
    }
  }

  // Show developers that still have no Supabase Storage logo
  const slugsHandled = results.uploaded.map(r => {
    const entry = Object.entries(FILENAME_TO_SLUG).find(([, s]) => {
      return results.uploaded.some(u => u.developer === developers.find(d => d.slug === s)?.name);
    });
    return entry ? entry[1] : null;
  }).filter(Boolean);

  const devsMissingLogos = developers.filter(d => {
    const wasUploaded = results.uploaded.some(r => r.developer === d.name);
    return !wasUploaded && !d.logo_url?.startsWith('http');
  });

  if (devsMissingLogos.length > 0) {
    console.log('\nDevelopers with no Supabase Storage logo (no file available):');
    for (const d of devsMissingLogos) {
      console.log(`  - [${d.slug}] ${d.name} (logo_url: ${d.logo_url || 'null'})`);
    }
    console.log('  → Add logo files for these developers and re-run this script.');
  }

  console.log('\nDone.');
}

run().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
