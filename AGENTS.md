<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Application architecture
- Keep shared navigation and footer in the root shell and content in distinct public TanStack routes, so every page has a shareable URL and its own metadata.
- Use browser Cloud clients with RLS for requests and accounts; tracking uses an exact-ID database function that projects only public shipment fields, so identities stay private.
- Separate booking requests from operational shipments; only company-created shipment records can produce tracking results, so unconfirmed customer requests never masquerade as real deliveries.
- Keep public signup email/password-only; administrator-managed contact profiles are stored separately, and customer identity comes from verified Cloud Auth sessions.

- Use a distinct client-only admin layout with every data handler independently validating the database master role and inactivity session; the layout never grants server access.
- Passcode-only administrator sign-in uses the existing master email as an implicit Auth identifier; passwords remain user-entered and Cloud-verified, never embedded in source or used as a role bypass.
- Owner email changes update both implicit sign-in and database eligibility; grant or transfer the single role only after the replacement email is verified, preserving account and audit history.
- Test shipment suspension policies with isolated PostgreSQL fixtures and the actual migration SQL; never change live customer status to run security regressions.
- Use the shared PasswordInput for password and passcode fields so visibility toggles never submit forms or change entered credentials.
- Keep audit records append-only and update tracking through the transactional database function, so history corrections and current public status remain consistent.
- Keep payment views read-only until a verified payment gateway is configured, and never equate shipping charges with received revenue.
- Publish website content through separate draft/published fields and validate structured content before making it public; public reads must use the published-only database function, with direct table reads restricted to the master administrator so drafts remain private.
- Store customer pictures and delivery proof in a private, master-only bucket; use short-lived signed links to inspect them.

- Translate only public static interface text using bundled locale dictionaries; leave customer data and administrator pages untouched and preserve English form option values for stored requests.
- Build the globe with browser-only dynamic Three.js imports and bundled geographic geometry, so no external map service or invented branch records are required.
