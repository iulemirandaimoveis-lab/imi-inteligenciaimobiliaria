# IMI Migrations Map

> Generated: 2026-03-18
> Total files: 60 migration files
> Duplicate prefixes found: 12
> Naming conventions: 3 different schemes (NNN_, YYYYMMDD_, raw names)

---

## CRITICAL: Authoritative Migration

The file `20260317_production_unified_migration.sql` (78 KB) is the **definitive production migration**.
It creates 30+ tables with `CREATE TABLE IF NOT EXISTS` + `ADD COLUMN IF NOT EXISTS` patterns.
All earlier migrations are either superseded or supplementary.

---

## Duplicate Prefix Index

| Prefix | Files | Conflict Type |
|--------|-------|---------------|
| `001_` | `001_backoffice.sql`, `001_backoffice_schema.sql`, `001_fix_developers.sql` | 3-way: original, schema rewrite, fix |
| `002_` | `002_imoveis_hub.sql`, `002_backoffice_complete.sql`, `002_fix_developments_relations.sql`, `002_sample_data.sql` | 4-way |
| `003_` | `003_analytics_hub.sql`, `003_international_media.sql`, `003_fix_leads_extension.sql` | 3-way |
| `004_` | `004_multi_tenant_core.sql`, `004_storage_media.sql`, `004_fix_campaigns.sql` | 3-way |
| `005_` | `005_content_management.sql`, `005_fix_valuations.sql` | 2-way |
| `006_` | `006_ads_management.sql`, `006_fix_tracked_links.sql` | 2-way |
| `007_` | `007_leads_crm.sql`, `007_crm_prescriptive.sql` | 2-way |
| `008_` | `008_dashboard_stats.sql`, `008_social_publishing.sql` | 2-way |
| `060_` | `060_invest_engine.sql`, `060_add_broker_to_developments.sql` | 2-way |
| `061_` | `061_metas_okr_kpi.sql`, `061_add_update_notification_type.sql` | 2-way |
| `1_` / `2_` / `3_` | `1_FIX_TABLES.sql`, `2_FIX_STORAGE.sql`, `3_FIX_EXTRA_FEATURES.sql` | Legacy non-padded prefixes |
| (none) | `FIX_ALL_DEPENDENCIES_2026.sql`, `FIX_LEADS_AND_REPORTS.sql`, `FIX_RLS_RECURSION_FINAL.sql` | No prefix at all |

---

## Complete File List (alphabetical sort order used by Supabase CLI)

### Group A: `000_` prefix
| File | Size | Type | Notes |
|------|------|------|-------|
| `000_cleanup.sql` | 2.7 KB | CLEANUP | Drops/recreates base structures |

### Group B: `001_` prefix (DUPLICATE x3)
| File | Size | Type | Notes |
|------|------|------|-------|
| `001_backoffice.sql` | 5.8 KB | CREATE | Original: developments, units, leads, consultations, credit_requests, appraisal_requests |
| `001_backoffice_schema.sql` | 13 KB | CREATE | Full rewrite: developers, developments, leads, credit_applications, notifications, team_members, settings, campaigns, evaluations + ENUMs + RLS |
| `001_fix_developers.sql` | 1.9 KB | FIX | Fixes developers table only |

### Group C: `002_` prefix (DUPLICATE x4)
| File | Size | Type | Notes |
|------|------|------|-------|
| `002_imoveis_hub.sql` | 5.6 KB | CREATE | tracked_links, property_events |
| `002_backoffice_complete.sql` | 8.3 KB | CREATE | developers, pages, activity_logs + seed data |
| `002_fix_developments_relations.sql` | 2.4 KB | FIX | Fixes developments FK and relations |
| `002_sample_data.sql` | 6.1 KB | SEED | Sample/demo data inserts |

### Group D: `003_` prefix (DUPLICATE x3)
| File | Size | Type | Notes |
|------|------|------|-------|
| `003_analytics_hub.sql` | 2.6 KB | CREATE | ads_campaigns, executive_reports, lead_qualifications |
| `003_international_media.sql` | 3.3 KB | CREATE | International media structures |
| `003_fix_leads_extension.sql` | 3.5 KB | FIX | lead_interactions, extends leads columns |

### Group E: `004_` prefix (DUPLICATE x3)
| File | Size | Type | Notes |
|------|------|------|-------|
| `004_multi_tenant_core.sql` | 9.6 KB | CREATE | tenants, niche_playbooks, tenant_users, ai_requests + seed |
| `004_storage_media.sql` | 769 B | CREATE | Storage bucket setup |
| `004_fix_campaigns.sql` | 3.2 KB | FIX | campaigns table fix |

### Group F: `005_` prefix (DUPLICATE x2)
| File | Size | Type | Notes |
|------|------|------|-------|
| `005_content_management.sql` | 6.7 KB | CREATE | content_calendar, content_items, content_variants |
| `005_fix_valuations.sql` | 4.6 KB | FIX | property_valuations |

### Group G: `006_` prefix (DUPLICATE x2)
| File | Size | Type | Notes |
|------|------|------|-------|
| `006_ads_management.sql` | 12 KB | CREATE | ads_accounts, ads_campaigns, ads_metrics, ads_insights |
| `006_fix_tracked_links.sql` | 4.1 KB | FIX | tracked_links, tracked_link_clicks |

### Group H: `007_` prefix (DUPLICATE x2)
| File | Size | Type | Notes |
|------|------|------|-------|
| `007_leads_crm.sql` | 2.1 KB | CREATE | lead_interactions |
| `007_crm_prescriptive.sql` | 9.3 KB | CREATE | lead_interactions, lead_follow_ups, lead_scoring_history |

### Group I: `008_` prefix (DUPLICATE x2)
| File | Size | Type | Notes |
|------|------|------|-------|
| `008_dashboard_stats.sql` | 1.1 KB | CREATE | Dashboard stats views/functions |
| `008_social_publishing.sql` | 10.3 KB | CREATE | social_accounts, content_publications, publishing_queue |

### Group J: `009_` - `018_` (unique prefixes)
| File | Size | Type | Notes |
|------|------|------|-------|
| `009_playbooks_extended.sql` | 7.7 KB | CREATE | playbook_versions |
| `010_whatsapp_email.sql` | 10.2 KB | CREATE | whatsapp_conversations, whatsapp_messages, whatsapp_auto_responses, email_sequences, email_sequence_enrollments, email_logs |
| `011_ads_oauth_executor.sql` | 5 KB | CREATE | ads_actions, ads_sync_logs |
| `012_executive_reports.sql` | 4.2 KB | CREATE | executive_reports (yet another version) |
| `013_fix_multi_tenant_leads.sql` | 2.2 KB | FIX | Multi-tenant lead columns |
| `014_backoffice_phase2.sql` | 4.2 KB | CREATE | developers (again), content, consultations |
| `015_automations_core.sql` | 1.6 KB | CREATE | automation_workflows, automation_logs |
| `016_integrations_manager.sql` | 1.7 KB | CREATE | integrations |
| `017_appraisal_technical_suite.sql` | 1.4 KB | CREATE | appraisal_reports |
| `018_imoveis_completion.sql` | 3.6 KB | CREATE | property_units, tracked_links, property_events |

### Group K: `024_` - `027_` (gap from 019-023)
| File | Size | Type | Notes |
|------|------|------|-------|
| `024_contratos.sql` | 6.4 KB | CREATE | contratos table + integracoes_config |
| `026_avaliacoes_kb.sql` | 6.1 KB | CREATE | avaliacoes_kb_pages, avaliacoes_kb_topics |
| `027_push_subscriptions.sql` | 850 B | CREATE | push_subscriptions |

### Group L: `050_` - `052_` (batch fix round)
| File | Size | Type | Notes |
|------|------|------|-------|
| `050_create_all_missing_tables.sql` | 6.7 KB | CREATE | lead_qualifications, inbox_messages, lead_follow_ups, banking_connections, report_exports |
| `051_fix_tracking_tables.sql` | 5.4 KB | FIX | tracking_sessions, page_views fixes + qr_links, qr_scans |
| `052_fix_developers_responsavel.sql` | 1 KB | FIX | developers.responsavel column |

### Group M: `060_` - `062_` (DUPLICATES in 060, 061)
| File | Size | Type | Notes |
|------|------|------|-------|
| `060_invest_engine.sql` | 9.3 KB | CREATE | invest_leads, invest_simulations, invest_lead_events, invest_alerts, invest_indices_cache, invest_reports |
| `060_add_broker_to_developments.sql` | 296 B | ALTER | Adds broker_id to developments |
| `061_metas_okr_kpi.sql` | 10 KB | CREATE | okr_objectives, okr_key_results, okr_checkins, kpi_definitions, kpi_readings |
| `061_add_update_notification_type.sql` | 338 B | ALTER | Adds 'update' to notification_type enum |
| `062_import_apostila_ch1_4.sql` | 32 KB | SEED | Content import (apostila chapters 1-4) |

### Group N: `YYYYMMDD_` format
| File | Size | Type | Notes |
|------|------|------|-------|
| `20260212_create_developments_schema.sql` | 3.7 KB | CREATE | developments, units, developers (date-prefixed duplicate) |
| `20260213_create_consultations.sql` | 3.1 KB | CREATE | consultations |
| `20260213_create_link_events.sql` | 1.2 KB | CREATE | link_events |
| `20260213_create_notifications.sql` | 2.1 KB | CREATE | notifications |
| `20260213_create_property_evaluations.sql` | 2.3 KB | CREATE | property_evaluations |
| `20260213_create_tracked_links.sql` | 1.5 KB | CREATE | tracked_links |
| `20260220_add_location_to_developers.sql` | 254 B | ALTER | Adds lat/lng to developers |
| `20260301_fix_settings_fk.sql` | 2.7 KB | FIX | Settings FK fix + audit_log table |
| `20260317_production_unified_migration.sql` | 78 KB | **MASTER** | 30+ tables, the definitive migration |

### Group O: Legacy non-standard names
| File | Size | Type | Notes |
|------|------|------|-------|
| `1_FIX_TABLES.sql` | 2.8 KB | FIX | executive_reports, developments fixes |
| `2_FIX_STORAGE.sql` | 1.3 KB | FIX | Storage bucket policies |
| `3_FIX_EXTRA_FEATURES.sql` | 3.5 KB | FIX | ai_requests, ads_campaigns, ads_metrics, content_publications, niche_playbooks |

### Group P: Unprefixed FIX scripts
| File | Size | Type | Notes |
|------|------|------|-------|
| `FIX_ALL_DEPENDENCIES_2026.sql` | 10.7 KB | FIX | Recreates 9 core tables: developers, developments, leads, content, consultations, appraisal_requests, executive_reports, tracked_links, development_events |
| `FIX_LEADS_AND_REPORTS.sql` | 4 KB | FIX | Leads columns + executive_reports |
| `FIX_RLS_RECURSION_FINAL.sql` | 2.4 KB | FIX | Fixes infinite RLS recursion on leads/developments |

### Group Q: Safety-net scripts
| File | Size | Type | Notes |
|------|------|------|-------|
| `999_fix_backoffice_rls.sql` | 686 B | FIX | RLS policy repairs |
| `9999_ensure_backoffice_permissions.sql` | 1.5 KB | FIX | Ensures base permissions exist |

---

## Recommended Execution Order (for fresh database)

If applying from scratch, the recommended order is:

1. **`20260317_production_unified_migration.sql`** -- Master migration (covers 30+ tables)
2. **`050_create_all_missing_tables.sql`** -- lead_qualifications, inbox_messages, lead_follow_ups, banking_connections, report_exports
3. **`051_fix_tracking_tables.sql`** -- qr_links, qr_scans
4. **`026_avaliacoes_kb.sql`** -- avaliacoes_kb_pages, avaliacoes_kb_topics
5. **`027_push_subscriptions.sql`** -- push_subscriptions
6. **`060_invest_engine.sql`** -- invest_* tables
7. **`061_metas_okr_kpi.sql`** -- okr_*, kpi_* tables
8. **`060_add_broker_to_developments.sql`** -- ALTER for broker_id
9. **`061_add_update_notification_type.sql`** -- ALTER for enum
10. **`062_import_apostila_ch1_4.sql`** -- Seed data
11. **`9999_ensure_backoffice_permissions.sql`** -- Safety net

All other files (001-018, 024, FIX_*, 1_*, 2_*, 3_*, 999_*, 20260212-20260301) are **superseded** by the unified migration and should NOT be re-executed.

---

## Tables Most Frequently Re-created Across Migrations

| Table | Created In (# of files) |
|-------|------------------------|
| `developments` | 6 files (001_backoffice, 001_backoffice_schema, 1_FIX_TABLES, 20260212, FIX_ALL_DEPENDENCIES, 20260317_unified) |
| `developers` | 6 files (001_backoffice_schema, 001_fix_developers, 002_backoffice_complete, 014_backoffice_phase2, FIX_ALL_DEPENDENCIES, 20260317_unified) |
| `leads` | 4 files (001_backoffice, 001_backoffice_schema, FIX_ALL_DEPENDENCIES, 20260317_unified) |
| `tracked_links` | 4 files (002_imoveis_hub, 006_fix_tracked_links, 018_imoveis_completion, FIX_ALL_DEPENDENCIES) |
| `executive_reports` | 4 files (003_analytics_hub, 012_executive_reports, FIX_ALL_DEPENDENCIES, FIX_LEADS_AND_REPORTS) |
| `lead_interactions` | 3 files (003_fix_leads_extension, 007_leads_crm, 007_crm_prescriptive) |
| `ads_campaigns` | 3 files (003_analytics_hub, 006_ads_management, 3_FIX_EXTRA_FEATURES) |
| `notifications` | 3 files (001_backoffice_schema, 20260213_create_notifications, 20260317_unified) |
| `credit_applications` | 3 files (001_backoffice_schema, 20260317_unified, + 001_backoffice as credit_requests) |
| `consultations` | 3 files (001_backoffice, 014_backoffice_phase2, FIX_ALL_DEPENDENCIES) |

---

## Schema Reference

See `20260319_000_schema_snapshot.sql` for the definitive table definitions.
