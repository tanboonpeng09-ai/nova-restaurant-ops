# Restaurant OS Client Tracking Template

Use one row per independently deployed restaurant client. Keep this document in a private operations repository or secure workspace because it may contain customer business and administrator details.

## Client Portfolio

| Client Name | Restaurant Name | Status | Plan | Setup Fee | Monthly Fee | Domain | Vercel Project | Supabase Project | GitHub Repo | Admin Email | Launch Date | Renewal Date | Template Version | Notes |
| --- | --- | --- | --- | ---: | ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Example Client Sdn Bhd | Example Steakhouse | Discovery | Starter | $0.00 | $0.00 | `example.com` | `example-steakhouse-ops` | `example-steakhouse-prod` | `github.com/your-org/example-steakhouse-ops` | `owner@example.com` | YYYY-MM-DD | YYYY-MM-DD | `template-v1.0.0` / `commit-hash` | Replace this example row when ready. |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

## Suggested Status Values

- `Lead`: Initial discussion only.
- `Discovery`: Collecting restaurant details, assets, menu, and domain access.
- `Setup`: Repository, Supabase, configuration, and seed data in progress.
- `QA`: Preview deployment is ready for client and internal testing.
- `Launched`: Production domain is live.
- `Maintenance`: Live client receiving routine support or template upgrades.
- `Paused`: Client work or service temporarily suspended.
- `Offboarded`: Service closed; archive and retention process in progress.

## Per-Client Setup Notes

For each client, also record these operational details in a private note or ticket:

- GitHub repository owner and default branch.
- Supabase project reference, region, billing owner, and backup contact.
- Vercel team, project name, production domain, and DNS registrar contact.
- Current template release tag and source commit hash.
- Client-specific configuration commit hash.
- Asset folder location and image storage location.
- Admin account ownership and last access review date.
- Date of last QA, last deployment, and next planned maintenance.

Do not record passwords, Supabase service role keys, or other secrets in this document. Store them in an approved password manager instead.
