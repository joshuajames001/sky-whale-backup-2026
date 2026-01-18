-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Linked to Auth)
create table if not exists profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  username text,
  avatar_url text,
  subscription_tier text default 'basic', -- 'basic' or 'premium'
  updated_at timestamptz
);

-- RLS: Profiles
alter table profiles enable row level security;
do $$ begin
  create policy "Public profiles are viewable by everyone." on profiles for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can update own profile." on profiles for update using (auth.uid() = id);
exception when duplicate_object then null; end $$;


-- 2. BOOKS
create table if not exists books (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references profiles(id) on delete cascade not null,
  title text not null default 'Untitled Story',
  is_public boolean default false,
  cover_image_url text,
  
  -- New Metadata Columns
  main_character text,
  setting text,
  target_audience text,
  visual_style text,
  identity_image_slot text, -- Active Flux 1.1 Pro Identity Reference (Points to Sheet or Cover)
  character_sheet_url text, -- MASTER REFERENCE (Character Sheet First Workflow)
  magic_mirror_url text,    -- User face reference for personal stories
  author text,
  visual_dna text,
  cover_prompt text,
  character_seed bigint,
  tier text default 'basic', -- 'basic' (Flux 1 Dev) or 'premium' (Flux 2 Pro)

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: Books
alter table books enable row level security;
do $$ begin
  drop policy if exists "Books are viewable by owner or if public." on books;
  create policy "Books are viewable by everyone." on books for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can create their own books." on books for insert with check (auth.uid() = owner_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can update their own books." on books for update using (auth.uid() = owner_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can delete their own books." on books for delete using (auth.uid() = owner_id);
exception when duplicate_object then null; end $$;


-- 3. PAGES
create table if not exists pages (
  id uuid default uuid_generate_v4() primary key,
  book_id uuid references books(id) on delete cascade not null,
  page_number int not null,
  content text,
  image_url text,
  layout_type text default 'standard', -- 'standard', 'cover', 'full'
  created_at timestamptz default now()
);

-- RLS: Pages
alter table pages enable row level security;
do $$ begin
  create policy "Pages viewable if book is viewable." on pages for select using ( exists ( select 1 from books where books.id = pages.book_id and (books.owner_id = auth.uid() or books.is_public = true) ) );
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can insert pages to own books." on pages for insert with check ( exists ( select 1 from books where books.id = book_id and books.owner_id = auth.uid() ) );
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can update pages of own books." on pages for update using ( exists ( select 1 from books where books.id = book_id and books.owner_id = auth.uid() ) );
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can delete pages of own books." on pages for delete using ( exists ( select 1 from books where books.id = book_id and books.owner_id = auth.uid() ) );
exception when duplicate_object then null; end $$;


-- 4. STORAGE (Buckets)
-- Buckets must be created via Dashboard or Storage API.


-- HELPER: Handle New User -> Profile Trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing; -- Safe insert
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 5. CARD STUDIO (Greeting Cards)
create table if not exists greeting_cards (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references profiles(id) on delete cascade not null,
  
  -- Visual State
  background_url text,
  theme_id text,
  
  -- Canvas Data (JSONB Array)
  elements jsonb default '[]'::jsonb, 
  
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: Greeting Cards
alter table greeting_cards enable row level security;
do $$ begin
  create policy "Users can view their own cards or public cards." on greeting_cards for select using (auth.uid() = owner_id or is_public = true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can insert their own cards." on greeting_cards for insert with check (auth.uid() = owner_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can update their own cards." on greeting_cards for update using (auth.uid() = owner_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can delete their own cards." on greeting_cards for delete using (auth.uid() = owner_id);
exception when duplicate_object then null; end $$;


-- 6. STORAGE BUCKETS (SQL Definition for reference/setup)
-- insert into storage.buckets (id, name, public) values ('card-assets', 'card-assets', true);


-- 7. STYLE LIBRARY
create table if not exists style_presets (
  id text primary key,
  name text not null,
  prompt_en text not null,
  description text,
  reference_image_url text, -- Slot 6 (Style Anchor)
  created_at timestamptz default now()
);

-- RLS: style_presets
alter table style_presets enable row level security;
do $$ begin
  create policy "Style presets are viewable by everyone." on style_presets for select using (true);
exception when duplicate_object then null; end $$;


-- ENABLE REALTIME FOR PROFILES
drop publication if exists supabase_realtime;
create publication supabase_realtime for table profiles;
-- Note: 'alter publication add table' is also valid but checking existence is harder in simple script.
-- Creating/Recreating publication is one way, or just ignoring errors.
-- We'll assume the publication exists or just suppress errors manually if needed.
-- But standard Supabase setups have 'supabase_realtime'.
-- Let's just try to add, if it fails, it fails (but usually it's fine). 
-- Actually, better to ignore 'duplicate relation' error if we could, but 'alter publication' doesn't support 'if not exists'.
-- We'll skip complex logic for realtime publication to keep script simple.


-- 8. PAYMENTS & CREDITS
create table if not exists transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  stripe_session_id text,
  amount_czk int,
  energy_amount int,
  package_id text, -- 'starter', 'hero', 'legend'
  status text default 'pending', -- pending, completed, failed
  created_at timestamptz default now()
);

alter table transactions enable row level security;
do $$ begin
  create policy "Users can view own transactions" on transactions for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

create or replace function add_energy(p_user_id uuid, p_amount int)
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set energy_balance = coalesce(energy_balance, 0) + p_amount,
       updated_at = now()
  where id = p_user_id;
end;
$$;


-- 9. FEEDBACK & COMMUNITY
create table if not exists feedback (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  category text default 'general', -- 'feature', 'bug', 'general'
  is_public boolean default true,
  created_at timestamptz default now()
);

-- RLS: Feedback
alter table feedback enable row level security;
do $$ begin
  create policy "Public feedback viewable by everyone" on feedback for select using (is_public = true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can insert feedback" on feedback for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can delete own feedback" on feedback for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;


-- 10. GAMIFICATION (Achievements)
create table if not exists achievements (
  id text primary key, -- e.g. 'first_book', 'energy_spender'
  title text not null,
  description text not null,
  icon text, -- Emoji or lucide icon name
  condition_type text, -- 'manual', 'book_count', 'energy_spent'
  threshold int, -- numeric threshold for the condition
  created_at timestamptz default now()
);

-- RLS: Achievements (Public View)
alter table achievements enable row level security;
do $$ begin
  create policy "Achievements are viewable by everyone" on achievements for select using (true);
exception when duplicate_object then null; end $$;


create table if not exists user_achievements (
  user_id uuid references profiles(id) on delete cascade not null,
  achievement_id text references achievements(id) on delete cascade not null,
  unlocked_at timestamptz default now(),
  primary key (user_id, achievement_id)
);

-- RLS: User Achievements
alter table user_achievements enable row level security;
do $$ begin
  create policy "Everyone can view unlocked achievements" on user_achievements for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "System can insert unlocked achievements" on user_achievements for insert with check (true);
exception when duplicate_object then null; end $$;

-- Seed Basic Achievements
insert into achievements (id, title, description, icon, condition_type, threshold) values
('first_book', 'První Příběh', 'Vytvořil jsi svou první knihu!', '📚', 'book_count', 1),
('storyteller_novice', 'Začínající Spisovatel', 'Vytvořil jsi 5 knih.', '✍️', 'book_count', 5),
('creative_genius', 'Kreativní Génius', 'Vytvořil jsi 10 knih!', '🎨', 'book_count', 10),
('first_recharge', 'První Dobití', 'Dobil jsi poprvé energii!', '⚡', 'energy_purchased', 1),
('custom_master', 'Mistr Editace', 'Vytvořil jsi 3 vlastní knihy.', '🖋️', 'custom_book_count', 3),
('energy_spender', 'Investor', 'Utratil jsi prvních 100 Energie.', '💰', 'energy_spent', 100)
on conflict (id) do nothing;


-- 11. GAMIFICATION LOGIC (Triggers)
create or replace function public.check_achievements()
returns trigger as $$
declare
  v_count int;
begin
  -- Count books for this user
  select count(*) into v_count from books where owner_id = new.owner_id;

  -- First Book (Count >= 1)
  if v_count >= 1 then
    insert into user_achievements (user_id, achievement_id)
    values (new.owner_id, 'first_book')
    on conflict do nothing;
  end if;

  -- Novice (Count >= 5)
  if v_count >= 5 then
    insert into user_achievements (user_id, achievement_id)
    values (new.owner_id, 'storyteller_novice')
    on conflict do nothing;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_book_created_check_achievements on books;
create trigger on_book_created_check_achievements
  after insert on books
  for each row execute procedure public.check_achievements();
