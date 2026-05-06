-- Calculadora de Casetas Prefabricadas - Fase 5
-- Precio único sin IVA + plano técnico 2D con rotación.
-- Ejecuta este SQL en Supabase > SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  province text not null,
  city text not null,
  postal_code text,
  intended_use text,
  comments text,
  status text not null default 'Nuevo' check (status in ('Nuevo','Contactado','Presupuesto enviado','Negociando','Vendido','Perdido')),
  estimated_min_price numeric not null default 0,
  estimated_max_price numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads add column if not exists estimated_price_without_vat numeric not null default 0;
alter table public.leads add column if not exists estimated_vat_amount numeric not null default 0;
alter table public.leads add column if not exists estimated_price_with_vat numeric not null default 0;

create table if not exists public.configurations (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  length numeric not null,
  width numeric not null,
  square_meters numeric not null,
  panel_thickness text not null,
  use_type text not null,
  door_type text not null default 'Sin puertas extra',
  door_quantity integer not null default 0,
  window_quantity integer not null default 0,
  extras text[] not null default '{}',
  transport_required boolean not null default false,
  assembly_required boolean not null default false,
  delivery_timeline text not null,
  created_at timestamptz not null default now()
);

alter table public.configurations add column if not exists is_special_measure boolean not null default false;
alter table public.configurations add column if not exists panel_type text default 'Panel sándwich';
alter table public.configurations add column if not exists panel_color text default 'Blanco';
alter table public.configurations add column if not exists is_special_panel boolean not null default false;
alter table public.configurations add column if not exists base_included_door boolean not null default true;
alter table public.configurations add column if not exists base_included_window_80x80 boolean not null default true;
alter table public.configurations add column if not exists base_included_electrical_installation boolean not null default true;
alter table public.configurations add column if not exists base_included_socket_quantity integer not null default 1;
alter table public.configurations add column if not exists base_included_light_point_quantity integer not null default 1;
alter table public.configurations add column if not exists has_air_conditioning boolean not null default false;
alter table public.configurations add column if not exists has_electrical_installation boolean not null default true;
alter table public.configurations add column if not exists has_full_bathroom boolean not null default false;
alter table public.configurations add column if not exists interior_rooms_quantity integer not null default 0;
alter table public.configurations add column if not exists extra_windows_80x80_quantity integer not null default 0;
alter table public.configurations add column if not exists extra_large_windows_quantity integer not null default 0;
alter table public.configurations add column if not exists additional_doors_quantity integer not null default 0;
alter table public.configurations add column if not exists additional_socket_quantity integer not null default 0;
alter table public.configurations add column if not exists layout_json jsonb not null default '[]'::jsonb;

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  quote_number text not null unique,
  quote_date date not null default current_date,
  base_price numeric not null default 0,
  iva_percentage numeric not null default 21,
  iva_amount numeric not null default 0,
  total_price numeric not null default 0,
  pdf_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_leads_created_at on public.leads(created_at desc);
create index if not exists idx_configurations_lead_id on public.configurations(lead_id);
create index if not exists idx_notes_lead_id on public.notes(lead_id);
create index if not exists idx_quotes_lead_id on public.quotes(lead_id);
create index if not exists idx_quotes_created_at on public.quotes(created_at desc);

alter table public.users enable row level security;
alter table public.leads enable row level security;
alter table public.configurations enable row level security;
alter table public.notes enable row level security;
alter table public.quotes enable row level security;

drop policy if exists "authenticated_can_read_users" on public.users;
drop policy if exists "public_can_insert_leads" on public.leads;
drop policy if exists "public_can_insert_configurations" on public.configurations;
drop policy if exists "authenticated_can_read_leads" on public.leads;
drop policy if exists "authenticated_can_update_leads" on public.leads;
drop policy if exists "authenticated_can_delete_leads" on public.leads;
drop policy if exists "authenticated_can_read_configurations" on public.configurations;
drop policy if exists "authenticated_can_read_notes" on public.notes;
drop policy if exists "authenticated_can_insert_notes" on public.notes;
drop policy if exists "authenticated_can_delete_notes" on public.notes;
drop policy if exists "authenticated_can_read_quotes" on public.quotes;
drop policy if exists "authenticated_can_insert_quotes" on public.quotes;
drop policy if exists "authenticated_can_delete_quotes" on public.quotes;

create policy "authenticated_can_read_users" on public.users for select to authenticated using (auth.uid() = id);
create policy "public_can_insert_leads" on public.leads for insert to anon with check (true);
create policy "public_can_insert_configurations" on public.configurations for insert to anon with check (true);
create policy "authenticated_can_read_leads" on public.leads for select to authenticated using (true);
create policy "authenticated_can_update_leads" on public.leads for update to authenticated using (true) with check (true);
create policy "authenticated_can_delete_leads" on public.leads for delete to authenticated using (true);
create policy "authenticated_can_read_configurations" on public.configurations for select to authenticated using (true);
create policy "authenticated_can_read_notes" on public.notes for select to authenticated using (true);
create policy "authenticated_can_insert_notes" on public.notes for insert to authenticated with check (true);
create policy "authenticated_can_delete_notes" on public.notes for delete to authenticated using (true);
create policy "authenticated_can_read_quotes" on public.quotes for select to authenticated using (true);
create policy "authenticated_can_insert_quotes" on public.quotes for insert to authenticated with check (true);
create policy "authenticated_can_delete_quotes" on public.quotes for delete to authenticated using (true);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at before update on public.leads for each row execute function public.set_updated_at();

-- Fase 8: captación antes de descargar plano + presupuesto
alter table public.leads add column if not exists newsletter_subscribed boolean not null default false;
alter table public.leads add column if not exists privacy_accepted boolean not null default false;
alter table public.leads add column if not exists download_requested boolean not null default false;
alter table public.leads add column if not exists downloaded_at timestamptz;
alter table public.leads add column if not exists lead_source text default 'configurador_plano_2d';

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  province text,
  city text,
  subscribed_at timestamptz not null default now(),
  source text not null default 'configurador_plano_2d',
  active boolean not null default true
);

create index if not exists idx_newsletter_subscribers_email on public.newsletter_subscribers(email);
create index if not exists idx_newsletter_subscribers_subscribed_at on public.newsletter_subscribers(subscribed_at desc);

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "public_can_insert_newsletter_subscribers" on public.newsletter_subscribers;
drop policy if exists "authenticated_can_read_newsletter_subscribers" on public.newsletter_subscribers;
drop policy if exists "authenticated_can_update_newsletter_subscribers" on public.newsletter_subscribers;
drop policy if exists "authenticated_can_delete_newsletter_subscribers" on public.newsletter_subscribers;

create policy "public_can_insert_newsletter_subscribers"
  on public.newsletter_subscribers for insert
  to anon
  with check (true);

create policy "authenticated_can_read_newsletter_subscribers"
  on public.newsletter_subscribers for select
  to authenticated
  using (true);

create policy "authenticated_can_update_newsletter_subscribers"
  on public.newsletter_subscribers for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_can_delete_newsletter_subscribers"
  on public.newsletter_subscribers for delete
  to authenticated
  using (true);
