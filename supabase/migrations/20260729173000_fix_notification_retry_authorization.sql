begin;

create or replace function app_private.retry_order_notifications()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_count integer;
begin
  if (select auth.role()) <> 'service_role'
    and not (select app_private.has_permission('orders'))
  then
    raise exception 'Order notification access is required.'
      using errcode = '42501';
  end if;

  insert into public.admin_notifications (
    type,
    severity,
    title,
    message,
    order_id,
    metadata,
    created_at
  )
  select
    'order_created',
    'success',
    'New order ' || orders.order_number,
    orders.customer_name || ' placed an order worth '
      || orders.total::text || ' INR',
    orders.id,
    jsonb_build_object(
      'order_number', orders.order_number,
      'customer_name', orders.customer_name,
      'customer_email', orders.customer_email,
      'total', orders.total,
      'currency', 'INR'
    ),
    orders.created_at
  from public.orders
  where not exists (
    select 1
    from public.admin_notifications
    where admin_notifications.order_id = orders.id
      and admin_notifications.type = 'order_created'
  )
  on conflict do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

grant usage on schema app_private to authenticated, service_role;
revoke all on function app_private.retry_order_notifications()
  from public, anon;
grant execute on function app_private.retry_order_notifications()
  to authenticated, service_role;

revoke all on function public.retry_order_notifications()
  from public, anon;
grant execute on function public.retry_order_notifications()
  to authenticated, service_role;

commit;
