# Restaurant OS Client Setup Guide

## Purpose

Use this guide when onboarding one new restaurant onto the Restaurant OS template.

The current commercial model is intentionally isolated:

- One client = one independent repository/project copy.
- One client = one Supabase project.
- One client = one Vercel project.
- One client = one domain, restaurant config, menu, and asset set.

Never reuse a client database or Vercel project for another restaurant. Updating Client B's menu, logo, configuration, or environment must never affect Client A.

## 1. Client Information Checklist

Collect and confirm the following before creating the client project.

- Legal business name and customer-facing restaurant name.
- Short restaurant name for compact UI areas.
- Tagline and one-paragraph restaurant description.
- Restaurant address.
- Phone number and customer support email.
- Website, Instagram, and Facebook URLs, if used.
- Business hours.
- Number of dine-in tables and their labels/numbers.
- Kitchen PIN owner contact and secure handoff method.
- Admin owner email address.
- Domain ownership and DNS access contact.
- Service plan, setup fee, monthly fee, launch date, and renewal date.

## 2. Required Assets

Request production-ready assets before implementation or launch.

- Logo: SVG preferred, transparent PNG acceptable.
- Favicon/app icon: square SVG or PNG, at least 512 x 512 pixels.
- Menu photos: consistent aspect ratio, web-optimized JPEG/WebP preferred.
- Hero/background image: optional; use only if it matches the restaurant brand.
- Restaurant address, phone number, and email.
- Table count and table naming convention, for example `Table 1` through `Table 18`.

Keep each client's files in a dedicated public asset folder, for example:

```text
public/
  clients/
    client-slug/
      logo.svg
      favicon.svg
      menu/
        wagyu-ribeye.webp
        truffle-fries.webp
```

Do not overwrite shared demo assets or another client's asset directory.

## 3. Duplicate the Template Safely

1. Create a new GitHub repository for the client from the approved template state.
2. Clone the new repository locally.
3. Create a new Supabase project exclusively for that restaurant.
4. Create a new Vercel project exclusively for that repository.
5. Configure the restaurant, assets, database seed data, and environment variables in the new project.
6. Complete the final QA checklist before pointing the client domain to Vercel.

Do not fork an existing live client and keep it connected to that client's Supabase or Vercel project. A copied codebase is safe only after its environment variables point to a new Supabase project and new Vercel project.

## 4. Files to Update Per Client

### `src/config/restaurant.ts`

This is the main code-level white-label configuration. Update:

- `name`, `shortName`, `productName`, `tagline`, and `description`.
- `logoText`, `logoPath`, and `faviconPath`.
- `heroImage` and `backgroundImage`, when applicable.
- `contact`, `businessHours`, `socialLinks`, `copyright`, and SEO values.
- `theme.colors` and theme radius only when brand requirements call for it.
- `navigation` visibility and labels. For a client-facing deployment, normally set `showKitchenLink`, `showAdminLink`, and `showTryDemoButton` to `false`. Routes remain available to authorized staff at `/kitchen` and `/admin`.
- `home` marketing copy and preview data.
- `kitchenAccess` copy. Do not place a real production PIN in public wording.
- `demo.tableCount` and any demo presentation text.

### Public Client Assets

Add logo, favicon, and local menu assets in the dedicated client folder under `public/`. Update matching paths in `src/config/restaurant.ts`.

For production menu photos, prefer public Supabase Storage URLs in the database. Use files in `public/` for brand assets and intentional local fallbacks.

### Local Environment File

Copy `.env.example` to `.env.local` in the client repository. Never commit `.env.local`.

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SECRET_KEY
NEXT_PUBLIC_SITE_URL=https://www.client-domain.com
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Never add it to browser code, public configuration, screenshots, or client documentation shared externally.

## 5. Supabase Setup

### Create the Project

1. Create a new Supabase project for this restaurant only.
2. Save its URL, public anon/publishable key, and server-only service role key in the client password manager.
3. Add the values to the local `.env.local` file and later to the corresponding Vercel project.

### Run the Schema

1. Open the Supabase SQL Editor for the new project.
2. Run [supabase/schema.sql](supabase/schema.sql).
3. Verify that the schema, RLS policies, seed data, storage definitions, and required functions complete successfully.

### Enable Realtime Publication

Enable Supabase Realtime for these public tables:

- `orders`
- `order_items`
- `staff_requests`
- `tables`

After enabling publication, open the deployed Kitchen page and verify that a new menu order appears in the New lane without a manual reload. This project uses a raw Supabase browser client for the realtime subscription path, plus the existing refresh queue and fallback refresh behavior.

### Create the Admin User

1. Create the owner/admin in Supabase Authentication using the client-provided admin email.
2. Link that auth user to `public.admin_users`.

```sql
insert into public.admin_users (user_id, role)
select id, 'owner'
from auth.users
where email = 'OWNER_EMAIL_HERE'
on conflict (user_id) do update
set role = 'owner';
```

Do not expose or edit the kitchen PIN through the public app. Confirm the kitchen access value in `restaurant_settings` through the approved owner/admin setup flow.

### Seed Restaurant Data

Use the existing table shapes only. Do not invent fields during normal client setup.

1. Seed `restaurant_settings` with the restaurant name, contact information, ordering state, kitchen PIN, and other existing settings fields.
2. Seed `tables` with the client's real table count and numeric labels, such as `Table 1` through `Table 18`.
3. Seed `menu_categories` with active categories and sort order.
4. Seed `menu_items` with name, description, price, image URL, availability, featured flag, and sort order.
5. Verify that all image URLs load from the client asset host or Supabase Storage.

The existing local fallback/demo data is useful for development, but the production client menu should be seeded in the new client's Supabase project.

## 6. Vercel Deployment Setup

1. Import the new client GitHub repository into Vercel as a new project.
2. Confirm the framework is detected as Next.js.
3. Add these environment variables for Production and Preview:

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL
```

4. Use the standard commands:

```text
Install Command: npm install
Build Command: npm run build
Output Directory: .next
```

5. Deploy the preview deployment first.
6. Run final QA against the preview URL before production promotion.

## 7. Custom Domain Setup

1. Add the client domain to the client's Vercel project, not the template project or another restaurant's project.
2. Add the DNS records Vercel provides at the client's domain registrar.
3. Set `NEXT_PUBLIC_SITE_URL` to the final canonical HTTPS domain.
4. Redeploy after changing the environment variable.
5. Confirm HTTPS, the root URL, `/menu?table=1`, `/kitchen`, `/admin`, and an order tracking URL load from the client domain.

## 8. Final QA Checklist

Run the automated checks in the client repository:

```bash
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

Then complete this smoke test in the deployed preview or production environment:

- Restaurant name, logo, favicon, theme colors, contact details, and SEO match the client.
- Customer menu loads from `/menu?table=1`.
- Categories, menu items, images, prices, and availability are correct.
- Add item, quick quantity controls, mobile Review Order mode, and Place Order work.
- Empty cart cannot submit an order.
- New order appears in Kitchen New lane without manual refresh.
- Kitchen flow works: New -> Preparing -> Ready -> Completed.
- Completed orders are hidden from the active Kitchen board.
- Staff request appears in Kitchen/Admin without manual refresh and can be resolved.
- Admin login works for the client owner.
- Admin ordering toggle, menu availability, tables, QR downloads/PDF sheet, CSV export, and reset confirmation work.
- Table list is numerically ordered and table/order status badges are readable.
- Tracking URL shows the correct four-step status timeline.
- Mobile 390px, tablet 768px, and desktop 1440px have no horizontal overflow.
- Browser console has no application runtime errors.

## 9. Maintenance Checklist

For each client, keep the following routine:

- Apply template updates only after reviewing the client-specific configuration and database impact.
- Back up Supabase data before running any destructive demo reset or manual SQL update.
- Review Supabase and Vercel environment variables after credential rotation.
- Renew the client domain before expiry.
- Confirm the owner admin account remains active and access is documented.
- Check that realtime publication remains enabled for the four required tables.
- Use a staging/preview deployment for updates, then run the final QA smoke test before production promotion.
- Record every template version or cherry-picked template commit in the client tracking sheet.

## 10. Version Tracking Recommendation

Give every client repository a clear starting point and upgrade history.

- Tag the approved template release, for example `template-v1.0.0`.
- Record the starting template commit hash in the client tracking sheet.
- Make client-specific configuration commits separate from feature upgrades, for example `Configure Acme Bistro branding and menu`.
- Use a changelog entry for each production deployment.
- When bringing a template improvement to a client, test it in that client's preview deployment before production.

## 11. Avoid Affecting Existing Clients

The safe rule is simple: never share mutable production infrastructure between clients.

- Do not point two client repositories at the same Supabase project.
- Do not point two client domains at the same Vercel project unless they are intentionally the same restaurant deployment.
- Do not edit another client's GitHub repository, `restaurant.ts`, assets, `.env.local`, or Supabase tables.
- Do not reuse `restaurant_settings`, menus, tables, orders, staff requests, or admin users across clients.
- Keep each client's storage assets in that client's Supabase project or dedicated public asset folder.
- Verify the Supabase project reference and Vercel project name before every seed, reset, deployment, and domain change.

Following this model means changes for Client B remain isolated from Client A by repository, deployment, database, environment, and assets.
