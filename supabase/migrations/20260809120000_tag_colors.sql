-- Curated color key for each tag (see lib/utils/tag-colors.ts).

alter table public.tags
  add column if not exists color text not null default 'teal';
