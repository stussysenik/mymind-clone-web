-- Create a storage bucket for 'images'
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'images' );

create policy "Authenticated Export"
  on storage.objects for insert
  with check ( bucket_id = 'images' and auth.role() = 'authenticated' );
