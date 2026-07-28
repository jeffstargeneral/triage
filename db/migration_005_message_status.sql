-- Run in Neon's SQL Editor if messages already exists without this.
alter table messages add column if not exists status text not null default 'needs_reply'
  check (status in ('needs_reply', 'follow_up', 'done'));

-- Anything already classified as noise doesn't need a "needs reply" flag.
update messages set status = 'done' where classification = 'noise' and status = 'needs_reply';

-- Anything already replied to should show as follow_up, not needs_reply.
update messages set status = 'follow_up' where replied_at is not null and status = 'needs_reply';
