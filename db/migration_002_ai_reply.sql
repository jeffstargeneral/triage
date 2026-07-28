-- Run this in Neon's SQL Editor (or the Storage tab's Query tab) — it's
-- additive, safe to run even if you already have accounts/messages data.

-- SMTP is required to actually send replies — IMAP is read-only.
-- Defaults follow the common "imap.x → smtp.x" convention; editable per
-- account since not every host follows that pattern (cPanel hosts often
-- use the same hostname for both).
alter table accounts add column if not exists smtp_host text;
alter table accounts add column if not exists smtp_port integer;

-- Used to personalize AI-generated replies.
alter table accounts add column if not exists display_name text;
alter table accounts add column if not exists signature text;

-- Out-of-office / auto-reply context, e.g. "On vacation until Aug 5,
-- for urgent matters contact james@company.com instead."
alter table accounts add column if not exists auto_reply_context text;
alter table accounts add column if not exists auto_reply_enabled boolean not null default false;

-- Full message content, needed to generate a real contextual reply —
-- headers alone (from/subject) aren't enough for a good draft.
alter table messages add column if not exists body_text text;
alter table messages add column if not exists message_id_header text;
alter table messages add column if not exists replied_at timestamptz;

create table if not exists auto_reply_rules (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  field text not null check (field in ('sender_domain', 'sender_address', 'subject_keyword')),
  pattern text not null,
  created_at timestamptz not null default now()
);
