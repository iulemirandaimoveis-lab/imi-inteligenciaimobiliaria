-- IMI CADAM — generation audit log
-- Tracks every CAD generation request for rate-limit, audit, and debugging.
-- Commercial data (price, lead, client) is explicitly excluded from this table.

create table if not exists public.cadam_generation_logs (
  id                uuid        default gen_random_uuid() primary key,
  generation_id     text        not null,
  requested_by      uuid        not null references auth.users(id) on delete set null,
  project_type      text        not null check (project_type in ('subdivision','building','floorplan','unit','amenity')),
  prompt_length     integer     not null check (prompt_length > 0 and prompt_length <= 2000),
  template_id       text,
  development_id    uuid,
  status            text        not null check (status in ('started','completed','failed')),
  warnings          text[]      default '{}',
  error_message     text,
  created_at        timestamptz default now() not null
);

-- Index for per-user rate limiting queries
create index if not exists cadam_logs_user_created
  on public.cadam_generation_logs (requested_by, created_at desc);

-- Index for per-development history
create index if not exists cadam_logs_development
  on public.cadam_generation_logs (development_id)
  where development_id is not null;

-- RLS: only admin roles can read logs; users cannot read their own raw log data
alter table public.cadam_generation_logs enable row level security;

create policy "admins_read_cadam_logs"
  on public.cadam_generation_logs
  for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin', 'developer_admin')
    )
  );

-- Service role (API routes) can insert
create policy "service_insert_cadam_logs"
  on public.cadam_generation_logs
  for insert
  with check (true);

comment on table public.cadam_generation_logs is
  'Audit log for IMI CADAM generation jobs. No commercial data stored here.';
