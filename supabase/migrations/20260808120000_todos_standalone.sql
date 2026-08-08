-- Allow to-dos without a parent note (standalone quick captures).

alter table public.todos
  alter column note_id drop not null;

-- Insert policy previously required a parent note; allow null note_id for
-- the owning user, or a note the user owns.
drop policy if exists "todos_insert_own" on public.todos;

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
