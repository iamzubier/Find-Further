create extension if not exists pg_cron;
create extension if not exists pg_net;

create schema if not exists private;

create table if not exists private.cron_config (
  key text primary key,
  value text not null
);
revoke all on private.cron_config from public, anon, authenticated;

insert into private.cron_config (key, value)
values ('refresh_key', gen_random_uuid()::text)
on conflict (key) do nothing;

create or replace function private.run_daily_refresh()
returns void
language plpgsql
security definer
set search_path = private
as $$
declare
  v_key text;
begin
  select value into v_key from private.cron_config where key = 'refresh_key';
  perform net.http_post(
    url := 'https://beyondborder.lovable.app/api/public/refresh-data',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-refresh-key', v_key),
    body := '{}'::jsonb
  );
end;
$$;

select cron.schedule('daily-data-refresh', '15 3 * * *', $$select private.run_daily_refresh()$$);