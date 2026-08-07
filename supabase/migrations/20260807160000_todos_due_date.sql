-- Add optional day-level due dates to todos
alter table public.todos
  add column if not exists due_date date;

create index if not exists todos_user_id_due_date_idx
  on public.todos (user_id, due_date)
  where done = false;
