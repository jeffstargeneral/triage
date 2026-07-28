-- Run this in Neon's SQL Editor. This is the fix for the biggest gap in
-- the app so far: there was no concept of "who is logged in" — every
-- page showed every connected mailbox to every visitor. This adds real
-- user accounts and ties each connected mailbox to the person who
-- connected it.

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

alter table accounts add column if not exists user_id uuid references users(id) on delete cascade;

-- IMPORTANT — existing connected mailboxes (from before this migration)
-- have no owner yet. If you already connected a real inbox for testing:
-- 1. Run this migration.
-- 2. Sign up for a real account at /signup.
-- 3. Run this, replacing the email with the one you just signed up with,
--    to claim your existing connected mailbox(es):
--
--    UPDATE accounts SET user_id = (SELECT id FROM users WHERE email = 'you@example.com')
--    WHERE user_id IS NULL;
--
-- After that, make user_id required going forward:
-- alter table accounts alter column user_id set not null;
-- (left optional for now so this migration doesn't break on existing rows)
