-- Nova AI social foundation. Run once in Supabase SQL Editor.
-- Chats are never copied here automatically. A user explicitly creates each post.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null check (char_length(display_name) between 2 and 60),
  bio text not null default '' check (char_length(bio) <= 180),
  avatar_url text,
  interests text[] not null default '{}',
  conversation_style text not null default 'dengeli' check (conversation_style in ('dengeli', 'futbol', 'basketbol', 'kitap', 'girisimci', 'sakin_koc')),
  profile_visibility text not null default 'public' check (profile_visibility in ('public', 'followers', 'private')),
  show_activity boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1800),
  visibility text not null default 'public' check (visibility in ('public', 'followers', 'private')),
  shared_from_chat boolean not null default false,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('spam', 'taciz', 'uygunsuz', 'diger')),
  details text not null default '' check (char_length(details) <= 500),
  created_at timestamptz not null default now(),
  check (post_id is not null or reported_user_id is not null)
);

create index if not exists posts_explore_index on public.posts (published_at desc) where visibility = 'public';
create index if not exists posts_author_index on public.posts (author_id, published_at desc);
create index if not exists follows_following_index on public.follows (following_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at before update on public.posts for each row execute function public.set_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare base_username text;
begin
  base_username := lower(regexp_replace(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)), '[^a-z0-9_]', '', 'g'));
  if char_length(base_username) < 3 then base_username := 'nova'; end if;
  insert into public.profiles (id, username, display_name)
  values (new.id, left(base_username, 17) || '_' || left(replace(new.id::text, '-', ''), 6), coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'Nova kullanıcısı'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists create_profile_after_signup on auth.users;
create trigger create_profile_after_signup after insert on auth.users for each row execute function public.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.follows enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.user_blocks enable row level security;
alter table public.reports enable row level security;

create policy "profiles are visible by profile preference" on public.profiles for select using (
  id = auth.uid() or profile_visibility = 'public' or
  (profile_visibility = 'followers' and exists (select 1 from public.follows where follower_id = auth.uid() and following_id = profiles.id))
);
create policy "users update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "follow graph is readable" on public.follows for select using (true);
create policy "users create own follows" on public.follows for insert with check (follower_id = auth.uid());
create policy "users delete own follows" on public.follows for delete using (follower_id = auth.uid());

create policy "posts follow visibility" on public.posts for select using (
  visibility = 'public' or author_id = auth.uid() or
  (visibility = 'followers' and exists (select 1 from public.follows where follower_id = auth.uid() and following_id = posts.author_id))
);
create policy "users publish own posts" on public.posts for insert with check (author_id = auth.uid());
create policy "users update own posts" on public.posts for update using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "users delete own posts" on public.posts for delete using (author_id = auth.uid());

create policy "likes are readable" on public.post_likes for select using (true);
create policy "users manage own likes" on public.post_likes for insert with check (user_id = auth.uid());
create policy "users remove own likes" on public.post_likes for delete using (user_id = auth.uid());

create policy "users manage own blocks" on public.user_blocks for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());
create policy "users submit reports" on public.reports for insert with check (reporter_id = auth.uid());
create policy "users read own reports" on public.reports for select using (reporter_id = auth.uid());
