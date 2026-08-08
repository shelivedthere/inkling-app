-- Inkling initial schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query)
-- or via: supabase db push (if CLI is linked)

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  -- Ordered content blocks: text | sketch | checklist
  -- e.g. [{ "id": "...", "type": "text", "body": "..." }, ...]
  content jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Null = standalone to-do (not attached to a note)
  note_id uuid references public.notes (id) on delete cascade,
  text text not null default '',
  done boolean not null default false,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.note_tags (
  note_id uuid not null references public.notes (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (note_id, tag_id)
);

create table public.todo_tags (
  todo_id uuid not null references public.todos (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (todo_id, tag_id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index notes_user_id_updated_at_idx on public.notes (user_id, updated_at desc);
create index todos_user_id_done_idx on public.todos (user_id, done) where done = false;
create index todos_note_id_idx on public.todos (note_id);
create index tags_user_id_idx on public.tags (user_id);
create index note_tags_tag_id_idx on public.note_tags (tag_id);
create index todo_tags_tag_id_idx on public.todo_tags (tag_id);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger notes_set_updated_at
  before update on public.notes
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.notes enable row level security;
alter table public.todos enable row level security;
alter table public.tags enable row level security;
alter table public.note_tags enable row level security;
alter table public.todo_tags enable row level security;

-- notes
create policy "notes_select_own"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "notes_insert_own"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "notes_update_own"
  on public.notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "notes_delete_own"
  on public.notes for delete
  using (auth.uid() = user_id);

-- todos
create policy "todos_select_own"
  on public.todos for select
  using (auth.uid() = user_id);

create policy "todos_insert_own"
  on public.todos for insert
  with check (
    auth.uid() = user_id
    and (
      note_id is null
      or exists (
        select 1 from public.notes n
        where n.id = note_id and n.user_id = auth.uid()
      )
    )
  );

create policy "todos_update_own"
  on public.todos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "todos_delete_own"
  on public.todos for delete
  using (auth.uid() = user_id);

-- tags
create policy "tags_select_own"
  on public.tags for select
  using (auth.uid() = user_id);

create policy "tags_insert_own"
  on public.tags for insert
  with check (auth.uid() = user_id);

create policy "tags_update_own"
  on public.tags for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "tags_delete_own"
  on public.tags for delete
  using (auth.uid() = user_id);

-- note_tags: access via ownership of the parent note
create policy "note_tags_select_own"
  on public.note_tags for select
  using (
    exists (
      select 1 from public.notes n
      where n.id = note_id and n.user_id = auth.uid()
    )
  );

create policy "note_tags_insert_own"
  on public.note_tags for insert
  with check (
    exists (
      select 1 from public.notes n
      where n.id = note_id and n.user_id = auth.uid()
    )
    and exists (
      select 1 from public.tags t
      where t.id = tag_id and t.user_id = auth.uid()
    )
  );

create policy "note_tags_delete_own"
  on public.note_tags for delete
  using (
    exists (
      select 1 from public.notes n
      where n.id = note_id and n.user_id = auth.uid()
    )
  );

-- todo_tags: access via ownership of the parent to-do
create policy "todo_tags_select_own"
  on public.todo_tags for select
  using (
    exists (
      select 1 from public.todos t
      where t.id = todo_id and t.user_id = auth.uid()
    )
  );

create policy "todo_tags_insert_own"
  on public.todo_tags for insert
  with check (
    exists (
      select 1 from public.todos t
      where t.id = todo_id and t.user_id = auth.uid()
    )
    and exists (
      select 1 from public.tags g
      where g.id = tag_id and g.user_id = auth.uid()
    )
  );

create policy "todo_tags_delete_own"
  on public.todo_tags for delete
  using (
    exists (
      select 1 from public.todos t
      where t.id = todo_id and t.user_id = auth.uid()
    )
  );
