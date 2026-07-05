# Codex Project Memory

This file preserves stable project context for future Codex sessions, including sessions from another account. Read this file before making decisions in this repository.

## User Working Style

- The user prefers Chinese explanations, direct execution, and practical results.
- When the user says "直接做", "帮我搞定", or provides a sprint, implement it instead of only suggesting.
- The user cares about commercial quality, not just functional code.
- The user dislikes generic AI-generated layouts, Bootstrap-style dashboards, and placeholder-quality UI.
- The user wants work done sprint by sprint with testing after each sprint.
- Commit locally after verification, but only push when the user says "可以推送".

## Project Identity

- Project name: NOVA STEAKHOUSE Restaurant Operations System.
- Goal: a premium, commercially sellable restaurant QR ordering and operations SaaS demo for US restaurant clients.
- Product positioning: not just a QR menu; it should feel like a restaurant operations system.
- Design target: Apple, Linear, Vercel, Stripe, Raycast, Toast POS, Square, Uber Eats, DoorDash.
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
- This file: `CODEX_MEMORY.md`

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

Git workflow:

```powershell
git status --short
git add <changed files only>
git commit -m "<clear message>"
```

Push only after the user explicitly says:

```text
可以推送
```

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

- The app should be refined through small scoped design sprints.
- Do not redesign unrelated surfaces during a scoped sprint.
- For Customer Menu polish, only touch the requested surface:
  - Hero sprint touches Hero only.
  - Food Card sprint touches Food Card only.
  - Cart/Input sprint touches those areas only.
- The user repeatedly cares that the product remains recognizable while becoming more premium.
- Primary CTA hierarchy matters: `Place Order` should be visually strongest in ordering flows.
- Secondary actions like tracking and staff requests should be quieter.

## Recent Implementation State

- Latest local sprint before this file: Sprint B.1 Premium Hero Redesign.
- Latest local commit at that moment: `1de02fe Redesign customer menu hero`.
- Previous pushed commit before that was `4d54402 Polish menu readability and tracking hierarchy`.
- `DESIGN_SYSTEM.md` was created as a permanent design guideline and should be preserved.

## Known Cautions

- Do not mix unrelated untracked files into feature commits unless the user asks or the task is documentation/memory related.
- Be careful with `.env.local`; never commit or print it.
- Supabase SQL may fail if schema objects already exist; avoid rerunning full schema blindly.
- Vercel only updates after GitHub push.
- Local browser URL will not work unless `npm.cmd run dev -- --hostname 127.0.0.1 --port 3000` is running.

## Handoff Prompt For New Codex Account

If the user changes account or starts fresh, they can send:

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

Important workflow:
- Implement sprint by sprint.
- Do not redesign unrelated parts.
- Run npm.cmd run typecheck, npm.cmd run lint, npm.cmd run build.
- Commit locally after verification.
- Only push when I say "可以推送".
```
