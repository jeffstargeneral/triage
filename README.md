# Triage — Node Wealth

An AI-powered email CRM: connect an inbox, get every message classified
and routed automatically, reply with AI-generated drafts (or fully
automatic personalized auto-replies), and see every sender who's emailed
you as a contact — all without manual data entry.

Connects via OAuth for Gmail/Outlook (never a stored password) or plain
IMAP/SMTP for other webmail providers (Hostinger, Zoho, cPanel hosts).
Classifies new mail in real time — urgent, routine, or noise — and
tracks a separate workflow status per message: Needs reply, Follow-up,
or Done.

## Shipped

- Gmail and Outlook 365 via OAuth, plus IMAP for Hostinger, Zoho, and cPanel hosts
- Rule-based classification — urgent, routine, noise
- Needs reply / Follow-up / Done status, updated automatically as you reply
- AI-drafted replies you can edit before sending (kie.ai / Gemini 2.5 Flash)
- Personalized AI auto-replies, triggered by your own rules
- Contacts view — every sender grouped automatically from your inbox
- Search, filters, and pagination across your inbox
- Secure multi-user accounts (signup/login/forgot-password), each with a fully private dashboard

## Coming next

- Lead extraction — company, role, and phone number pulled from message content by AI
- Pipeline stages for contacts — New, Contacted, Qualified, Won/Lost
- Per-contact notes and history, beyond raw message threads
- Real-time push for Gmail and Outlook, not just IMAP polling
- Sending replies from Gmail/Outlook directly, not IMAP/SMTP only
- An AI fallback for classification when no rule matches

## Architecture

Real OAuth flows for both providers, a landing page, a connect flow, a
dashboard, and a contacts view. The classifier and persistent storage
run on Neon Postgres, added via the Vercel Marketplace — one dashboard,
no second service to manage credentials for. (Note: Vercel's own
standalone "Postgres" product was discontinued and folded into this
Neon integration — when you're in the Storage tab looking for a
database to add, "Neon" is the option to pick.)

## 1. Install

```bash
npm install
```

## 2. Set up OAuth credentials

### Google (Gmail)
1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create a project.
2. Enable the **Gmail API** (APIs & Services → Library).
3. Configure the OAuth consent screen (External, add your app name + logo).
4. Create an **OAuth client ID** (Web application).
   - Authorized redirect URI: `https://triage.node-wealth.com/api/auth/google/callback`
   - For local testing, also add: `http://localhost:3000/api/auth/google/callback`
5. Copy the client ID and secret into `.env.local` (see below).

### Microsoft (Outlook / 365)
1. Go to [portal.azure.com](https://portal.azure.com) → **Azure Active Directory** → App registrations → New registration.
2. Redirect URI (Web): `https://triage.node-wealth.com/api/auth/microsoft/callback`
   - For local testing, also add: `http://localhost:3000/api/auth/microsoft/callback`
3. Under **API permissions**, add Microsoft Graph delegated permissions: `Mail.Read`, `Mail.ReadWrite`, `offline_access`.
4. Under **Certificates & secrets**, create a new client secret.
5. Copy the application (client) ID and secret into `.env.local`.

## 3. Set up Neon Postgres

1. In your Vercel project dashboard, go to the **Storage** tab → **Create
   Database** → choose **Neon** (this is the Postgres option — Vercel's
   old standalone "Postgres" product is gone, Neon replaced it directly).
   Follow the prompts to create it.
2. Open the database in Neon's own dashboard (there's an "Open in Neon"
   link from the Storage tab), then go to **Connection Details** and
   copy the **pooled** connection string — the one where the hostname
   contains `-pooler`. This is the single value you need.
3. In Vercel → **Settings → Environment Variables**, add `DATABASE_URL`
   yourself with that exact value, for the **Production** environment
   (and Preview/Development if you use those). Vercel's integration may
   also auto-create similarly-named variables — ignore those and make
   sure the `DATABASE_URL` your code actually reads is the one you just
   pasted from Neon directly. This avoids the confusion of several
   almost-identical variables pointing at slightly different things.
4. In Neon's **Query editor** (or the Storage tab's Query tab in
   Vercel), paste the contents of `db/schema.sql` and run it. This
   creates the `accounts`, `rules`, and `messages` tables.
5. Generate an encryption key for refresh tokens:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
   Add it as `TOKEN_ENCRYPTION_KEY` in Vercel's Environment Variables.
6. **Redeploy after adding or changing any environment variable** — this
   is easy to miss. Go to Deployments → the latest one → **⋯ → Redeploy**.
   A new deployment is the only way new env var values actually take
   effect; editing them alone does nothing to a deployment already built.

## 4. Environment variables

Copy the template and fill in your real values:

```bash
cp .env.example .env.local
```

## 5. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`. Note: for local testing, temporarily change
the redirect URIs in `.env.local` to `http://localhost:3000/...` and add
the matching localhost redirect URI in the Google/Azure consoles too.

## 6. Deploy to Vercel

1. Push this project to a GitHub repo.
2. In Vercel, **Add New → Project**, import that repo.
3. Under **Environment Variables**, add everything from `.env.local` —
   use the real `triage.node-wealth.com` redirect URIs here, not
   localhost ones.
4. Deploy. Since `triage.node-wealth.com` already points at Vercel from
   the DNS setup step, it should be live at that domain immediately.
5. Go back to Google Cloud Console and Azure AD and make sure the
   redirect URIs there match the production ones exactly (they need to
   match character-for-character, including `https://`).

## 7. Test with plain IMAP first

Before setting up Google/Microsoft OAuth (which needs app review for
production use), it's faster to prove the whole pipeline — connect,
classify, store, display — using a plain IMAP webmail:

- **Hostinger**: host `imap.hostinger.com`, port 993, SSL on. Use your
  regular email password.
- **cPanel-based hosting**: host is usually `mail.yourdomain.com` — check
  your host's control panel for the exact IMAP settings. Port 993, SSL on.
- **Zoho Mail**: host `imap.zoho.com` (or `imap.zoho.eu` for EU-region
  accounts), port 993, SSL on. IMAP access must be turned on in Zoho Mail
  → Settings → Mail Accounts → IMAP Access first, and if 2FA is enabled
  you'll need an app-specific password instead of your login password.

Go to `/connect`, use the "Other webmail (IMAP)" form, pick a preset, and
submit. On success it stores the connection and redirects to `/dashboard`.

Since plain IMAP has no webhook equivalent (no Gmail push, no Graph
subscriptions), the dashboard shows a **Sync now** button next to any
IMAP account — click it to manually pull and classify the last 15
inbox messages.

## 8. Make IMAP sync automatic (near real-time)

Vercel's own Cron feature only fires once a day on the free Hobby plan —
too slow to be useful here. The practical free fix: an external
scheduler that calls your sync endpoint every 1–2 minutes.

1. Add `SYNC_SECRET` to your env vars (in both `.env.local` and Vercel) —
   any random string works, see `.env.example` for how to generate one.
2. Create a free account at [cron-job.org](https://cron-job.org).
3. Add a new cron job:
   - URL: `https://triage.node-wealth.com/api/sync/imap`
   - Method: `POST`
   - Schedule: every 1–2 minutes
   - Header: `Authorization: Bearer <your SYNC_SECRET value>`
4. Save it. Every run syncs every connected IMAP account in one call.

This isn't instant the way Gmail push is, but a 1–2 minute delay is a
reasonable stand-in until a persistent IDLE-based worker is worth
building (that needs an always-on process, not serverless, and is a
bigger step — worth doing only once this proves valuable).

## 9. Set up AI replies (kie.ai)

1. Create an account at [kie.ai](https://kie.ai) and get an API key from
   the [API Key page](https://kie.ai/api-key).
2. Add `KIE_AI_API_KEY` to your environment variables in Vercel, and
   redeploy.
3. If you already ran `db/schema.sql` before this feature existed, run
   `db/migration_002_ai_reply.sql` in Neon's SQL Editor to add the new
   columns and the `auto_reply_rules` table. Fresh installs get these
   automatically from `schema.sql`.
4. Go to `/settings` in the app and fill in your name, signature, and
   (optionally) an auto-reply context like "On vacation until Aug 5."
   Add at least one auto-reply trigger rule if you want auto-send to
   actually fire — it won't send to everyone by default, only messages
   matching a rule you've added.

**Two reply modes:**
- **Manual** — click "AI reply" on any message in the dashboard, review
  or edit the generated draft, then send. Nothing sends without you
  clicking Send.
- **Automatic** — during IMAP sync, any new message matching one of your
  auto-reply rules gets an AI-generated reply (using your auto-reply
  context) sent automatically, with no human step. Each message only
  gets auto-replied to once — the code checks `replied_at` before
  sending, so re-syncing won't double-send.

Both modes only work for IMAP-connected accounts right now, since
sending requires SMTP, which Gmail/Outlook accounts don't have — those
would need Gmail's send API / Graph's sendMail instead, not built yet.

## 10. Set up user accounts (important — read this)

Earlier versions of this app had **no login system at all** — every
visitor to `/dashboard` saw every connected mailbox's data. That's fixed
now: there are real user accounts, and every page/API route only shows
data belonging to the logged-in user.

1. Run `db/migration_003_users.sql` in Neon's SQL Editor (adds the
   `users` table and ties `accounts` to a `user_id`). Fresh installs get
   this automatically from `schema.sql`.
2. Add `SESSION_SECRET` to your environment variables:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
3. **If you already connected a real inbox before this migration** (very
   likely, given how much testing we've done), that connection currently
   has no owner. Sign up for a real account at `/signup`, then run this
   in Neon's SQL Editor to claim it:
   ```sql
   UPDATE accounts SET user_id = (SELECT id FROM users WHERE email = 'you@example.com')
   WHERE user_id IS NULL;
   ```
   Without this step, your existing connection won't show up anywhere
   (it'll just belong to nobody, which is safe but invisible).

Sessions are signed JWTs in an httpOnly cookie, checked by `middleware.js`
for `/dashboard`, `/settings`, `/messages`, and `/connect` — visiting any
of those without a valid session redirects to `/login` automatically.
Every API route that touches a specific account or message (settings,
replies, manual sync) also independently checks that the record actually
belongs to the requesting user, not just that *someone* is logged in.

## 11. Password reset

Run `db/migration_004_password_reset.sql` in Neon's SQL Editor (adds
reset token columns to `users`). Fresh installs get this automatically.

**Honest limitation**: there's no transactional email service wired up,
so `/forgot-password` doesn't actually send an email — it shows the
reset link directly on screen instead. This is genuinely usable for
yourself, but two things to know: (1) it means submitting an email
reveals whether it's registered, which a real email-only flow avoids,
and (2) before this app has actual outside users, swap in a real email
provider (Resend is a clean fit) — the only file that needs to change
is `app/api/auth/forgot-password/route.js`.

## 12. Search and pagination

Built in, no setup needed — the dashboard's message list has a search
box (matches subject, sender, and body) and a classification filter,
both as plain URL query params (`?q=...&classification=urgent&page=2`),
so it works without JavaScript and is trivial to link to directly.

## 13. Message status (workflow, separate from priority)

Run `db/migration_005_message_status.sql` in Neon's SQL Editor. This adds
a `status` column to `messages`: `needs_reply`, `follow_up`, or `done` —
distinct from the `classification` column (urgent/routine/noise), which
stays as a priority signal. New mail defaults to `needs_reply` (or
`done` if classified as noise), flips to `follow_up` automatically once
you send a reply, and can be changed manually anytime by clicking the
status badge on any message.

## 14. Contacts

`/contacts` groups messages by sender into a lightweight contact list —
message count, last contact date, current status. No migration needed,
it's a query over existing data. See "Coming next" at the top of this
README for where this is headed (lead extraction, pipeline stages).

## 15. Manual sync for Gmail and Outlook (fixes "connected but empty")

Real-time push (`gmail.users.watch` / Graph subscriptions) still isn't
wired up — so if you only connect via OAuth and wait, nothing arrives.
Fixed for now with the same fix IMAP already had: a **Sync now** button
on the Overview page works for all three providers (`/api/sync/google`,
`/api/sync/microsoft`, `/api/sync/imap`), pulling the last 15 inbox
messages on demand. Click it after connecting to actually see mail.

## 16. Dashboard redesign

The authenticated app (Overview, Messages, Contacts, Settings, Connect)
now uses a proper sidebar shell (`app/components/AppShell.js`) instead
of the marketing site's top nav — no Roadmap/How it works links inside
the actual product, only inside the public marketing pages (home,
login, signup, password reset). The old single dashboard page split
into two: **Overview** (`/dashboard` — stat cards, connected accounts,
recent activity) and **Messages** (`/messages` — the full searchable,
paginated list, moved out of Overview to keep it focused).

## What's real vs. still to build

- **Real**: real user accounts (signup/login/logout, bcrypt-hashed
  passwords, signed httpOnly session cookies) with every account,
  message, setting, and reply route scoped to the logged-in user only —
  this was the biggest gap before and is now fixed throughout. OAuth +
  token exchange for both providers, refresh tokens encrypted
  (AES-256-GCM) before they're stored in Neon Postgres, the Gmail
  webhook fetching real message history and classifying it against your
  rules, the Outlook webhook doing the same via Graph, plain IMAP
  connect + test + classify for non-OAuth webmail providers, real message
  bodies parsed and stored (via mailparser) for IMAP, AI-generated manual
  reply drafts and one-click sending via SMTP, AI-generated auto-replies
  triggered by rule matches during sync, and the dashboard reading live
  data instead of mock rows.
- **Still to build**: no LLM fallback yet for classification (messages
  with no matching rule default to "routine"). The `gmail.users.watch` /
  Graph subscription calls that actually *start* real-time notifications
  for Gmail/Outlook aren't wired up yet, and neither is sending replies
  for those two providers (IMAP/SMTP only, for now). IMAP sync depends
  on the external cron setup in step 8 above. No "forgot password" flow
  yet either — if you lose a password, you'd need to reset it directly
  in Neon's SQL editor for now.
