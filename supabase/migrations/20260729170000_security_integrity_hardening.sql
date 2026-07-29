begin;

create or replace function app_private.has_permission(permission_name text)
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
        and (
          (
            cardinality(coalesce(permissions, '{}'::text[])) > 0
            and (
              '*' = any(permissions)
              or permission_name = any(permissions)
            )
          )
          or
          (
            cardinality(coalesce(permissions, '{}'::text[])) = 0
            and case role
              when 'Owner' then true
              when 'Admin' then true
              when 'Manager' then permission_name = any(array[
                'products', 'orders', 'customers', 'coupons', 'inventory',
                'reviews', 'analytics', 'marketing', 'shipping', 'payments',
                'taxes', 'media', 'seo', 'settings', 'categories'
              ]::text[])
              when 'Inventory Manager' then permission_name = any(array[
                'products', 'inventory', 'media', 'categories'
              ]::text[])
              when 'Order Manager' then permission_name = any(array[
                'orders', 'customers', 'shipping', 'payments'
              ]::text[])
              when 'Customer Support' then permission_name = any(array[
                'orders', 'customers', 'reviews'
              ]::text[])
              when 'Marketing' then permission_name = any(array[
                'coupons', 'analytics', 'marketing', 'media', 'seo'
              ]::text[])
              when 'Editor' then permission_name = any(array[
                'products', 'categories', 'media', 'seo'
              ]::text[])
              else false
            end
          )
        )
    );
$$;

revoke all on function app_private.has_permission(text) from public, anon;
grant execute on function app_private.has_permission(text) to authenticated;
revoke all on function app_private.set_updated_at() from public, anon, authenticated;

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
  setting_prices_include_tax boolean := true;
begin
  if p_customer_id is null
    or p_payment_order_id is null
    or p_payment_id is null
    or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) = 0
    or p_subtotal < 0
    or p_shipping_cost < 0
    or p_tax_amount < 0
  then
    raise exception 'Missing or invalid order data.'
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

  select coalesce(
    (
      select settings.prices_include_tax
      from public.store_settings as settings
      where settings.id = 'default'
    ),
    true
  )
  into setting_prices_include_tax;

  calculated_total := greatest(
    p_subtotal
      + p_shipping_cost
      + case when setting_prices_include_tax then 0 else p_tax_amount end
      - calculated_discount
      - shipping_discount,
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

revoke all on function public.finalize_paid_order(
  uuid, text, text, text, text, text, text, jsonb, numeric, numeric, numeric, text
) from public, anon, authenticated;
grant execute on function public.finalize_paid_order(
  uuid, text, text, text, text, text, text, jsonb, numeric, numeric, numeric, text
) to service_role;

commit;
