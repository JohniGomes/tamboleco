-- Gera atividade real (escrita) no banco para o projeto gratuito nao ser pausado por inatividade.
-- Chamada diariamente pelo Vercel Cron (/api/keep-alive) e a cada 8h pelo GitHub Actions.

create table if not exists public.keep_alive (
  id int primary key default 1,
  last_ping timestamptz not null default now(),
  pings bigint not null default 0,
  constraint keep_alive_single_row check (id = 1)
);

insert into public.keep_alive (id) values (1) on conflict (id) do nothing;

alter table public.keep_alive enable row level security;

create or replace function public.keep_alive_ping()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  ts timestamptz;
begin
  update public.keep_alive
     set last_ping = now(), pings = pings + 1
   where id = 1
  returning last_ping into ts;
  return ts;
end;
$$;

revoke all on function public.keep_alive_ping() from public;
grant execute on function public.keep_alive_ping() to anon, authenticated;
