-- Tags for standalone to-dos (shares the same tags pool as notes).

create table public.todo_tags (
  todo_id uuid not null references public.todos (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (todo_id, tag_id)
);

create index todo_tags_tag_id_idx on public.todo_tags (tag_id);

alter table public.todo_tags enable row level security;

-- Access via ownership of the parent to-do (and tag on insert).
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
