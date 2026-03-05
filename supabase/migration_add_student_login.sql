-- Migration: Add username + PIN login for students
-- Run this in your Supabase SQL editor after the initial schema.sql

-- Add username and pin columns to students table
alter table public.students add column if not exists username text unique;
alter table public.students add column if not exists pin text;

-- Index for fast username lookup
create index if not exists idx_students_username on public.students(username);
