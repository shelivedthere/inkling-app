-- Associate note checklist items with a specific checklist content block
-- so a note can have multiple independent checklists.

alter table public.todos
  add column if not exists checklist_block_id text;

create index if not exists todos_checklist_block_id_idx
  on public.todos (checklist_block_id)
  where checklist_block_id is not null;
