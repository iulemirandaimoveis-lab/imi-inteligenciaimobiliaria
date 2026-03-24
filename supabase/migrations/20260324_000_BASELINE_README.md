# IMI Database Migrations — Baseline Guide

## For New Environments
Run ONLY: `20260317_production_unified_migration.sql` (contains full schema)
Then run any migrations dated AFTER 20260317 in chronological order.

## Migration History
All migrations before 20260317 are consolidated into the unified migration.
Files in _archive/ are kept for historical reference only.

## Naming Convention
Format: YYYYMMDD_NNN_description.sql
Example: 20260324_001_add_rental_analytics.sql
