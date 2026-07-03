-- NOVA Restaurant Operations QR System
-- Run this in Supabase SQL editor, then enable Realtime for:
-- orders, order_items, staff_requests, tables.

create extension if not exists "pgcrypto";

create type order_status as enum ('new', 'preparing', 'ready', 'completed');
create type table_status as enum ('available', 'occupied', 'needs_bill', 'cleaning');
create type staff_request_type as enum ('bill', 'water', 'assistance');
create type staff_request_status as enum ('open', 'resolved');

create table public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  unique(user_id)
);

create table public.restaurant_settings (
  id uuid primary key default gen_random_uuid(),
  restaurant_name text not null default 'NOVA STEAKHOUSE',
  tagline text not null default 'Premium American Grill',
  description text,
  phone text,
  address text,
  brand_color text not null default '#FF6B2C',
  logo_url text,
  hero_image_url text,
  ordering_enabled boolean not null default true,
  closed_message text not null default 'Restaurant is currently closed. Ordering will reopen soon.',
  kitchen_pin text not null default '123456',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tables (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  table_number text not null unique,
  status table_status not null default 'available',
  qr_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.menu_categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  image_url text,
  is_active boolean not null default true,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  table_number text not null,
  status order_status not null default 'new',
  subtotal numeric(10,2) not null default 0,
  notes text,
  printed_at timestamptz,
  print_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  item_name text not null,
  unit_price numeric(10,2) not null,
  quantity integer not null check (quantity > 0),
  line_total numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create table public.staff_requests (
  id uuid primary key default gen_random_uuid(),
  table_number text not null,
  type staff_request_type not null,
  status staff_request_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.admin_users enable row level security;
alter table public.restaurant_settings enable row level security;
alter table public.tables enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.staff_requests enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid()
  );
$$;

create policy "Users can read their admin profile"
on public.admin_users for select
using (user_id = auth.uid());

create policy "Admins can manage admin users"
on public.admin_users for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read restaurant settings"
on public.restaurant_settings for select
using (true);

create policy "Admins manage restaurant settings"
on public.restaurant_settings for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read active tables"
on public.tables for select
using (is_active = true);

create policy "Kitchen can read active tables"
on public.tables for select
using (is_active = true);

create policy "Admins manage tables"
on public.tables for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read active categories"
on public.menu_categories for select
using (is_active = true);

create policy "Admins manage categories"
on public.menu_categories for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read available menu items"
on public.menu_items for select
using (is_active = true and is_available = true);

create policy "Admins manage menu items"
on public.menu_items for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can create orders"
on public.orders for insert
with check (
  exists (
    select 1 from public.restaurant_settings
    where ordering_enabled = true
  )
);

create policy "Kitchen can read orders"
on public.orders for select
using (true);

create policy "Admins can read and update orders"
on public.orders for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can create order items"
on public.order_items for insert
with check (true);

create policy "Admins can read order items"
on public.order_items for select
using (public.is_admin());

create policy "Kitchen can read order items"
on public.order_items for select
using (true);

create policy "Public can create staff requests"
on public.staff_requests for insert
with check (
  exists (
    select 1 from public.restaurant_settings
    where ordering_enabled = true
  )
);

create policy "Kitchen can read staff requests"
on public.staff_requests for select
using (true);

create policy "Admins can manage staff requests"
on public.staff_requests for all
using (public.is_admin())
with check (public.is_admin());

insert into public.restaurant_settings (
  restaurant_name,
  tagline,
  description,
  phone,
  address,
  hero_image_url
) values (
  'NOVA STEAKHOUSE',
  'Premium American Grill',
  'Premium QR ordering and restaurant operations demo.',
  '(212) 555-0198',
  '184 Madison Avenue, New York, NY',
  'https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=1800&q=85'
);

insert into public.tables (label, table_number, qr_url)
select 'Table ' || n, n::text, '/menu?table=' || n
from generate_series(1, 12) as n;

insert into public.menu_categories (name, slug, description, sort_order) values
  ('Steaks', 'steaks', 'Prime cuts finished over open flame.', 1),
  ('Signatures', 'signatures', 'House favorites built for tables that share.', 2),
  ('Sides', 'sides', 'Crisp, rich, and made for the center of the table.', 3),
  ('Cocktails', 'cocktails', 'Balanced pours with smoke, citrus, and spice.', 4);

insert into public.menu_items (
  category_id,
  name,
  description,
  price,
  image_url,
  is_available,
  is_featured,
  sort_order
) values
  (
    (select id from public.menu_categories where slug = 'steaks'),
    'Wagyu Ribeye',
    '12oz American wagyu, ember butter, smoked sea salt.',
    68,
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=85',
    true,
    true,
    1
  ),
  (
    (select id from public.menu_categories where slug = 'steaks'),
    'Filet Mignon',
    'Center cut filet, black garlic jus, potato pave.',
    54,
    'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=900&q=85',
    true,
    false,
    2
  ),
  (
    (select id from public.menu_categories where slug = 'signatures'),
    'Lobster Pasta',
    'Maine lobster, Calabrian chili, saffron cream.',
    42,
    'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=900&q=85',
    true,
    true,
    3
  ),
  (
    (select id from public.menu_categories where slug = 'signatures'),
    'Signature Burger',
    'Dry-aged blend, smoked cheddar, onion jam, brioche.',
    26,
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85',
    true,
    false,
    4
  ),
  (
    (select id from public.menu_categories where slug = 'sides'),
    'Truffle Fries',
    'Parmesan, black truffle, chive aioli.',
    15,
    'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=900&q=85',
    true,
    true,
    5
  ),
  (
    (select id from public.menu_categories where slug = 'sides'),
    'Charred Broccolini',
    'Lemon, chili crunch, toasted almond.',
    14,
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85',
    false,
    false,
    6
  ),
  (
    (select id from public.menu_categories where slug = 'cocktails'),
    'Smoked Old Fashioned',
    'Bourbon, demerara, bitters, orange smoke.',
    18,
    'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=900&q=85',
    true,
    true,
    7
  ),
  (
    (select id from public.menu_categories where slug = 'cocktails'),
    'Ember Spritz',
    'Aperol, blood orange, prosecco, rosemary.',
    16,
    'https://images.unsplash.com/photo-1563223771-375783ee91ad?auto=format&fit=crop&w=900&q=85',
    true,
    false,
    8
  );

-- Create storage buckets in Supabase dashboard:
-- food-images: public read, authenticated admin write
-- branding-assets: public read, authenticated admin write

-- Kitchen PIN note:
-- Kitchen reads are exposed through anon SELECT policies so Supabase Realtime can deliver updates.
-- Kitchen writes must go through server actions that verify restaurant_settings.kitchen_pin
-- and use the server-only service role key. Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
