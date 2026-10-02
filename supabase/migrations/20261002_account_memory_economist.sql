-- Additive update for the existing Nova AI application. Run in its Supabase project.
begin;

alter table public.profiles drop constraint if exists profiles_conversation_style_check;
alter table public.profiles add constraint profiles_conversation_style_check
  check (conversation_style in ('dengeli','futbol','basketbol','kitap','girisimci','sakin_koc','ekonomist'));

create table if not exists public.user_memory_settings (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
create table if not exists public.user_memories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slot text not null check (char_length(slot) between 1 and 80),
  category text not null check (char_length(category) between 1 and 30),
  content text not null check (char_length(btrim(content)) between 1 and 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, slot)
);
create index if not exists user_memories_owner_updated on public.user_memories(owner_id, updated_at desc);
alter table public.user_memory_settings enable row level security;
alter table public.user_memories enable row level security;
revoke all on public.user_memory_settings, public.user_memories from anon;
grant select, insert, update, delete on public.user_memory_settings, public.user_memories to authenticated;
drop policy if exists "own memory settings only" on public.user_memory_settings;
create policy "own memory settings only" on public.user_memory_settings for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
drop policy if exists "own memories only" on public.user_memories;
create policy "own memories only" on public.user_memories for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

create or replace function public.limit_account_memories() returns trigger
language plpgsql set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.owner_id::text, 0));
  if not exists (select 1 from public.user_memories where owner_id = new.owner_id and slot = new.slot)
    and (select count(*) from public.user_memories where owner_id = new.owner_id) >= 30 then
    raise exception 'Memory limit reached' using errcode = '23514';
  end if;
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists limit_account_memories on public.user_memories;
create trigger limit_account_memories before insert or update on public.user_memories
  for each row execute function public.limit_account_memories();
drop trigger if exists memory_settings_updated_at on public.user_memory_settings;
create trigger memory_settings_updated_at before update on public.user_memory_settings
  for each row execute function public.set_updated_at();
commit;
