# Order Items Insert Security Review

## Scope

This review records the existing `order_items` write path and options for a later hardening phase. It does not change policies, grants, application behavior, or database objects.

## Current Policy

The canonical RLS policy currently allows any role covered by `PUBLIC`, including `anon` and `authenticated`, to pass the policy check for an `order_items` insert. The caller must also have the separate PostgreSQL table-level INSERT privilege:

```sql
create policy "Public can create order items"
on public.order_items for insert
with check (true);
```

This policy does not verify that the caller created the parent order, that the parent order belongs to an active table, or that item names, quantities, and prices match current menu data. Foreign keys ensure that referenced order and menu item IDs exist, but they do not establish caller ownership or validate commercial values.

## Current Server Action Path

`createOrderAction()` runs on the Next.js server and reads restaurant settings and menu rows through the SSR Supabase client. It reconstructs item names and prices from database menu rows instead of trusting cart prices.

For mutations, the action uses:

1. The server-only service-role client when `SUPABASE_SERVICE_ROLE_KEY` is configured.
2. The SSR client, carrying the current anonymous or authenticated session, as a fallback when the service-role key is absent.

The action inserts the parent order first, inserts its order items second, and updates the table status third. When service-role configuration is present, an order-item failure triggers a best-effort deletion of the parent order. These calls are not one database transaction, so later failures can still leave partial state.

The service-role key is read only by server code. It must never be exposed through a `NEXT_PUBLIC_` variable or browser client.

## Does Anonymous Direct Insert Need To Remain?

Anonymous direct INSERT is needed only for the current fallback path where `createOrderAction()` uses the SSR anon client because no service-role key is configured. It is not needed when every production order mutation is guaranteed to use a protected server-only service-role client or a purpose-built database function.

Removing the public policy before making the server path fail closed on missing service-role configuration would break customer checkout in environments that rely on the anon fallback. Narrowing it only to an existing parent order would reduce invalid references but would not prove that a shared anonymous caller owns that order.

## Risks In The Current Design

- A caller with API access and a known parent order UUID can attempt arbitrary item inserts.
- `with check (true)` does not enforce database-authoritative names, quantities, unit prices, or line totals.
- All anonymous users share the same database role, so a parent-order existence check alone is not caller ownership.
- Separate order, item, and table-status writes can partially complete.
- Service-role writes bypass RLS, making Server Action validation mandatory even after policies are tightened.

## Hardening Options

### Option A: Server-Only Service-Role Writes

Require `SUPABASE_SERVICE_ROLE_KEY` for customer mutation Server Actions, remove anon INSERT privileges/policies for orders and order items, and fail closed when the key is unavailable.

- Arbitrary browser inserts: prevented when grants and policies are removed.
- Partial writes: not fully prevented because the action still performs multiple requests.
- Main risk: deployments missing the server-only key would lose checkout until correctly configured.

### Option B: Transactional Database Function / RPC

Create a narrowly scoped database function that validates ordering state, active table, menu availability, quantities, and database prices, then inserts the order and all items in one transaction. Grant only function execution to the required customer role and revoke direct table INSERT access.

- Arbitrary browser inserts: prevented when direct table INSERT is revoked.
- Partial writes: prevented because all writes commit or roll back together.
- Main risk: the function must use a fixed `search_path`, strict input validation, controlled `SECURITY DEFINER` ownership, and minimal EXECUTE grants.

This is the recommended long-term option.

### Option C: Parent-Order-Aware RLS

Replace `with check (true)` with an `exists` check against a valid parent order and, optionally, its active table.

- Arbitrary browser inserts: reduced, but not fully prevented without a per-order capability or authenticated ownership model.
- Partial writes: not prevented.
- Main risk: knowing or obtaining another order UUID may still be sufficient because anonymous callers do not have distinct database identities.

## Recommendation

Keep this policy unchanged in the table-number migration. Plan a separate transactional order-creation RPC as the preferred hardening phase. As an interim step, production deployments can require server-only service-role mutations and remove the anon fallback only after verifying every customer mutation path and deployment environment.
