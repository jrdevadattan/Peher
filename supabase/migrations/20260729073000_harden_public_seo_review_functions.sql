begin;

alter function public.get_storefront_settings() security invoker;

create policy "Public reads storefront settings"
  on public.store_settings for select to anon, authenticated
  using (id = 'default');

grant select (
  id,
  store_name,
  tagline,
  contact_email,
  currency_code,
  free_shipping_threshold,
  standard_shipping_rate,
  meta_title,
  meta_description,
  public_site_url
) on public.store_settings to anon, authenticated;

alter function public.submit_product_review(uuid, smallint, text, text)
  security invoker;

create or replace function app_private.enforce_customer_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  customer_profile public.profiles%rowtype;
begin
  if (select app_private.is_admin()) then
    return new;
  end if;

  if current_user_id is null then
    raise exception 'You must be signed in to review a product.'
      using errcode = '42501';
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

  new.customer_id := current_user_id;
  new.customer_name := coalesce(
    nullif(btrim(customer_profile.full_name), ''),
    split_part(customer_profile.email, '@', 1)
  );
  new.customer_email := customer_profile.email;
  new.status := 'Pending';
  new.reply := null;
  new.is_verified_purchase := exists (
    select 1
    from public.orders
    join public.order_items on order_items.order_id = orders.id
    where orders.customer_id = current_user_id
      and order_items.product_id = new.product_id
      and orders.payment_status = 'Paid'
      and orders.delivery_status = 'Delivered'
  );

  return new;
end;
$$;

revoke all on function app_private.enforce_customer_review() from public, anon, authenticated;

create trigger reviews_enforce_customer_submission
  before insert on public.reviews
  for each row execute function app_private.enforce_customer_review();

grant insert on public.reviews to authenticated;
revoke execute on function public.submit_product_review(uuid, smallint, text, text)
  from public, anon;
grant execute on function public.submit_product_review(uuid, smallint, text, text)
  to authenticated;

create index if not exists store_settings_updated_by_idx
  on public.store_settings (updated_by);

commit;
