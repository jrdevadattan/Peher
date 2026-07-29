begin;

alter table public.products
  add column if not exists gtin text,
  add column if not exists mpn text;

update public.products
set
  brand = 'PEHER',
  mpn = sku,
  barcode = null
where brand in ('PEHER Atelier', 'PEHER')
   or brand is null;

alter table public.products
  add constraint products_gtin_format_check
  check (gtin is null or gtin ~ '^[0-9]{8}$|^[0-9]{12}$|^[0-9]{13}$|^[0-9]{14}$');

alter table public.reviews
  add column if not exists title text,
  add column if not exists is_verified_purchase boolean not null default false;

alter table public.reviews
  add constraint reviews_title_length_check
  check (title is null or char_length(title) between 3 and 120),
  add constraint reviews_comment_length_check
  check (char_length(comment) between 20 and 2000);

create unique index reviews_one_per_customer_product_idx
  on public.reviews (product_id, customer_id)
  where customer_id is not null;

alter table public.store_settings
  add column if not exists standard_shipping_rate numeric(12, 2) not null default 99
  check (standard_shipping_rate >= 0);

create or replace function public.get_storefront_settings()
returns table (
  store_name text,
  tagline text,
  contact_email text,
  currency_code text,
  free_shipping_threshold numeric,
  standard_shipping_rate numeric,
  meta_title text,
  meta_description text,
  public_site_url text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    settings.store_name,
    settings.tagline,
    settings.contact_email,
    settings.currency_code,
    settings.free_shipping_threshold,
    settings.standard_shipping_rate,
    settings.meta_title,
    settings.meta_description,
    settings.public_site_url
  from public.store_settings as settings
  where settings.id = 'default';
$$;

revoke all on function public.get_storefront_settings() from public;
grant execute on function public.get_storefront_settings() to anon, authenticated;

create or replace function public.submit_product_review(
  p_product_id uuid,
  p_rating smallint,
  p_title text,
  p_comment text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  customer_profile public.profiles%rowtype;
  submitted_review_id uuid;
  verified_purchase boolean;
begin
  if current_user_id is null then
    raise exception 'You must be signed in to review a product.'
      using errcode = '42501';
  end if;

  if p_rating is null or p_rating not between 1 and 5 then
    raise exception 'Rating must be between 1 and 5.'
      using errcode = '22023';
  end if;

  if char_length(btrim(coalesce(p_title, ''))) not between 3 and 120 then
    raise exception 'Review title must be between 3 and 120 characters.'
      using errcode = '22023';
  end if;

  if char_length(btrim(coalesce(p_comment, ''))) not between 20 and 2000 then
    raise exception 'Review must be between 20 and 2000 characters.'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.products
    where id = p_product_id
      and status = 'Published'
  ) then
    raise exception 'This product is not available for review.'
      using errcode = 'P0002';
  end if;

  select *
  into customer_profile
  from public.profiles
  where id = current_user_id
    and status = 'Active';

  if not found then
    raise exception 'Your customer profile is not available.'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.reviews
    where product_id = p_product_id
      and customer_id = current_user_id
  ) then
    raise exception 'You have already reviewed this product.'
      using errcode = '23505';
  end if;

  select exists (
    select 1
    from public.orders
    join public.order_items on order_items.order_id = orders.id
    where orders.customer_id = current_user_id
      and order_items.product_id = p_product_id
      and orders.payment_status = 'Paid'
      and orders.delivery_status = 'Delivered'
  )
  into verified_purchase;

  insert into public.reviews (
    product_id,
    customer_id,
    customer_name,
    customer_email,
    rating,
    title,
    comment,
    status,
    is_verified_purchase
  )
  values (
    p_product_id,
    current_user_id,
    coalesce(nullif(btrim(customer_profile.full_name), ''), split_part(customer_profile.email, '@', 1)),
    customer_profile.email,
    p_rating,
    btrim(p_title),
    btrim(p_comment),
    'Pending',
    verified_purchase
  )
  returning id into submitted_review_id;

  return submitted_review_id;
end;
$$;

revoke all on function public.submit_product_review(uuid, smallint, text, text) from public;
grant execute on function public.submit_product_review(uuid, smallint, text, text)
  to authenticated;

revoke insert on public.reviews from authenticated;

commit;
