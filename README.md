# Triage — Node Wealth

Automatic inbox triage for Gmail and Outlook. Connects via OAuth (never a
stored password), classifies new mail in real time, and routes it —
urgent, routine, or noise.

This is the working skeleton: real OAuth flows for both providers, a
landing page, a connect flow, and a dashboard. The classifier and
persistent storage run on Neon Postgres, added via the Vercel
Marketplace — one dashboard, no second service to manage credentials
for. (Note: Vercel's own standalone "Postgres" product was discontinued
and folded into this Neon integration — when you're in the Storage tab
looking for a database to add, "Neon" is the option to pick.)

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

## What's real vs. still to build

- **Real**: OAuth + token exchange for both providers, refresh tokens
  encrypted (AES-256-GCM) before they're stored in Neon Postgres, the
  Gmail webhook fetching real message history and classifying it against
  your rules, the Outlook webhook doing the same via Graph, plain IMAP
  connect + test + classify for non-OAuth webmail providers, real message
  bodies parsed and stored (via mailparser) for IMAP, AI-generated manual
  reply drafts and one-click sending via SMTP, AI-generated auto-replies
  triggered by rule matches during sync, and the dashboard reading live
  data instead of mock rows.
- **Still to build**: no LLM fallback yet for classification (messages
  with no matching rule default to "routine" — separate from the AI
  reply feature, which is fully wired). The `gmail.users.watch` / Graph
  subscription calls that actually *start* real-time notifications for
  Gmail/Outlook aren't wired up yet, and neither is sending replies for
  those two providers (IMAP/SMTP only, for now). IMAP sync depends on
  the external cron setup in step 8 above.
