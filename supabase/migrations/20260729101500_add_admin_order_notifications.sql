begin;

create table public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('order_created', 'system')),
  severity text not null default 'info'
    check (severity in ('info', 'success', 'warning', 'error')),
  title text not null,
  message text not null,
  order_id uuid references public.orders(id) on delete cascade,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index admin_notifications_order_created_idx
  on public.admin_notifications (order_id, type)
  where order_id is not null and type = 'order_created';
create index admin_notifications_created_at_idx
  on public.admin_notifications (created_at desc);

create table public.admin_notification_reads (
  notification_id uuid not null
    references public.admin_notifications(id) on delete cascade,
  admin_user_id uuid not null
    references public.admin_users(user_id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, admin_user_id)
);

create index admin_notification_reads_admin_user_id_idx
  on public.admin_notification_reads (admin_user_id, read_at desc);

alter table public.admin_notifications enable row level security;
alter table public.admin_notification_reads enable row level security;

create policy "Order admins read notifications"
  on public.admin_notifications for select to authenticated
  using ((select app_private.has_permission('orders')));

create policy "Admins read own notification state"
  on public.admin_notification_reads for select to authenticated
  using (
    (select auth.uid()) = admin_user_id
    and (select app_private.has_permission('orders'))
  );

create policy "Admins mark own notifications read"
  on public.admin_notification_reads for insert to authenticated
  with check (
    (select auth.uid()) = admin_user_id
    and (select app_private.has_permission('orders'))
  );

create policy "Admins clear own notification state"
  on public.admin_notification_reads for delete to authenticated
  using (
    (select auth.uid()) = admin_user_id
    and (select app_private.has_permission('orders'))
  );

revoke all on public.admin_notifications, public.admin_notification_reads
  from public, anon;
grant select on public.admin_notifications to authenticated;
grant select, insert, delete on public.admin_notification_reads to authenticated;
grant all on public.admin_notifications, public.admin_notification_reads to service_role;

create or replace function app_private.create_order_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.admin_notifications (
    type,
    severity,
    title,
    message,
    order_id,
    metadata,
    created_at
  )
  values (
    'order_created',
    'success',
    'New order ' || new.order_number,
    new.customer_name || ' placed an order worth '
      || new.total::text || ' ' || 'INR',
    new.id,
    jsonb_build_object(
      'order_number', new.order_number,
      'customer_name', new.customer_name,
      'customer_email', new.customer_email,
      'total', new.total,
      'currency', 'INR'
    ),
    new.created_at
  )
  on conflict do nothing;

  return new;
end;
$$;

revoke all on function app_private.create_order_notification()
  from public, anon, authenticated;

create trigger orders_create_admin_notification
  after insert on public.orders
  for each row execute function app_private.create_order_notification();

create or replace function app_private.retry_order_notifications()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_count integer;
begin
  if not (select app_private.has_permission('orders')) then
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
      || orders.total::text || ' ' || 'INR',
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

revoke all on function app_private.retry_order_notifications()
  from public, anon;
grant execute on function app_private.retry_order_notifications()
  to authenticated;

create or replace function public.retry_order_notifications()
returns integer
language sql
security invoker
set search_path = ''
as $$
  select app_private.retry_order_notifications();
$$;

revoke all on function public.retry_order_notifications()
  from public, anon;
grant execute on function public.retry_order_notifications()
  to authenticated;

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
    || orders.total::text || ' ' || 'INR',
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

do $$
begin
  alter publication supabase_realtime add table public.admin_notifications;
exception
  when duplicate_object then null;
end;
$$;

commit;
