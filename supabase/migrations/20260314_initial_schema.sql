-- ============================================================
-- CV Builder – Initial Schema
-- Created: 2026-03-14
-- Order: profiles → coach_links → cvs → cv_* → cv_comments → triggers
-- ============================================================

-- ─── PROFILES ────────────────────────────────────────────────

create table if not exists profiles (
  id           uuid references auth.users on delete cascade primary key,
  role         text not null default 'user' check (role in ('user', 'coach', 'admin')),
  full_name    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- ─── COACH_LINKS (must exist before cvs RLS policies) ────────

create table if not exists coach_links (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references profiles(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (coach_id, user_id)
);

alter table coach_links enable row level security;

create policy "Coaches can read own links"
  on coach_links for select
  using (auth.uid() = coach_id);

create policy "Coaches can create links"
  on coach_links for insert
  with check (auth.uid() = coach_id);

create policy "Coaches can delete own links"
  on coach_links for delete
  using (auth.uid() = coach_id);

create policy "Users can read links where they are the participant"
  on coach_links for select
  using (auth.uid() = user_id);

-- ─── CVS ─────────────────────────────────────────────────────

create table if not exists cvs (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles(id) on delete cascade,
  title             text not null default 'Mitt CV',
  language          text not null default 'sv' check (language in ('sv', 'en')),
  layout            int  not null default 1 check (layout in (1, 2, 3)),
  accent_color      text not null default '#000000',
  status            text not null default 'draft' check (status in ('draft', 'complete')),
  has_been_exported boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  updated_by        uuid references profiles(id)
);

alter table cvs enable row level security;

create policy "Users can read own CVs"
  on cvs for select
  using (auth.uid() = user_id);

create policy "Users can insert own CVs"
  on cvs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own CVs"
  on cvs for update
  using (auth.uid() = user_id);

create policy "Users can delete own CVs"
  on cvs for delete
  using (auth.uid() = user_id);

create policy "Coaches can read linked participant CVs"
  on cvs for select
  using (
    exists (
      select 1 from coach_links
      where coach_links.coach_id = auth.uid()
        and coach_links.user_id = cvs.user_id
    )
  );

create policy "Coaches can update linked participant CVs"
  on cvs for update
  using (
    exists (
      select 1 from coach_links
      where coach_links.coach_id = auth.uid()
        and coach_links.user_id = cvs.user_id
    )
  );

-- ─── CV_PERSONAL_INFO ────────────────────────────────────────

create table if not exists cv_personal_info (
  cv_id            uuid references cvs(id) on delete cascade primary key,
  first_name       text,
  last_name        text,
  headline         text,
  phone            text,
  email            text,
  city             text,
  region           text,
  linkedin_url     text,
  github_url       text,
  portfolio_url    text,
  other_url        text,
  driving_license  text,
  photo_url        text
);

alter table cv_personal_info enable row level security;

create policy "Users can manage own personal info"
  on cv_personal_info for all
  using (
    exists (select 1 from cvs where cvs.id = cv_id and cvs.user_id = auth.uid())
  );

create policy "Coaches can read linked participant personal info"
  on cv_personal_info for select
  using (
    exists (
      select 1 from cvs
      join coach_links on coach_links.user_id = cvs.user_id
      where cvs.id = cv_id and coach_links.coach_id = auth.uid()
    )
  );

create policy "Coaches can update linked participant personal info"
  on cv_personal_info for update
  using (
    exists (
      select 1 from cvs
      join coach_links on coach_links.user_id = cvs.user_id
      where cvs.id = cv_id and coach_links.coach_id = auth.uid()
    )
  );

-- ─── CV_PROFILE ──────────────────────────────────────────────

create table if not exists cv_profile (
  cv_id    uuid references cvs(id) on delete cascade primary key,
  summary  text
);

alter table cv_profile enable row level security;

create policy "Users can manage own profile text"
  on cv_profile for all
  using (
    exists (select 1 from cvs where cvs.id = cv_id and cvs.user_id = auth.uid())
  );

create policy "Coaches can read linked participant profile text"
  on cv_profile for select
  using (
    exists (
      select 1 from cvs
      join coach_links on coach_links.user_id = cvs.user_id
      where cvs.id = cv_id and coach_links.coach_id = auth.uid()
    )
  );

create policy "Coaches can update linked participant profile text"
  on cv_profile for update
  using (
    exists (
      select 1 from cvs
      join coach_links on coach_links.user_id = cvs.user_id
      where cvs.id = cv_id and coach_links.coach_id = auth.uid()
    )
  );

-- ─── CV_EXPERIENCES ──────────────────────────────────────────

create table if not exists cv_experiences (
  id           uuid primary key default gen_random_uuid(),
  cv_id        uuid not null references cvs(id) on delete cascade,
  job_title    text,
  employer     text,
  city         text,
  country      text,
  start_month  int,
  start_year   int,
  end_month    int,
  end_year     int,
  is_current   boolean not null default false,
  description  text,
  type         text check (type in ('job', 'internship', 'summer', 'volunteer')),
  sort_order   int not null default 0
);

alter table cv_experiences enable row level security;

create policy "Users can manage own experiences"
  on cv_experiences for all
  using (
    exists (select 1 from cvs where cvs.id = cv_id and cvs.user_id = auth.uid())
  );

create policy "Coaches can read linked participant experiences"
  on cv_experiences for select
  using (
    exists (
      select 1 from cvs
      join coach_links on coach_links.user_id = cvs.user_id
      where cvs.id = cv_id and coach_links.coach_id = auth.uid()
    )
  );

create policy "Coaches can update linked participant experiences"
  on cv_experiences for update
  using (
    exists (
      select 1 from cvs
      join coach_links on coach_links.user_id = cvs.user_id
      where cvs.id = cv_id and coach_links.coach_id = auth.uid()
    )
  );

-- ─── CV_EDUCATIONS ───────────────────────────────────────────

create table if not exists cv_educations (
  id           uuid primary key default gen_random_uuid(),
  cv_id        uuid not null references cvs(id) on delete cascade,
  institution  text,
  program      text,
  level        text check (level in ('gymnasium', 'yh', 'hogskola', 'kurs', 'annat')),
  start_year   int,
  end_year     int,
  is_current   boolean not null default false,
  description  text,
  sort_order   int not null default 0
);

alter table cv_educations enable row level security;

create policy "Users can manage own educations"
  on cv_educations for all
  using (
    exists (select 1 from cvs where cvs.id = cv_id and cvs.user_id = auth.uid())
  );

create policy "Coaches can read linked participant educations"
  on cv_educations for select
  using (
    exists (
      select 1 from cvs
      join coach_links on coach_links.user_id = cvs.user_id
      where cvs.id = cv_id and coach_links.coach_id = auth.uid()
    )
  );

create policy "Coaches can update linked participant educations"
  on cv_educations for update
  using (
    exists (
      select 1 from cvs
      join coach_links on coach_links.user_id = cvs.user_id
      where cvs.id = cv_id and coach_links.coach_id = auth.uid()
    )
  );

-- ─── CV_SKILLS ───────────────────────────────────────────────

create table if not exists cv_skills (
  id          uuid primary key default gen_random_uuid(),
  cv_id       uuid not null references cvs(id) on delete cascade,
  category    text check (category in ('technical', 'language', 'other')),
  name        text,
  level       int check (level between 1 and 5),
  sort_order  int not null default 0
);

alter table cv_skills enable row level security;

create policy "Users can manage own skills"
  on cv_skills for all
  using (
    exists (select 1 from cvs where cvs.id = cv_id and cvs.user_id = auth.uid())
  );

create policy "Coaches can read linked participant skills"
  on cv_skills for select
  using (
    exists (
      select 1 from cvs
      join coach_links on coach_links.user_id = cvs.user_id
      where cvs.id = cv_id and coach_links.coach_id = auth.uid()
    )
  );

create policy "Coaches can update linked participant skills"
  on cv_skills for update
  using (
    exists (
      select 1 from cvs
      join coach_links on coach_links.user_id = cvs.user_id
      where cvs.id = cv_id and coach_links.coach_id = auth.uid()
    )
  );

-- ─── CV_LANGUAGES ────────────────────────────────────────────

create table if not exists cv_languages (
  id          uuid primary key default gen_random_uuid(),
  cv_id       uuid not null references cvs(id) on delete cascade,
  language    text,
  level       text check (level in ('native', 'fluent', 'good', 'basic')),
  sort_order  int not null default 0
);

alter table cv_languages enable row level security;

create policy "Users can manage own languages"
  on cv_languages for all
  using (
    exists (select 1 from cvs where cvs.id = cv_id and cvs.user_id = auth.uid())
  );

create policy "Coaches can read linked participant languages"
  on cv_languages for select
  using (
    exists (
      select 1 from cvs
      join coach_links on coach_links.user_id = cvs.user_id
      where cvs.id = cv_id and coach_links.coach_id = auth.uid()
    )
  );

create policy "Coaches can update linked participant languages"
  on cv_languages for update
  using (
    exists (
      select 1 from cvs
      join coach_links on coach_links.user_id = cvs.user_id
      where cvs.id = cv_id and coach_links.coach_id = auth.uid()
    )
  );

-- ─── CV_HOBBIES ──────────────────────────────────────────────

create table if not exists cv_hobbies (
  cv_id  uuid references cvs(id) on delete cascade primary key,
  text   text
);

alter table cv_hobbies enable row level security;

create policy "Users can manage own hobbies"
  on cv_hobbies for all
  using (
    exists (select 1 from cvs where cvs.id = cv_id and cvs.user_id = auth.uid())
  );

create policy "Coaches can read linked participant hobbies"
  on cv_hobbies for select
  using (
    exists (
      select 1 from cvs
      join coach_links on coach_links.user_id = cvs.user_id
      where cvs.id = cv_id and coach_links.coach_id = auth.uid()
    )
  );

create policy "Coaches can update linked participant hobbies"
  on cv_hobbies for update
  using (
    exists (
      select 1 from cvs
      join coach_links on coach_links.user_id = cvs.user_id
      where cvs.id = cv_id and coach_links.coach_id = auth.uid()
    )
  );

-- ─── CV_VOLUNTEERING ─────────────────────────────────────────

create table if not exists cv_volunteering (
  id            uuid primary key default gen_random_uuid(),
  cv_id         uuid not null references cvs(id) on delete cascade,
  role          text,
  organisation  text,
  start_year    int,
  end_year      int,
  is_current    boolean not null default false,
  description   text,
  sort_order    int not null default 0
);

alter table cv_volunteering enable row level security;

create policy "Users can manage own volunteering"
  on cv_volunteering for all
  using (
    exists (select 1 from cvs where cvs.id = cv_id and cvs.user_id = auth.uid())
  );

create policy "Coaches can read linked participant volunteering"
  on cv_volunteering for select
  using (
    exists (
      select 1 from cvs
      join coach_links on coach_links.user_id = cvs.user_id
      where cvs.id = cv_id and coach_links.coach_id = auth.uid()
    )
  );

create policy "Coaches can update linked participant volunteering"
  on cv_volunteering for update
  using (
    exists (
      select 1 from cvs
      join coach_links on coach_links.user_id = cvs.user_id
      where cvs.id = cv_id and coach_links.coach_id = auth.uid()
    )
  );

-- ─── CV_OTHER ────────────────────────────────────────────────

create table if not exists cv_other (
  id          uuid primary key default gen_random_uuid(),
  cv_id       uuid not null references cvs(id) on delete cascade,
  label       text,
  text        text,
  sort_order  int not null default 0
);

alter table cv_other enable row level security;

create policy "Users can manage own other sections"
  on cv_other for all
  using (
    exists (select 1 from cvs where cvs.id = cv_id and cvs.user_id = auth.uid())
  );

create policy "Coaches can read linked participant other sections"
  on cv_other for select
  using (
    exists (
      select 1 from cvs
      join coach_links on coach_links.user_id = cvs.user_id
      where cvs.id = cv_id and coach_links.coach_id = auth.uid()
    )
  );

create policy "Coaches can update linked participant other sections"
  on cv_other for update
  using (
    exists (
      select 1 from cvs
      join coach_links on coach_links.user_id = cvs.user_id
      where cvs.id = cv_id and coach_links.coach_id = auth.uid()
    )
  );

-- ─── CV_COMMENTS ─────────────────────────────────────────────

create table if not exists cv_comments (
  id            uuid primary key default gen_random_uuid(),
  cv_id         uuid not null references cvs(id) on delete cascade,
  coach_id      uuid not null references profiles(id),
  section_type  text not null,
  item_id       uuid,
  comment       text not null,
  is_resolved   boolean not null default false,
  resolved_at   timestamptz,
  created_at    timestamptz not null default now()
);

alter table cv_comments enable row level security;

create policy "Coaches can manage own comments"
  on cv_comments for all
  using (auth.uid() = coach_id);

create policy "Users can read comments on own CVs"
  on cv_comments for select
  using (
    exists (select 1 from cvs where cvs.id = cv_id and cvs.user_id = auth.uid())
  );

create policy "Users can resolve comments on own CVs"
  on cv_comments for update
  using (
    exists (select 1 from cvs where cvs.id = cv_id and cvs.user_id = auth.uid())
  );

-- ─── TRIGGER: auto-create profile on signup ──────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── TRIGGER: auto-update updated_at ─────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on profiles
  for each row execute procedure public.set_updated_at();

create trigger set_cvs_updated_at
  before update on cvs
  for each row execute procedure public.set_updated_at();
