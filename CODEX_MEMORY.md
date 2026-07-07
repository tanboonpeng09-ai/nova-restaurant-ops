# Codex Project Memory

This file preserves stable project context for future Codex sessions, including sessions from another account. Read this file before making decisions in this repository.

## User Working Style

- The user prefers Chinese explanations, direct execution, and practical results.
- When the user says "directly do it", "help me finish it", gives a sprint, or says "Proceed", implement the work instead of only suggesting.
- The user cares about commercial quality, not just functional code.
- The user dislikes generic AI-generated layouts, Bootstrap-style dashboards, Material UI styling, and placeholder-quality UI.
- The user wants work done sprint by sprint with validation after each sprint.
- Commit locally after verification only when useful or requested. Push only when the user explicitly says "可以推送".
- The user often needs simple operational guidance, especially remembering to `cd` into the project before running commands.

## Project Identity

- Project name: NOVA STEAKHOUSE Restaurant Operations System.
- Goal: a premium, commercially sellable restaurant QR ordering and operations SaaS demo for US restaurant clients.
- Product positioning: not just a QR menu; it should feel like a restaurant operations system.
- Design references: Apple, Linear, Vercel, Stripe, Raycast, Toast POS, Square, Uber Eats, DoorDash, Sweetgreen, Stitch.
- Avoid: Bootstrap, Material UI, generic admin templates, excessive glassmorphism, heavy gradients, AI-template appearance.

## Repository And Paths

- Local path: `C:\Users\tanbo\Documents\Codex\2026-07-03\qr`
- GitHub repo: `https://github.com/tanboonpeng09-ai/nova-restaurant-ops`
- Main branch: `main`
- Vercel production URL seen during work: `https://nova-restaurant-ops-wuys.vercel.app`

## Required Project Documents

Before implementation, read:

- `PROJECT_RULES.md`
- `UI_RULES.md`
- `DESIGN_SYSTEM.md`
- `CODEX_MEMORY.md`
- For Menu V2 work, also read `MENU_V2_IMPLEMENTATION_SPEC.md`

## Verified Workflow

Common local run command:

```powershell
cd C:\Users\tanbo\Documents\Codex\2026-07-03\qr
npm.cmd run dev -- --hostname 127.0.0.1 --port 3000
```

Common local URL:

```text
http://127.0.0.1:3000/menu?table=1
```

Validation commands:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

Important local dev caveat:

- Running `npm.cmd run build` while a dev server is open can make local CSS stale or 404. If the browser looks wrong after a build, restart the dev server.

## Current Technical Context

- Framework: Next.js App Router, React, TypeScript, Tailwind CSS.
- Backend: Supabase Auth, Postgres, Storage, Realtime.
- Local UI state: Zustand is kept only for UI/cart/local interaction where appropriate.
- Admin uses Supabase Auth.
- Kitchen uses PIN access, not Supabase Auth.
- Service role keys must never be exposed to the browser.
- `.env.local` contains local secrets and must not be printed or committed.

## Supabase / Deployment Notes

- The user manually connected Supabase and confirmed DB records appear in Supabase Table Editor.
- Important tables include:
  - `restaurant_settings`
  - `tables`
  - `menu_categories`
  - `menu_items`
  - `orders`
  - `order_items`
  - `staff_requests`
  - `admin_users`
- Vercel deployment depends on environment variables matching `.env.example`.
- Never reveal API secrets in responses.

## Design Decisions Already Made

- Work in small scoped design sprints.
- Do not redesign unrelated surfaces during a scoped sprint.
- The product should remain recognizable while becoming more premium.
- Primary CTA hierarchy matters: `Place Order` should be visually strongest in ordering flows.
- Secondary actions like tracking and staff requests should be quieter.
- Current Menu V2 direction is based on Stitch references:
  - Mobile: light SaaS/POS ordering app.
  - Desktop/tablet: three-pane Command Center with left category sidebar, center menu grid, right order summary.
- Accepted mobile Menu V2 should not be redesigned again unless required for responsive safety.

## Recent Implementation State

Current work area:

- Menu V2 implementation and polish.

Completed Menu V2 phases:

- Phase 0: extracted menu presentation sections into reusable components.
- Phase 1: mobile Menu V2 redesign.
- Phase 1.5: mobile QA and visual polish.
- Phase 1.6: Stitch mobile alignment polish.
- Phase 1.7: mobile final fix.
- Phase 2: desktop/tablet Command Center redesign.
- Phase 2.5: desktop Command Center polish.
- Phase 2.6: desktop final small polish.

Latest Phase 2.6 changes:

- Improved desktop center menu grid balance.
- Lightly refined desktop Order Summary panel to feel more like a live POS/cart summary.
- Checked desktop spacing for app shell, left sidebar, center content, right panel, and card gaps.
- Mobile layout was intentionally kept intact.
- Validation passed:
  - `npm.cmd run typecheck`
  - `npm.cmd run lint`
  - `npm.cmd run build`

Files currently changed in the working tree from Menu V2 and related polish:

- `next.config.ts`
- `src/components/menu/cart-command-center.tsx`
- `src/components/menu/category-navigation.tsx`
- `src/components/menu/empty-cart-state.tsx`
- `src/components/menu/featured-section.tsx`
- `src/components/menu/item-card.tsx`
- `src/components/menu/mobile-menu-header.tsx`
- `src/components/menu/sticky-cart-bar.tsx`
- `src/components/restaurant/menu-page.tsx`
- `src/components/shared/app-shell.tsx`

Do not revert these changes unless the user explicitly asks.

## Known Cautions

- Do not mix unrelated untracked files into feature commits unless the user asks or the task is documentation/memory related.
- Be careful with `.env.local`; never commit or print it.
- Supabase SQL may fail if schema objects already exist; avoid rerunning full schema blindly.
- Vercel only updates after GitHub push.
- Local browser URL will not work unless the dev server is running.
- If PowerShell says it cannot find `C:\Users\tanbo\package.json`, the user forgot to run `cd C:\Users\tanbo\Documents\Codex\2026-07-03\qr`.

## Handoff Prompt For New Codex Account Or New Chat

The user can paste this into a new Codex conversation:

```text
This is the NOVA STEAKHOUSE Restaurant Operations System.

Repo:
https://github.com/tanboonpeng09-ai/nova-restaurant-ops

Local path:
C:\Users\tanbo\Documents\Codex\2026-07-03\qr

Before working, read:
PROJECT_RULES.md
UI_RULES.md
DESIGN_SYSTEM.md
CODEX_MEMORY.md
MENU_V2_IMPLEMENTATION_SPEC.md

Important workflow:
- Implement sprint by sprint.
- Do not redesign unrelated parts.
- Keep accepted mobile Menu V2 intact unless I explicitly ask to change it.
- For Menu V2, current direction is Stitch-inspired:
  mobile light SaaS/POS browse, desktop/tablet three-pane Command Center.
- Run npm.cmd run typecheck, npm.cmd run lint, npm.cmd run build after implementation.
- Only push when I say "可以推送".

Current status:
Menu V2 Phase 2.6 desktop final small polish is complete locally. Typecheck, lint, and build passed. There are local modified files from Menu V2 work. Do not revert them.
```
