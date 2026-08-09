-- Records a user's one-time acceptance of the "before you upload" terms.
-- Run this in the Supabase Dashboard -> SQL Editor.

create table public.user_agreements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  agreed_at timestamptz not null default now()
);

alter table public.user_agreements enable row level security;

create policy "Users can view their own agreement"
  on public.user_agreements for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can record their own agreement"
  on public.user_agreements for insert
  to authenticated
  with check (auth.uid() = user_id);
