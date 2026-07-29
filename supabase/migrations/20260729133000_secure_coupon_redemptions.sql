begin;

alter table public.coupons
  add column if not exists max_redemptions_per_customer integer not null default 1
    check (max_redemptions_per_customer > 0),
  add column if not exists max_discount_amount numeric(12, 2)
    check (max_discount_amount is null or max_discount_amount > 0);

alter table public.coupons
  drop constraint if exists coupons_percentage_value_check;

alter table public.coupons
  add constraint coupons_percentage_value_check
  check (type <> 'Percentage' or value between 0.01 and 100);

alter table public.orders
  add column if not exists coupon_id uuid references public.coupons(id) on delete set null,
  add column if not exists coupon_code text;

create unique index if not exists orders_payment_order_id_unique_idx
  on public.orders (payment_order_id)
  where payment_order_id is not null;

create unique index if not exists orders_payment_id_unique_idx
  on public.orders (payment_id)
  where payment_id is not null;

create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete restrict,
  customer_id uuid not null references public.profiles(id) on delete restrict,
  order_id uuid not null unique references public.orders(id) on delete restrict,
  discount_amount numeric(12, 2) not null check (discount_amount >= 0),
  created_at timestamptz not null default now()
);

create index coupon_redemptions_coupon_customer_idx
  on public.coupon_redemptions (coupon_id, customer_id);

alter table public.coupon_redemptions enable row level security;

create policy "Customers read own coupon redemptions"
  on public.coupon_redemptions for select to authenticated
  using ((select auth.uid()) = customer_id);

create policy "Admins read coupon redemptions"
  on public.coupon_redemptions for select to authenticated
  using ((select app_private.has_permission('coupons')));

revoke all on public.coupon_redemptions from public, anon, authenticated;
grant select on public.coupon_redemptions to authenticated;
grant all on public.coupon_redemptions to service_role;

drop policy if exists "Public reads active coupons" on public.coupons;
revoke select on public.coupons from anon;

create or replace function public.validate_coupon_server(
  p_code text,
  p_customer_id uuid,
  p_subtotal numeric,
  p_shipping_cost numeric default 0
)
returns table (
  coupon_id uuid,
  code text,
  coupon_type text,
  coupon_value numeric,
  discount_amount numeric,
  shipping_discount numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  selected_coupon public.coupons%rowtype;
  customer_uses integer;
  calculated_discount numeric(12, 2) := 0;
  calculated_shipping_discount numeric(12, 2) := 0;
begin
  if p_customer_id is null then
    raise exception 'Sign in before applying a coupon.'
      using errcode = '42501';
  end if;
  if p_code is null or btrim(p_code) !~ '^[A-Za-z0-9_-]{3,32}$' then
    raise exception 'Enter a valid coupon code.'
      using errcode = '22023';
  end if;
  if p_subtotal < 0 or p_shipping_cost < 0 then
    raise exception 'Invalid order totals.'
      using errcode = '22023';
  end if;

  select *
  into selected_coupon
  from public.coupons as candidate_coupon
  where candidate_coupon.code = upper(btrim(p_code));

  if not found
    or selected_coupon.status <> 'Active'
    or (selected_coupon.expires_at is not null and selected_coupon.expires_at <= now())
  then
    raise exception 'This coupon is invalid or expired.'
      using errcode = 'P0001';
  end if;

  if selected_coupon.usage_limit is not null
    and selected_coupon.usage_count >= selected_coupon.usage_limit
  then
    raise exception 'This coupon has reached its redemption limit.'
      using errcode = 'P0001';
  end if;

  if p_subtotal < selected_coupon.min_purchase then
    raise exception 'This coupon requires a minimum purchase of %.',
      selected_coupon.min_purchase
      using errcode = 'P0001';
  end if;

  select count(*)::integer
  into customer_uses
  from public.coupon_redemptions
  where coupon_redemptions.coupon_id = selected_coupon.id
    and coupon_redemptions.customer_id = p_customer_id;

  if customer_uses >= selected_coupon.max_redemptions_per_customer then
    raise exception 'You have already used this coupon.'
      using errcode = 'P0001';
  end if;

  if selected_coupon.type = 'Percentage' then
    calculated_discount := round(p_subtotal * selected_coupon.value / 100, 2);
    if selected_coupon.max_discount_amount is not null then
      calculated_discount := least(
        calculated_discount,
        selected_coupon.max_discount_amount
      );
    end if;
  elsif selected_coupon.type = 'Flat' then
    calculated_discount := least(selected_coupon.value, p_subtotal);
  elsif selected_coupon.type = 'FreeShipping' then
    calculated_shipping_discount := p_shipping_cost;
  end if;

  return query
  select
    selected_coupon.id,
    selected_coupon.code,
    selected_coupon.type,
    selected_coupon.value,
    calculated_discount,
    calculated_shipping_discount;
end;
$$;

create or replace function public.finalize_paid_order(
  p_customer_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_shipping_address text,
  p_payment_order_id text,
  p_payment_id text,
  p_items jsonb,
  p_subtotal numeric,
  p_shipping_cost numeric,
  p_tax_amount numeric,
  p_coupon_code text default null
)
returns table (
  order_id uuid,
  order_number text,
  discount_amount numeric,
  order_total numeric,
  already_exists boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_order public.orders%rowtype;
  selected_coupon public.coupons%rowtype;
  coupon_result record;
  new_order public.orders%rowtype;
  item jsonb;
  item_product_id uuid;
  item_variant_id uuid;
  item_quantity integer;
  calculated_discount numeric(12, 2) := 0;
  shipping_discount numeric(12, 2) := 0;
  calculated_total numeric(12, 2);
begin
  if p_customer_id is null
    or p_payment_order_id is null
    or p_payment_id is null
    or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) = 0
  then
    raise exception 'Missing required order data.'
      using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_payment_id, 0));

  select *
  into existing_order
  from public.orders
  where payment_id = p_payment_id;

  if found then
    if existing_order.customer_id <> p_customer_id then
      raise exception 'This payment is already attached to another order.'
        using errcode = '42501';
    end if;
    return query
    select
      existing_order.id,
      existing_order.order_number,
      existing_order.discount_amount,
      existing_order.total,
      true;
    return;
  end if;

  if p_coupon_code is not null and btrim(p_coupon_code) <> '' then
    select *
    into selected_coupon
    from public.coupons
    where code = upper(btrim(p_coupon_code))
    for update;

    if not found then
      raise exception 'This coupon is invalid or expired.'
        using errcode = 'P0001';
    end if;

    select *
    into coupon_result
    from public.validate_coupon_server(
      selected_coupon.code,
      p_customer_id,
      p_subtotal,
      p_shipping_cost
    );

    calculated_discount := coupon_result.discount_amount;
    shipping_discount := coupon_result.shipping_discount;
  end if;

  calculated_total := greatest(
    p_subtotal + p_shipping_cost + p_tax_amount
      - calculated_discount - shipping_discount,
    0
  );

  insert into public.orders (
    order_number,
    customer_id,
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    subtotal,
    shipping_cost,
    tax_amount,
    discount_amount,
    total,
    coupon_id,
    coupon_code,
    payment_method,
    payment_order_id,
    payment_id,
    payment_status,
    delivery_status
  )
  values (
    '#PH-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
    p_customer_id,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_shipping_address,
    p_subtotal,
    p_shipping_cost,
    p_tax_amount,
    calculated_discount + shipping_discount,
    calculated_total,
    selected_coupon.id,
    selected_coupon.code,
    'Razorpay',
    p_payment_order_id,
    p_payment_id,
    'Paid',
    'Confirmed'
  )
  returning * into new_order;

  for item in select value from jsonb_array_elements(p_items)
  loop
    item_product_id := (item ->> 'product_id')::uuid;
    item_variant_id := nullif(item ->> 'variant_id', '')::uuid;
    item_quantity := (item ->> 'quantity')::integer;

    if item_quantity < 1 then
      raise exception 'Invalid product quantity.'
        using errcode = '22023';
    end if;

    if item_variant_id is not null then
      update public.product_variants
      set stock = stock - item_quantity
      where id = item_variant_id
        and product_id = item_product_id
        and stock >= item_quantity;

      if not found then
        raise exception 'A product option is no longer available in the requested quantity.'
          using errcode = 'P0001';
      end if;
    end if;

    update public.products
    set stock = stock - item_quantity
    where id = item_product_id
      and status = 'Published'
      and stock >= item_quantity;

    if not found then
      raise exception 'A product is no longer available in the requested quantity.'
        using errcode = 'P0001';
    end if;

    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      sku,
      unit_price,
      quantity,
      size,
      image_path
    )
    values (
      new_order.id,
      item_product_id,
      item ->> 'product_name',
      item ->> 'sku',
      (item ->> 'unit_price')::numeric,
      item_quantity,
      nullif(item ->> 'size', ''),
      nullif(item ->> 'image_path', '')
    );
  end loop;

  insert into public.order_timeline (order_id, title)
  values
    (new_order.id, 'Order placed'),
    (new_order.id, 'Payment verified by Razorpay'),
    (new_order.id, 'Order confirmed');

  if selected_coupon.id is not null then
    insert into public.coupon_redemptions (
      coupon_id,
      customer_id,
      order_id,
      discount_amount
    )
    values (
      selected_coupon.id,
      p_customer_id,
      new_order.id,
      calculated_discount + shipping_discount
    );

    update public.coupons
    set usage_count = usage_count + 1
    where id = selected_coupon.id;
  end if;

  return query
  select
    new_order.id,
    new_order.order_number,
    new_order.discount_amount,
    new_order.total,
    false;
end;
$$;

revoke all on function public.validate_coupon_server(text, uuid, numeric, numeric)
  from public, anon, authenticated;
revoke all on function public.finalize_paid_order(
  uuid, text, text, text, text, text, text, jsonb, numeric, numeric, numeric, text
) from public, anon, authenticated;

grant execute on function public.validate_coupon_server(text, uuid, numeric, numeric)
  to service_role;
grant execute on function public.finalize_paid_order(
  uuid, text, text, text, text, text, text, jsonb, numeric, numeric, numeric, text
) to service_role;

commit;
