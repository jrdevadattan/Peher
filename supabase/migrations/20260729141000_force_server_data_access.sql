begin;

-- Browser clients use Supabase Auth and Realtime only. All commerce data access
-- is validated by the application server before the service role reaches SQL.
revoke all privileges on all tables in schema public from anon, authenticated;
revoke execute on all functions in schema public from anon, authenticated;

-- The admin notification channel needs SELECT for authenticated Realtime
-- subscriptions; row-level security still limits it to order administrators.
grant select on public.admin_notifications to authenticated;

grant all privileges on all tables in schema public to service_role;
grant execute on all functions in schema public to service_role;

alter default privileges in schema public
  revoke all privileges on tables from anon, authenticated;
alter default privileges in schema public
  revoke execute on functions from anon, authenticated;
alter default privileges in schema public
  grant all privileges on tables to service_role;
alter default privileges in schema public
  grant execute on functions to service_role;

commit;
