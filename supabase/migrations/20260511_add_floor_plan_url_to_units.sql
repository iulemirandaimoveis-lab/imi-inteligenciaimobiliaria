-- Add floor_plan_url to development_units so each unit can have its own floor plan image
alter table development_units
  add column if not exists floor_plan_url text;
