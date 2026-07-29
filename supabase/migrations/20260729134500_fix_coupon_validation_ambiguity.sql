begin;

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

revoke all on function public.validate_coupon_server(text, uuid, numeric, numeric)
  from public, anon, authenticated;
grant execute on function public.validate_coupon_server(text, uuid, numeric, numeric)
  to service_role;

commit;
