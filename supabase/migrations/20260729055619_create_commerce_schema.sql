begin;

create extension if not exists pgcrypto;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;
grant usage on schema app_private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  phone text,
  avatar_path text,
  status text not null default 'Active' check (status in ('Active', 'Blocked')),
  tags text[] not null default '{}',
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email text not null unique,
  role text not null check (
    role in (
      'Owner',
      'Admin',
      'Manager',
      'Inventory Manager',
      'Order Manager',
      'Customer Support',
      'Marketing',
      'Editor'
    )
  ),
  permissions text[] not null default '{}',
  is_active boolean not null default true,
  two_factor_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function app_private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.admin_users
      where user_id = (select auth.uid())
        and is_active = true
    );
$$;

revoke all on function app_private.is_admin() from public;
grant execute on function app_private.is_admin() to authenticated;

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function app_private.set_updated_at() from public;
grant execute on function app_private.set_updated_at() to authenticated;

create or replace function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function app_private.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app_private.handle_new_user();

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_path text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  sku text not null unique,
  name text not null,
  brand text not null default 'PEHER Atelier',
  category_id uuid references public.categories(id) on delete set null,
  subcategory text,
  description text not null default '',
  short_description text not null default '',
  material text not null default '',
  price numeric(12, 2) not null check (price >= 0),
  original_price numeric(12, 2) check (original_price is null or original_price >= price),
  cost_price numeric(12, 2) not null default 0 check (cost_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  weight text,
  dimensions text,
  tags text[] not null default '{}',
  seo_title text,
  seo_description text,
  status text not null default 'Draft' check (status in ('Published', 'Draft', 'Archived', 'Hidden')),
  is_featured boolean not null default false,
  is_trending boolean not null default false,
  is_bestseller boolean not null default false,
  badge text,
  tax_rate numeric(5, 2) not null default 0 check (tax_rate between 0 and 100),
  shipping_class text,
  barcode text,
  supplier text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text,
  color text,
  price numeric(12, 2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  sku text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  bucket_id text not null default 'product-media',
  object_path text not null,
  kind text not null default 'gallery' check (kind in ('primary', 'hover', 'gallery')),
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, kind, sort_order)
);

create table public.product_related_products (
  product_id uuid not null references public.products(id) on delete cascade,
  related_product_id uuid not null references public.products(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (product_id, related_product_id),
  check (product_id <> related_product_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  shipping_address text not null,
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  shipping_cost numeric(12, 2) not null default 0 check (shipping_cost >= 0),
  tax_amount numeric(12, 2) not null default 0 check (tax_amount >= 0),
  discount_amount numeric(12, 2) not null default 0 check (discount_amount >= 0),
  total numeric(12, 2) not null default 0 check (total >= 0),
  payment_method text,
  payment_order_id text,
  payment_id text,
  payment_status text not null default 'Pending' check (
    payment_status in ('Paid', 'Pending', 'Refunded', 'Failed')
  ),
  delivery_status text not null default 'Pending' check (
    delivery_status in ('Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Refunded')
  ),
  tracking_number text,
  courier_name text,
  customer_notes text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  sku text,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  size text,
  image_path text,
  created_at timestamptz not null default now()
);

create table public.order_timeline (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  title text not null,
  note text,
  created_at timestamptz not null default now()
);

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('Percentage', 'Flat', 'FreeShipping')),
  value numeric(12, 2) not null default 0 check (value >= 0),
  min_purchase numeric(12, 2) not null default 0 check (min_purchase >= 0),
  expires_at timestamptz,
  usage_limit integer check (usage_limit is null or usage_limit >= 0),
  usage_count integer not null default 0 check (usage_count >= 0),
  status text not null default 'Active' check (status in ('Active', 'Expired', 'Disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  customer_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  rating smallint not null check (rating between 1 and 5),
  comment text not null,
  status text not null default 'Pending' check (status in ('Approved', 'Pending', 'Rejected')),
  reply text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_name text not null,
  actor_role text not null,
  action text not null,
  details text not null,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index products_category_id_idx on public.products(category_id);
create index products_status_created_at_idx on public.products(status, created_at desc);
create index products_featured_idx on public.products(is_featured) where is_featured = true;
create index product_variants_product_id_idx on public.product_variants(product_id);
create index product_images_product_id_idx on public.product_images(product_id, sort_order);
create index orders_customer_id_created_at_idx on public.orders(customer_id, created_at desc);
create index orders_status_idx on public.orders(delivery_status, created_at desc);
create index order_items_order_id_idx on public.order_items(order_id);
create index order_timeline_order_id_idx on public.order_timeline(order_id, created_at);
create index reviews_product_status_idx on public.reviews(product_id, status, created_at desc);
create index activity_logs_created_at_idx on public.activity_logs(created_at desc);

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function app_private.set_updated_at();
create trigger admin_users_set_updated_at before update on public.admin_users
  for each row execute function app_private.set_updated_at();
create trigger categories_set_updated_at before update on public.categories
  for each row execute function app_private.set_updated_at();
create trigger products_set_updated_at before update on public.products
  for each row execute function app_private.set_updated_at();
create trigger product_variants_set_updated_at before update on public.product_variants
  for each row execute function app_private.set_updated_at();
create trigger orders_set_updated_at before update on public.orders
  for each row execute function app_private.set_updated_at();
create trigger coupons_set_updated_at before update on public.coupons
  for each row execute function app_private.set_updated_at();
create trigger reviews_set_updated_at before update on public.reviews
  for each row execute function app_private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.product_related_products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_timeline enable row level security;
alter table public.coupons enable row level security;
alter table public.reviews enable row level security;
alter table public.activity_logs enable row level security;

create policy "Users read own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "Users update own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
create policy "Admins manage profiles"
  on public.profiles for all to authenticated
  using ((select app_private.is_admin()))
  with check ((select app_private.is_admin()));

create policy "Admins read own membership"
  on public.admin_users for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Admins manage memberships"
  on public.admin_users for all to authenticated
  using ((select app_private.is_admin()))
  with check ((select app_private.is_admin()));

create policy "Public reads active categories"
  on public.categories for select to anon, authenticated
  using (is_active = true);
create policy "Admins manage categories"
  on public.categories for all to authenticated
  using ((select app_private.is_admin()))
  with check ((select app_private.is_admin()));

create policy "Public reads published products"
  on public.products for select to anon, authenticated
  using (status = 'Published');
create policy "Admins manage products"
  on public.products for all to authenticated
  using ((select app_private.is_admin()))
  with check ((select app_private.is_admin()));

create policy "Public reads published variants"
  on public.product_variants for select to anon, authenticated
  using (
    exists (
      select 1 from public.products
      where products.id = product_variants.product_id
        and products.status = 'Published'
    )
  );
create policy "Admins manage variants"
  on public.product_variants for all to authenticated
  using ((select app_private.is_admin()))
  with check ((select app_private.is_admin()));

create policy "Public reads published product images"
  on public.product_images for select to anon, authenticated
  using (
    exists (
      select 1 from public.products
      where products.id = product_images.product_id
        and products.status = 'Published'
    )
  );
create policy "Admins manage product images"
  on public.product_images for all to authenticated
  using ((select app_private.is_admin()))
  with check ((select app_private.is_admin()));

create policy "Public reads published related products"
  on public.product_related_products for select to anon, authenticated
  using (
    exists (
      select 1 from public.products
      where products.id = product_related_products.product_id
        and products.status = 'Published'
    )
  );
create policy "Admins manage related products"
  on public.product_related_products for all to authenticated
  using ((select app_private.is_admin()))
  with check ((select app_private.is_admin()));

create policy "Customers read own orders"
  on public.orders for select to authenticated
  using ((select auth.uid()) = customer_id);
create policy "Customers create own orders"
  on public.orders for insert to authenticated
  with check ((select auth.uid()) = customer_id);
create policy "Admins manage orders"
  on public.orders for all to authenticated
  using ((select app_private.is_admin()))
  with check ((select app_private.is_admin()));

create policy "Customers read own order items"
  on public.order_items for select to authenticated
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.customer_id = (select auth.uid())
    )
  );
create policy "Customers create own order items"
  on public.order_items for insert to authenticated
  with check (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.customer_id = (select auth.uid())
    )
  );
create policy "Admins manage order items"
  on public.order_items for all to authenticated
  using ((select app_private.is_admin()))
  with check ((select app_private.is_admin()));

create policy "Customers read own order timeline"
  on public.order_timeline for select to authenticated
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_timeline.order_id
        and orders.customer_id = (select auth.uid())
    )
  );
create policy "Admins manage order timeline"
  on public.order_timeline for all to authenticated
  using ((select app_private.is_admin()))
  with check ((select app_private.is_admin()));

create policy "Public reads active coupons"
  on public.coupons for select to anon, authenticated
  using (
    status = 'Active'
    and (expires_at is null or expires_at > now())
  );
create policy "Admins manage coupons"
  on public.coupons for all to authenticated
  using ((select app_private.is_admin()))
  with check ((select app_private.is_admin()));

create policy "Public reads approved reviews"
  on public.reviews for select to anon, authenticated
  using (status = 'Approved');
create policy "Customers read own reviews"
  on public.reviews for select to authenticated
  using ((select auth.uid()) = customer_id);
create policy "Customers create own reviews"
  on public.reviews for insert to authenticated
  with check (
    (select auth.uid()) = customer_id
    and status = 'Pending'
  );
create policy "Admins manage reviews"
  on public.reviews for all to authenticated
  using ((select app_private.is_admin()))
  with check ((select app_private.is_admin()));

create policy "Admins read activity logs"
  on public.activity_logs for select to authenticated
  using ((select app_private.is_admin()));
create policy "Admins create activity logs"
  on public.activity_logs for insert to authenticated
  with check (
    (select app_private.is_admin())
    and ((select auth.uid()) = actor_id or actor_id is null)
  );

grant usage on schema public to anon, authenticated, service_role;
grant select on public.categories, public.products, public.product_variants,
  public.product_images, public.product_related_products, public.coupons,
  public.reviews to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-media',
  'product-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Admins list product media"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'product-media'
    and (select app_private.is_admin())
  );
create policy "Admins upload product media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-media'
    and (select app_private.is_admin())
  );
create policy "Admins update product media"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'product-media'
    and (select app_private.is_admin())
  )
  with check (
    bucket_id = 'product-media'
    and (select app_private.is_admin())
  );
create policy "Admins delete product media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'product-media'
    and (select app_private.is_admin())
  );

insert into public.categories (name, slug, description, sort_order)
values
  ('Rings', 'rings', 'Hand-finished rings and signets.', 10),
  ('Necklaces', 'necklaces', 'Chains, pendants, and neckpieces.', 20),
  ('Bracelets', 'bracelets', 'Cuffs, chains, and bracelets.', 30),
  ('Earrings', 'earrings', 'Hoops, drops, and statement earrings.', 40)
on conflict (slug) do update
set name = excluded.name, description = excluded.description, sort_order = excluded.sort_order;

insert into public.products (
  slug, sku, name, brand, category_id, subcategory, description,
  short_description, material, price, original_price, cost_price, stock,
  weight, dimensions, tags, seo_title, seo_description, status,
  is_featured, is_trending, is_bestseller, badge, tax_rate,
  shipping_class, barcode, supplier
)
values
  (
    'tide-emerald', 'PEHER-1000', 'Tide Emerald Ring', 'PEHER Atelier',
    (select id from public.categories where slug = 'rings'), 'Luxe Heritage',
    'Hand-finished piece formed with quiet precision. Designed for everyday statement and stacking.',
    'Handcrafted 18k gold and emerald ring.', '18k Gold · Emerald',
    2400, 3200, 1080, 25, '14g', '2.5 x 2.5 x 1.0 cm',
    array['Luxe', 'Handcrafted', 'Gold', 'Bestseller'],
    'Tide Emerald Ring — PEHER Luxury Jewellery',
    'Shop the Tide Emerald Ring, handcrafted by Vasudha Tiwari.',
    'Published', true, true, false, 'New', 3, 'Standard Complimentary',
    '890123451000', 'Mehrauli Artisan Guild'
  ),
  (
    'pearl-embrace', 'PEHER-1001', 'Pearl Embrace Pendant', 'PEHER Atelier',
    (select id from public.categories where slug = 'necklaces'), 'Luxe Heritage',
    'Hand-finished piece formed with quiet precision. Designed for everyday statement and layering.',
    'Handcrafted silver and pearl pendant.', 'Silver · Pearl',
    1800, 2600, 810, 32, '14g', '2.5 x 2.5 x 1.0 cm',
    array['Luxe', 'Handcrafted', 'Silver', 'Pearl'],
    'Pearl Embrace Pendant — PEHER Luxury Jewellery',
    'Shop the Pearl Embrace Pendant, handcrafted by Vasudha Tiwari.',
    'Published', true, false, false, null, 3, 'Standard Complimentary',
    '890123451001', 'Mehrauli Artisan Guild'
  ),
  (
    'linen-chain', 'PEHER-1002', 'Linen Chain Bracelet', 'PEHER Atelier',
    (select id from public.categories where slug = 'bracelets'), 'Luxe Heritage',
    'Hand-finished piece formed with quiet precision. Designed for everyday statement and stacking.',
    'Handcrafted gold vermeil chain bracelet.', '18k Gold Vermeil',
    1600, null, 720, 39, '14g', '2.5 x 2.5 x 1.0 cm',
    array['Luxe', 'Handcrafted', 'Gold', 'Vermeil'],
    'Linen Chain Bracelet — PEHER Luxury Jewellery',
    'Shop the Linen Chain Bracelet, handcrafted by Vasudha Tiwari.',
    'Published', true, true, false, null, 3, 'Standard Complimentary',
    '890123451002', 'Mehrauli Artisan Guild'
  ),
  (
    'halo-hoops', 'PEHER-1003', 'Halo Hoop Earrings', 'PEHER Atelier',
    (select id from public.categories where slug = 'earrings'), 'Luxe Heritage',
    'Hand-finished piece formed with quiet precision. Designed for everyday statement.',
    'Handcrafted 18k gold hoop earrings.', '18k Gold',
    1400, 2000, 630, 46, '14g', '2.5 x 2.5 x 1.0 cm',
    array['Luxe', 'Handcrafted', 'Gold', 'Hoops'],
    'Halo Hoop Earrings — PEHER Luxury Jewellery',
    'Shop the Halo Hoop Earrings, handcrafted by Vasudha Tiwari.',
    'Published', false, false, false, null, 3, 'Standard Complimentary',
    '890123451003', 'Mehrauli Artisan Guild'
  ),
  (
    'sable-ring', 'PEHER-1004', 'Sable Signet Ring', 'PEHER Atelier',
    (select id from public.categories where slug = 'rings'), 'Luxe Heritage',
    'Hand-finished piece formed with quiet precision. Designed for everyday statement and stacking.',
    'Handcrafted sterling silver signet ring.', 'Sterling Silver',
    2900, null, 1305, 53, '14g', '2.5 x 2.5 x 1.0 cm',
    array['Luxe', 'Handcrafted', 'Silver', 'Bestseller'],
    'Sable Signet Ring — PEHER Luxury Jewellery',
    'Shop the Sable Signet Ring, handcrafted by Vasudha Tiwari.',
    'Published', false, true, true, 'Bestseller', 3, 'Standard Complimentary',
    '890123451004', 'Mehrauli Artisan Guild'
  ),
  (
    'verse-chain', 'PEHER-1005', 'Verse Chain Necklace', 'PEHER Atelier',
    (select id from public.categories where slug = 'necklaces'), 'Luxe Heritage',
    'Hand-finished piece formed with quiet precision. Designed for everyday statement and layering.',
    'Handcrafted 18k gold chain necklace.', '18k Gold',
    2200, 3000, 990, 30, '14g', '2.5 x 2.5 x 1.0 cm',
    array['Luxe', 'Handcrafted', 'Gold', 'Chain'],
    'Verse Chain Necklace — PEHER Luxury Jewellery',
    'Shop the Verse Chain Necklace, handcrafted by Vasudha Tiwari.',
    'Published', false, false, false, null, 3, 'Standard Complimentary',
    '890123451005', 'Mehrauli Artisan Guild'
  ),
  (
    'mira-cuff', 'PEHER-1006', 'Mira Cuff', 'PEHER Atelier',
    (select id from public.categories where slug = 'bracelets'), 'Luxe Heritage',
    'Hand-finished piece formed with quiet precision. Designed for everyday statement and stacking.',
    'Handcrafted brass and enamel cuff.', 'Brass · Enamel',
    3400, null, 1530, 37, '14g', '2.5 x 2.5 x 1.0 cm',
    array['Luxe', 'Handcrafted', 'Brass', 'Enamel'],
    'Mira Cuff — PEHER Luxury Jewellery',
    'Shop the Mira Cuff, handcrafted by Vasudha Tiwari.',
    'Published', false, true, false, null, 3, 'Standard Complimentary',
    '890123451006', 'Mehrauli Artisan Guild'
  ),
  (
    'dew-drops', 'PEHER-1007', 'Dew Drop Earrings', 'PEHER Atelier',
    (select id from public.categories where slug = 'earrings'), 'Luxe Heritage',
    'Hand-finished piece formed with quiet precision. Designed for everyday statement.',
    'Handcrafted silver and pearl drop earrings.', 'Silver · Pearl',
    1500, 2100, 675, 44, '14g', '2.5 x 2.5 x 1.0 cm',
    array['Luxe', 'Handcrafted', 'Silver', 'Pearl'],
    'Dew Drop Earrings — PEHER Luxury Jewellery',
    'Shop the Dew Drop Earrings, handcrafted by Vasudha Tiwari.',
    'Published', false, false, false, null, 3, 'Standard Complimentary',
    '890123451007', 'Mehrauli Artisan Guild'
  )
on conflict (slug) do update
set
  sku = excluded.sku,
  name = excluded.name,
  brand = excluded.brand,
  category_id = excluded.category_id,
  subcategory = excluded.subcategory,
  description = excluded.description,
  short_description = excluded.short_description,
  material = excluded.material,
  price = excluded.price,
  original_price = excluded.original_price,
  cost_price = excluded.cost_price,
  stock = excluded.stock,
  tags = excluded.tags,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  status = excluded.status,
  is_featured = excluded.is_featured,
  is_trending = excluded.is_trending,
  is_bestseller = excluded.is_bestseller,
  badge = excluded.badge,
  tax_rate = excluded.tax_rate,
  shipping_class = excluded.shipping_class,
  barcode = excluded.barcode,
  supplier = excluded.supplier;

insert into public.product_images (product_id, object_path, kind, alt_text, sort_order)
select p.id, image.object_path, image.kind, p.name, image.sort_order
from public.products p
join (
  values
    ('tide-emerald', 'catalog/seed/p1.jpg', 'primary', 0),
    ('tide-emerald', 'catalog/seed/rings.jpg', 'hover', 0),
    ('pearl-embrace', 'catalog/seed/p2.jpg', 'primary', 0),
    ('pearl-embrace', 'catalog/seed/necklaces.jpg', 'hover', 0),
    ('linen-chain', 'catalog/seed/p3.jpg', 'primary', 0),
    ('linen-chain', 'catalog/seed/bracelets.jpg', 'hover', 0),
    ('halo-hoops', 'catalog/seed/p4.jpg', 'primary', 0),
    ('halo-hoops', 'catalog/seed/earrings.jpg', 'hover', 0),
    ('sable-ring', 'catalog/seed/rings.jpg', 'primary', 0),
    ('sable-ring', 'catalog/seed/p1.jpg', 'hover', 0),
    ('verse-chain', 'catalog/seed/necklaces.jpg', 'primary', 0),
    ('verse-chain', 'catalog/seed/p2.jpg', 'hover', 0),
    ('mira-cuff', 'catalog/seed/bracelets.jpg', 'primary', 0),
    ('mira-cuff', 'catalog/seed/p3.jpg', 'hover', 0),
    ('dew-drops', 'catalog/seed/earrings.jpg', 'primary', 0),
    ('dew-drops', 'catalog/seed/p4.jpg', 'hover', 0)
) as image(product_slug, object_path, kind, sort_order)
  on image.product_slug = p.slug
on conflict (product_id, kind, sort_order) do update
set object_path = excluded.object_path, alt_text = excluded.alt_text;

insert into public.product_variants (product_id, size, price, stock, sku, sort_order)
select
  p.id,
  variant.size,
  p.price,
  variant.stock,
  p.sku || '-S' || variant.size,
  variant.sort_order
from public.products p
cross join (
  values ('6', 10, 10), ('7', 15, 20), ('8', 8, 30)
) as variant(size, stock, sort_order)
on conflict (sku) do update
set
  price = excluded.price,
  stock = excluded.stock,
  sort_order = excluded.sort_order;

insert into public.product_related_products (product_id, related_product_id, sort_order)
select p.id, related.id, relation.sort_order
from (
  values
    ('tide-emerald', 'pearl-embrace', 10),
    ('tide-emerald', 'linen-chain', 20),
    ('pearl-embrace', 'tide-emerald', 10),
    ('pearl-embrace', 'verse-chain', 20),
    ('linen-chain', 'mira-cuff', 10),
    ('halo-hoops', 'dew-drops', 10),
    ('sable-ring', 'tide-emerald', 10),
    ('verse-chain', 'pearl-embrace', 10),
    ('mira-cuff', 'linen-chain', 10),
    ('dew-drops', 'halo-hoops', 10)
) as relation(product_slug, related_slug, sort_order)
join public.products p on p.slug = relation.product_slug
join public.products related on related.slug = relation.related_slug
on conflict (product_id, related_product_id) do update
set sort_order = excluded.sort_order;

commit;
