-- Run this in Neon's SQL Editor if your users table already exists
-- without these columns.
alter table users add column if not exists reset_token_hash text;
alter table users add column if not exists reset_token_expires timestamptz;
