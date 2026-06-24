-- =====================================================================
-- SQL SCHEMA FOR PASAR UMKM TEGALSARI
-- Copy-paste this script into the 'SQL Editor' in your Supabase Dashboard
-- =====================================================================

-- 1. Enable UUID Extension (standard)
create extension if not exists "uuid-ossp";

-- 2. Create PROFILES table
create table if not exists public.profiles (
    id text primary key,
    email text unique not null,
    role text not null check (role in ('buyer', 'vendor', 'admin')),
    name text not null,
    phone text not null,
    address text not null,
    kecamatan text not null,
    village text not null,
    latitude double precision,
    longitude double precision,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create VENDORS table
create table if not exists public.vendors (
    id text primary key references public.profiles(id) on delete cascade,
    business_name text not null,
    logo_url text,
    banner_url text,
    ktp_url text,
    description text,
    address text not null,
    kecamatan text not null,
    village text not null,
    phone text not null,
    bank_name text not null,
    bank_account_number text not null,
    bank_account_name text not null,
    status text not null check (status in ('pending', 'approved', 'rejected')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create PRODUCTS table
create table if not exists public.products (
    id text primary key,
    vendor_id text not null references public.profiles(id) on delete cascade,
    name text not null,
    image_url text,
    brand text,
    variants text[] default '{}'::text[],
    price double precision not null,
    discount_price double precision,
    weight integer not null, -- in grams
    description text,
    pirt text,
    pkrt text,
    bpom text,
    category text not null,
    stock integer default 0 not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Create COURIERS table
create table if not exists public.couriers (
    id text primary key,
    vendor_id text not null references public.profiles(id) on delete cascade,
    name text not null,
    phone text not null,
    vehicle_type text not null check (vehicle_type in ('Motor', 'Mobil', 'Tricycle')),
    price_per_km double precision not null,
    base_fare double precision not null,
    status text not null check (status in ('active', 'inactive')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Create AFFILIATE_RELATIONS table
create table if not exists public.affiliate_relations (
    id text primary key,
    affiliator_vendor_id text not null references public.profiles(id) on delete cascade,
    owner_vendor_id text not null references public.profiles(id) on delete cascade,
    status text not null check (status in ('pending', 'approved', 'rejected')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Create COMMISSION_SETTINGS table
create table if not exists public.commission_settings (
    id text primary key,
    vendor_id text not null references public.profiles(id) on delete cascade,
    product_id text references public.products(id) on delete cascade,
    commission_percentage double precision not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Create ORDERS table
create table if not exists public.orders (
    id text primary key,
    buyer_id text not null references public.profiles(id) on delete cascade,
    buyer_name text not null,
    buyer_phone text not null,
    vendor_id text not null references public.profiles(id) on delete cascade,
    vendor_name text not null,
    vendor_phone text not null,
    courier_id text references public.couriers(id) on delete set null,
    courier_name text,
    courier_phone text,
    items jsonb not null,
    total_amount double precision not null,
    shipping_fee double precision not null,
    distance_km double precision not null,
    status text not null check (status in ('pending', 'processing', 'shipped', 'completed', 'cancelled')),
    payment_method text not null check (payment_method = 'COD'),
    shipping_address text not null,
    shipping_latitude double precision not null,
    shipping_longitude double precision not null,
    awb_number text, -- BinderByte AWB
    courier_code text, -- Courier service code (e.g., jne, jnt, sicepat)
    affiliator_vendor_id text references public.profiles(id) on delete set null,
    commission_amount double precision default 0 not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Create APP_SETTINGS table
create table if not exists public.app_settings (
    id text primary key,
    app_name text not null,
    logo_url text,
    banner_url text,
    contact_phone text,
    website_mode text not null check (website_mode in ('active', 'maintenance')),
    announcement text,
    about_us text,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================================
-- 10. ENABLE ROW LEVEL SECURITY (RLS) & ACCESS RULES
-- For simplicity & smooth integration, we enable public access (Read/Write)
-- on these tables. In a highly secure app, you can restrict it by user_id.
-- =====================================================================

alter table public.profiles enable row level security;
alter table public.vendors enable row level security;
alter table public.products enable row level security;
alter table public.couriers enable row level security;
alter table public.affiliate_relations enable row level security;
alter table public.commission_settings enable row level security;
alter table public.orders enable row level security;
alter table public.app_settings enable row level security;

-- Create direct permissive policies for instant out-of-the-box working
drop policy if exists "Allow public read-write on profiles" on public.profiles;
create policy "Allow public read-write on profiles" on public.profiles for all using (true) with check (true);

drop policy if exists "Allow public read-write on vendors" on public.vendors;
create policy "Allow public read-write on vendors" on public.vendors for all using (true) with check (true);

drop policy if exists "Allow public read-write on products" on public.products;
create policy "Allow public read-write on products" on public.products for all using (true) with check (true);

drop policy if exists "Allow public read-write on couriers" on public.couriers;
create policy "Allow public read-write on couriers" on public.couriers for all using (true) with check (true);

drop policy if exists "Allow public read-write on affiliate_relations" on public.affiliate_relations;
create policy "Allow public read-write on affiliate_relations" on public.affiliate_relations for all using (true) with check (true);

drop policy if exists "Allow public read-write on commission_settings" on public.commission_settings;
create policy "Allow public read-write on commission_settings" on public.commission_settings for all using (true) with check (true);

drop policy if exists "Allow public read-write on orders" on public.orders;
create policy "Allow public read-write on orders" on public.orders for all using (true) with check (true);

drop policy if exists "Allow public read-write on app_settings" on public.app_settings;
create policy "Allow public read-write on app_settings" on public.app_settings for all using (true) with check (true);

-- Insert Default Global Settings
insert into public.app_settings (id, app_name, logo_url, banner_url, contact_phone, website_mode, announcement, about_us)
values (
    'global_settings',
    'PASAR UMKM TEGALSARI',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200',
    '6281234567890',
    'active',
    'Selamat datang di Pasar UMKM Tegalsari! Dukung perekonomian lokal desa kita.',
    'Pasar UMKM Tegalsari adalah wadah marketplace lokal mandiri untuk para UMKM di tingkat Desa dan Kelurahan di wilayah Kecamatan Tegalsari, Kabupaten Banyuwangi. Kami mendukung pengiriman mandiri oleh kurir vendor dengan titik koordinat maps, serta sistem keagenan affiliator lokal untuk memperluas jangkauan pasar produk lokal.'
)
on conflict (id) do nothing;

-- Insert Administrators
insert into public.profiles (id, email, role, name, phone, address, kecamatan, village, latitude, longitude)
values (
    'admin_user',
    'admin@tegalsari.id',
    'admin',
    'Administrator Tegalsari',
    '6281234567890',
    'Kantor Kecamatan Tegalsari, Jl. Raya Tegalsari No.1',
    'Tegalsari',
    'Tegalsari',
    -8.4357,
    114.1293
)
on conflict (id) do nothing;


-- =====================================================================
-- 11. EXTRA OPTIONAL MIGRATION (ALT TABLES FOR NEW CAROUSEL & MEMBERSHIP TIERS)
-- Run the following script in your Supabase SQL Editor if you prefer separate 
-- database columns over the automatic text/JSON serialization fallback:
-- =====================================================================
--
-- ALTER TABLE public.app_settings 
-- ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}'::text[],
-- ADD COLUMN IF NOT EXISTS pakasir_enabled boolean DEFAULT false,
-- ADD COLUMN IF NOT EXISTS pakasir_api_key text DEFAULT '',
-- ADD COLUMN IF NOT EXISTS pakasir_merchant_id text DEFAULT '',
-- ADD COLUMN IF NOT EXISTS google_maps_enabled boolean DEFAULT true,
-- ADD COLUMN IF NOT EXISTS google_maps_api_key text DEFAULT '',
-- ADD COLUMN IF NOT EXISTS payment_methods text[] DEFAULT '{"COD"}'::text[],
-- ADD COLUMN IF NOT EXISTS shipping_methods text DEFAULT '["Kurir Mandiri Vendor", "Ambil Sendiri ke Toko"]',
-- ADD COLUMN IF NOT EXISTS banners jsonb DEFAULT '[]'::jsonb,
-- ADD COLUMN IF NOT EXISTS banner_duration integer DEFAULT 3000,
-- ADD COLUMN IF NOT EXISTS membership_settings jsonb DEFAULT '{"free": {"price": 0, "max_products": 5, "name": "FREE"}, "premium": {"price": 50000, "max_products": 25, "name": "PREMIUM"}, "vip": {"price": 150000, "max_products": 1000, "name": "VIP"}}'::jsonb;
--
-- ALTER TABLE public.vendors 
-- ADD COLUMN IF NOT EXISTS membership_tier text DEFAULT 'free';

-- 10. Create BALANCE_TRANSACTIONS table
create table if not exists public.balance_transactions (
    id text primary key,
    vendor_id text not null references public.profiles(id) on delete cascade,
    amount numeric not null,
    type text not null check (type in ('sales', 'commission', 'withdrawal', 'refund')),
    description text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. Create WITHDRAWAL_REQUESTS table
create table if not exists public.withdrawal_requests (
    id text primary key,
    vendor_id text not null references public.profiles(id) on delete cascade,
    amount numeric not null,
    bank_name text not null,
    bank_account_number text not null,
    bank_account_name text not null,
    status text not null check (status in ('pending', 'approved', 'rejected')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    completed_at timestamp with time zone
);
