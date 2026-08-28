# UVAA API

Node/Express backend for registration, email verification, and login —
backs the `uvaa-webapp` React frontend's `/register` and `/login` pages.

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

- `DATABASE_URL` — your Azure Postgres Flexible Server connection string
  (Azure portal → your server → Connect, or `az postgres flexible-server
  show-connection-string`). Keep `DB_SSL=true` — Azure requires TLS.
- `JWT_SECRET` — a long random string, e.g. `openssl rand -hex 32`.
- `SMTP_*` — leave blank for local development. With no SMTP host
  configured, the verification link is printed to the server console
  instead of emailed, so registration is fully testable without a real
  email provider. Fill these in when you're ready to send for real (Azure
  Communication Services Email, SendGrid, or plain SMTP all work —
  `src/lib/email.js` just needs host/port/user/pass).

## Apply the database schema

Run once against your Azure Postgres database, from the sibling `uvaa-db`
folder:

```bash
psql "$DATABASE_URL" -f ../uvaa-db/schema.sql
```

(Or run `../uvaa-db/migrations/001..007` individually — same effect, but
you get a clear migration history if you're tracking this in a tool like
`node-pg-migrate` later.)

## Run

```bash
npm run dev     # node --watch server.js — restarts on file changes
npm start       # plain node server.js
```

Health check: `GET http://localhost:4000/health` → `{ "ok": true }`

## Endpoints

| Method | Path            | Auth | Purpose |
|--------|-----------------|------|---------|
| POST   | `/auth/register`| —    | Create an account. Validates the payload, rejects duplicate emails, sends a verification email. |
| POST   | `/auth/verify`  | —    | Body `{ token }` from the verification email link. Marks the account verified. |
| POST   | `/auth/login`   | —    | Body `{ email, password, rememberMe }`. Refuses login until the email is verified. Sets an httpOnly session cookie on success. |
| POST   | `/auth/logout`  | —    | Clears the session cookie. |
| GET    | `/auth/me`      | cookie | Returns the signed-in respondent's profile. 401 if not logged in. |
| GET    | `/assessment/guna` | cookie | Whether this respondent has completed the Guna Profiler, and their answers if so. `{ submitted, answers, submittedAt }`. Never includes the computed result — see below. |
| POST   | `/assessment/guna` | cookie | Body `{ answers: [{ vignetteId, optionKey }, ...15] }`. Upserts — resubmitting replaces the previous answers and rescoring runs immediately. All 15 required, no partial submissions. |
| GET    | `/admin/users` | cookie + admin | Every registered respondent plus a per-assessment completion flag. `{ users: [...] }`. |
| GET    | `/admin/users/:id` | cookie + admin | One respondent's full profile and assessment status summary. |
| GET    | `/admin/users/:id/guna` | cookie + admin | The computed TPE result (dominance, Sattva/Rajas/Tamas counts, TPE_raw/TPE_index) plus a per-question review (prompt, all three options, which was selected). The only place this data ever leaves the database. |

All error responses are `{ "message": "...", "errors"?: { field: "..." } }`
so the frontend can show both a summary and per-field messages.

## Guna (TPE) scoring

Scoring runs synchronously inside `POST /assessment/guna` (see
`src/lib/scoring.js`, formulas from `UVAA_Scoring_Guide_v5_190826.docx`
section 2) — the moment a respondent submits, the API computes their guna
dominance and stores it, it does not wait for a separate batch job.

- **Dominance**: a guna needs 8 of 15 selections to be "declared." If none
  reaches that, dominance falls back to the highest count (tie-broken
  toward Sattva > Rajas > Tamas) and the result is flagged `provisional`.
- **TPE_raw / TPE_index**: `TPE_raw = (sattva×3)+(rajas×2)+(tamas×1)`
  (15–45), `TPE_index = ((TPE_raw-15)/30)×100` (0–100) — a research-only
  metric, never shown to the respondent or used in any product logic.
- All of this is stored in `guna_responses` (migration `009`) but is
  **never returned by `GET /assessment/guna`** — only the admin routes
  expose it. This matches the FRD: respondents complete the assessment and
  get a confirmation message, nothing more, "we go for scoring later."

`src/data/gunaVignettes.js` is the server's own copy of the 15
vignettes/options (same content as `uvaa-webapp/src/data/gunaVignettes.js`)
— scoring never trusts a guna/score sent by the client, it looks up the
respondent's `optionKey` against its own copy of the scoring master.

## Admin area

There's no self-service way to become an admin — promote an existing
account by hand:

```sql
UPDATE respondents SET is_admin = true WHERE email = 'you@example.com';
```

Once promoted, that account sees an "Admin" link in the site header after
logging in (and is redirected to `/admin/users` on login instead of
`/my-page`). `requireAdmin` (`src/middleware/requireAdmin.js`) checks
`is_admin` against the database on every request rather than trusting a
JWT claim, so revoking access takes effect immediately rather than waiting
for the session to expire.

## Security notes

- Passwords are hashed with **bcryptjs** (pure JS — deliberately not the
  native `bcrypt`/`argon2` packages, to avoid native-binary install issues
  on locked-down corporate npm registries). Never logged, never stored in
  reversible form.
- Sessions are a JWT in an **httpOnly, Secure (in production), SameSite=Lax
  cookie** — never in localStorage/sessionStorage, so page JS (and any XSS)
  can't read it, and it matches the FRD's "no client-side storage for
  session state" requirement.
- 5 failed logins locks the account for 15 minutes (`user_credentials.
  failed_login_attempts` / `locked_until`).
- Verification tokens are single-use, expire after 24 hours, and only a
  SHA-256 hash of the token is stored — a database leak doesn't hand out
  working verification links.
- `/auth/verify` is a POST, not a GET, so email-client link-prefetching
  can't burn the token before the person clicks it.

## What's not built yet

- **Password reset.** The login page has a "Forgot password?" link with no
  backend behind it yet — same shape as verification (token table +
  email), not built this round.
- **Resend verification email.** If the 24-hour link expires, there's
  currently no way to request a new one short of re-registering (which
  will correctly fail on the duplicate-email check). Worth adding before
  this goes further.
- **Rate limiting** on `/auth/register` and `/auth/login` at the HTTP
  layer (the failed-login lockout only covers one account at a time, not
  a flood of requests across many accounts/IPs).
- **ECM / Construct assessment (32 scenarios) and DQI/UVAA Pattern
  scoring.** Guna (TPE) scoring is done — see above — but the decision-
  quality half of the model (Scoring Guide v5 sections 3–5: 32-item ECM
  scenario bank, DQI bands, the 9-cell UVAA Pattern, and the intervention
  plan) is not built. The existing `ConstructAssessment.jsx` frontend page
  runs on a stale, pre-v5 scoring model (`EDSI`/`NKOI`) with placeholder
  content and is not wired to this API — do not extend it without first
  replacing its content/scoring with the real v5 model.
- **Intervention library.** 12 content entries (4 constructs × 3 layers)
  need to be authored before the intervention-plan rendering logic in the
  Scoring Guide (sections 4–5, 10–11) has anything real to print. This is
  a content-writing task, not a code task, and depends on ECM existing
  first.
