begin;

drop policy if exists "Public can create orders" on public.orders;

create policy "Public can create orders"
on public.orders
for insert
to public
with check (
  exists (
    select 1
    from public.restaurant_settings
    where ordering_enabled = true
  )
  and exists (
    select 1
    from public.tables as active_table
    where active_table.table_number = orders.table_number
      and active_table.is_active = true
  )
);

drop policy if exists "Public can create staff requests" on public.staff_requests;

create policy "Public can create staff requests"
on public.staff_requests
for insert
to public
with check (
  exists (
    select 1
    from public.restaurant_settings
    where ordering_enabled = true
  )
  and exists (
    select 1
    from public.tables as active_table
    where active_table.table_number = staff_requests.table_number
      and active_table.is_active = true
  )
);

commit;
