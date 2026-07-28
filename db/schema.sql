-- Run this once in your Neon project's Query editor (Vercel dashboard →
-- your project → Storage → your Neon database → Query), or via `psql`
-- using the connection string from the same page.
--
-- Note on security: with Supabase, Row Level Security mattered because
-- Supabase exposes your tables over a public REST API with an anon key
-- anyone can see in the browser. Neon (via this Vercel integration) has
-- no such layer — the only way in is a direct database connection using
-- DATABASE_URL, which lives in your server-side environment variables
-- and is never sent to the browser. That connection string being secret
-- *is* the security boundary here, so RLS isn't needed.

create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  reset_token_hash text,
  reset_token_expires timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  provider text not null check (provider in ('google', 'microsoft', 'imap')),
  email text not null,
  -- Refresh token (Google/Microsoft) or IMAP password — always encrypted
  -- before it lands here, never stored plain.
  secret_encrypted text not null,
  imap_host text,          -- only set when provider = 'imap'
  imap_port integer,       -- only set when provider = 'imap'
  smtp_host text,          -- only set when provider = 'imap' (needed to send)
  smtp_port integer,
  display_name text,               -- used to personalize AI replies
  signature text,
  auto_reply_context text,         -- e.g. "On vacation until Aug 5..."
  auto_reply_enabled boolean not null default false,
  sync_limit integer not null default 15 check (sync_limit between 5 and 30),
  history_id text,         -- Gmail: last processed historyId
  delta_link text,         -- Outlook: last processed delta link
  created_at timestamptz not null default now(),
  unique (provider, email)
);

create table if not exists rules (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  field text not null check (field in ('sender_domain', 'sender_address', 'subject_keyword')),
  pattern text not null,
  classification text not null check (classification in ('urgent', 'routine', 'noise')),
  created_at timestamptz not null default now()
);

create table if not exists auto_reply_rules (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  field text not null check (field in ('sender_domain', 'sender_address', 'subject_keyword')),
  pattern text not null,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  provider_message_id text not null,
  message_id_header text,   -- the email's actual Message-ID, for reply threading
  from_address text,
  subject text,
  body_text text,           -- full plain-text body, needed for AI replies
  classification text not null check (classification in ('urgent', 'routine', 'noise')),
  classified_by text not null check (classified_by in ('rule', 'llm')),
  -- Workflow status, separate from priority classification above.
  -- 'needs_reply' is the default for anything not classified as noise;
  -- flips to 'follow_up' once you've replied (meaning: sent, now
  -- watching for their response); 'done' means no action needed.
  status text not null default 'needs_reply' check (status in ('needs_reply', 'follow_up', 'done')),
  replied_at timestamptz,
  created_at timestamptz not null default now(),
  unique (account_id, provider_message_id)
);

create index if not exists messages_account_created_idx
  on messages (account_id, created_at desc);
