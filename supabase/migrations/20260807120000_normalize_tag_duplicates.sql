-- Optional one-time cleanup: normalize tag casing and merge case-variant duplicates.
-- Safe to run even if there are no duplicates.
-- Run in Supabase SQL Editor while signed in as the project owner / service role.

-- 1) Lowercase every tag name
update public.tags
set name = lower(trim(name))
where name <> lower(trim(name));

-- 2) For each (user_id, lowercased name) with multiple rows, keep the oldest
--    and repoint note_tags to it, then delete the extras.
with ranked as (
  select
    id,
    user_id,
    name,
    created_at,
    row_number() over (
      partition by user_id, name
      order by created_at asc, id asc
    ) as rn
  from public.tags
),
dupes as (
  select * from ranked where rn > 1
),
keepers as (
  select * from ranked where rn = 1
),
remap as (
  select
    d.id as old_id,
    k.id as new_id
  from dupes d
  join keepers k
    on k.user_id = d.user_id
   and k.name = d.name
)
update public.note_tags nt
set tag_id = remap.new_id
from remap
where nt.tag_id = remap.old_id
  and not exists (
    select 1
    from public.note_tags existing
    where existing.note_id = nt.note_id
      and existing.tag_id = remap.new_id
  );

-- Drop join rows that would collide after remap
with ranked as (
  select
    id,
    user_id,
    name,
    row_number() over (
      partition by user_id, name
      order by created_at asc, id asc
    ) as rn
  from public.tags
),
dupes as (
  select id from ranked where rn > 1
)
delete from public.note_tags nt
using dupes d
where nt.tag_id = d.id;

-- Delete duplicate tag rows
with ranked as (
  select
    id,
    row_number() over (
      partition by user_id, name
      order by created_at asc, id asc
    ) as rn
  from public.tags
)
delete from public.tags t
using ranked r
where t.id = r.id
  and r.rn > 1;
