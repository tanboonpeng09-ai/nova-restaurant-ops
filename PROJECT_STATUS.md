# NOVA Restaurant Operations System - Project Status

## Project

- Project: NOVA STEAKHOUSE Restaurant Operations System
- Local path: `D:\Restaurant-OS\demos\nova-steakhouse`
- Branch: `main`
- Remote: `origin` -> `tanboonpeng09-ai/nova-restaurant-ops`
- Working tree before creating this handoff: clean
- Current uncommitted change: this new `PROJECT_STATUS.md` file only
- Last verified: 2026-07-12

## Latest Commit

- `9cd7ee3 Make tracking Header customer-only`
- `main` is synchronized with `origin/main`.

## Completed Product Scope

- Menu V2 mobile browse and mobile order review flow
- Menu V2 desktop/tablet command center
- Category navigation, featured items, product cards, and quick quantity controls
- Sticky mobile review-order bar
- Empty-cart disabled Place Order state
- Expanded demo menu data
- Kitchen V2 visual shell, order cards, status lanes, and staff request row
- Kitchen realtime order updates
- Kitchen new-order audio alerts using `/audio/new-order-notification.mp3`
- Kitchen operational header with Theme, Fullscreen, Live Sync, and Alerts
- Admin V2 visual shell and operational navigation
- Admin table/order status badge contrast fixes
- Admin table natural numeric ordering
- Timezone-aware Daily Reporting V1
- Retry-range correction for reporting errors
- CSV spreadsheet formula-injection protection
- Tracking customer-only Header on all `/track*` routes
- Table-number integrity for demo-selector and qr-only modes
- Harbor Coffee white-label rehearsal and setup documentation were completed in the separate Harbor project.

## Important Verified Behavior

- Tracking routes use `pathname.startsWith("/track")`.
- Tracking Header exposes NOVA branding, Back to Menu, and Theme only.
- Back to Menu links to `/menu`.
- Kitchen and Admin links are hidden from tracking routes.
- Table-number flow validates active tables before order and staff-request writes.
- Demo table selector uses active tables and natural numeric sorting.
- Kitchen alerts require explicit user activation and do not replay known orders.
- Daily Reporting uses restaurant timezone `America/New_York`, server-authoritative UTC boundaries, and half-open ranges.

## Protected Scope

Do not change without an explicit task:

- Supabase schema, migrations, RLS, or production SQL
- Auth, Kitchen PIN, or route protection
- Order creation and order status business logic
- Realtime subscription architecture
- Menu cart and checkout behavior
- Table-number integrity rules
- Kitchen audio alert detection/deduplication
- Kitchen, Admin, Menu, or Tracking behavior unrelated to the requested task
- Harbor Coffee project or template remotes

## Standard Validation

For application changes, run from the NOVA project root:

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
git diff --check
```

For a narrow change, run the focused test first, then the full validation suite when required by the task.

## Git Workflow

- Work on `main`.
- Check `git status` before editing or committing.
- Commit only the explicitly approved files.
- Push only after explicit user approval using `git push origin main:main`.
- Never push Harbor, the template, or another remote from this project.
- Never commit `.env.local` or credentials.

## Current Next Step

- No implementation task is currently in progress.
- Before starting the next task, read this file and the repository project rules, inspect `git status`, and review the latest commits.
- Treat the newest user request as authoritative if it changes any earlier constraint.

## Handoff Prompt For A New Chat

Paste this into a new conversation:

```text
This is the NOVA project. Work only in:
D:\Restaurant-OS\demos\nova-steakhouse

First read PROJECT_STATUS.md and the repository project rules. Then run:
git status --short --branch
git log -5 --oneline

Summarize the completed scope, current commit, working-tree state, protected scope, and the next task boundary before editing anything. Do not assume the old conversation is available.
```
