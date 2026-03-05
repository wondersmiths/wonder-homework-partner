-- Wonder Mentorship Database Schema
-- Run this in your Supabase SQL editor to set up the database.

-- Profiles table: extends Supabase auth.users
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null check (role in ('parent', 'student')),
  full_name text not null,
  created_at timestamptz default now()
);

-- Students table: child profiles created by parents
create table public.students (
  id uuid default gen_random_uuid() primary key,
  parent_id uuid references public.profiles(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null unique,
  name text not null,
  grade_level int not null check (grade_level between 3 and 8),
  join_code text unique not null,
  created_at timestamptz default now()
);

-- Grading sessions: each homework submission
create table public.grading_sessions (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students(id) on delete cascade not null,
  input_mode text not null check (input_mode in ('text', 'photo')),
  problems_text text,
  overall_score text,
  encouragement text,
  total_problems int default 0,
  correct_count int default 0,
  created_at timestamptz default now()
);

-- Grading results: individual problem results
create table public.grading_results (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.grading_sessions(id) on delete cascade not null,
  problem text not null,
  student_answer text,
  correct_answer text,
  score int not null check (score in (0, 1)),
  explanation text,
  hint text
);

-- Practice sessions: each practice generation
create table public.practice_sessions (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students(id) on delete cascade not null,
  topics text[] not null,
  problem_count int default 0,
  created_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.grading_sessions enable row level security;
alter table public.grading_results enable row level security;
alter table public.practice_sessions enable row level security;

-- Profiles: users can read/update their own profile
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Students: parents can manage their children, students can view themselves
create policy "Parents can view their children"
  on public.students for select using (
    parent_id = auth.uid() or user_id = auth.uid()
  );

create policy "Parents can create children"
  on public.students for insert with check (parent_id = auth.uid());

create policy "Parents can update their children"
  on public.students for update using (parent_id = auth.uid());

create policy "Parents can delete their children"
  on public.students for delete using (parent_id = auth.uid());

-- Allow students to read any student row by join_code (for linking)
create policy "Anyone can find student by join code"
  on public.students for select using (true);

-- Allow students to claim their profile via join code
create policy "Students can link themselves"
  on public.students for update using (
    user_id is null and exists (
      select 1 from public.profiles where id = auth.uid() and role = 'student'
    )
  );

-- Grading sessions: accessible by the student or their parent
create policy "Students and parents can view grading sessions"
  on public.grading_sessions for select using (
    student_id in (
      select id from public.students
      where user_id = auth.uid() or parent_id = auth.uid()
    )
  );

create policy "Students can create grading sessions"
  on public.grading_sessions for insert with check (
    student_id in (
      select id from public.students where user_id = auth.uid()
    )
  );

-- Grading results: accessible via session ownership
create policy "Users can view grading results"
  on public.grading_results for select using (
    session_id in (
      select gs.id from public.grading_sessions gs
      join public.students s on gs.student_id = s.id
      where s.user_id = auth.uid() or s.parent_id = auth.uid()
    )
  );

create policy "Students can create grading results"
  on public.grading_results for insert with check (
    session_id in (
      select gs.id from public.grading_sessions gs
      join public.students s on gs.student_id = s.id
      where s.user_id = auth.uid()
    )
  );

-- Practice sessions: accessible by student or parent
create policy "Users can view practice sessions"
  on public.practice_sessions for select using (
    student_id in (
      select id from public.students
      where user_id = auth.uid() or parent_id = auth.uid()
    )
  );

create policy "Students can create practice sessions"
  on public.practice_sessions for insert with check (
    student_id in (
      select id from public.students where user_id = auth.uid()
    )
  );

-- Helper function to generate a 6-character join code
create or replace function generate_join_code()
returns text as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text := '';
  i int;
begin
  for i in 1..6 loop
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return code;
end;
$$ language plpgsql;
