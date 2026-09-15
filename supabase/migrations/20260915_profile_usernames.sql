-- User-facing handles for Nova profiles. Run once after the social foundation migration.

create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  requested_username text;
  final_username text;
  final_display_name text;
begin
  requested_username := lower(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    '[^a-z0-9_]', '', 'g'
  ));
  if requested_username !~ '^[a-z0-9_]{3,24}$' then
    requested_username := 'nova_' || left(replace(new.id::text, '-', ''), 6);
  end if;

  final_username := requested_username;
  if exists (select 1 from public.profiles where username = final_username) then
    final_username := left(requested_username, 17) || '_' || left(replace(new.id::text, '-', ''), 6);
  end if;

  final_display_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    final_username
  );

  insert into public.profiles (id, username, display_name)
  values (new.id, final_username, final_display_name)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Replace the old generic label on already-created profiles with their existing handle.
update public.profiles
set display_name = username
where trim(display_name) = 'Nova kullanıcısı';
