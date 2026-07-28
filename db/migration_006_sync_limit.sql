-- Run in Neon's SQL Editor if accounts already exists without this.
alter table accounts add column if not exists sync_limit integer not null default 15
  check (sync_limit between 5 and 30);
