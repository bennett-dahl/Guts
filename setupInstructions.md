# Guts — setup instructions

Follow these steps to finish configuration after cloning the repo and running `npm install`. You can do them in order; only **Google OAuth** and **`AUTH_SECRET`** are required for basic sign-in. **Spoonacular** is optional and unlocks recipe discovery search.

---

## 1. Environment file

1. Copy the example env file:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in values as you complete each section below. Never commit `.env` (it is gitignored).

---

## 2. Database (`DATABASE_URL`)

Migrations in this repo target **PostgreSQL** (`prisma/migrations/migration_lock.toml`). Use Neon, Supabase, RDS, Docker Postgres, etc.

1. Create a database and copy the connection string (Neon: **Dashboard** → your project → **Connection string**; use the **pooled** URL for serverless if offered).

2. Confirm `prisma/schema.prisma` has:

   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. Set in `.env`:

   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
   ```

4. Apply migrations:

   ```bash
   npx prisma migrate deploy
   ```

   For **local schema iteration** (new models), use `npx prisma migrate dev --name describe_change` against a dev database (not usually against production).

### If you see **P3019** (provider mismatch)

That means `migration_lock.toml` did not match your schema provider (for example, old migrations were created for SQLite while `schema.prisma` says `postgresql`). This repository’s history is **PostgreSQL-only** from the `postgres_init` migration onward.

- On an **empty** Neon database: run `npx prisma migrate deploy` again after pulling the fixed migrations.
- If Neon already has **broken or half-applied** tables from earlier attempts, open the Neon **SQL Editor** and reset the schema (e.g. drop all tables in `public`, or use **Reset** / a new branch), then run `npx prisma migrate deploy` on a clean database.

### Next.js dev on your LAN (phone / tablet)

If you use the **Network** URL (e.g. `http://192.168.0.104:3000`) instead of `localhost`, Next.js may log:

`Blocked cross-origin request to Next.js dev resource /_next/webpack-hmr`

Add the **host only** (no `http://`, no port) to `.env`:

```env
ALLOWED_DEV_ORIGINS=192.168.0.104
```

Use the hostname you actually open in the browser. If you use **nip.io** for Google OAuth (see **§4.4**), use that host instead, e.g. `ALLOWED_DEV_ORIGINS=192-168-0-104.nip.io`.

Restart the dev server.

**Google sign-in from a phone:** you **cannot** use a raw `http://192.168.x.x` URL (see **§4.4**). Use **`http://192-168-x-x.nip.io:3000`** (dashes, not dots) and register that origin + callback in Google Cloud, or use **localhost** on the PC, or a **tunnel**.

### Local development without Neon

Run Postgres in Docker, for example:

```bash
docker run --name guts-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=guts -p 5432:5432 -d postgres:16
```

Then set `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/guts"` and run `npx prisma migrate deploy`.

---

## 3. Auth secret (`AUTH_SECRET`)

Auth.js needs a random secret for session encryption and CSRF protection.

1. Generate a value (32+ bytes is a good habit):

   ```bash
   openssl rand -base64 32
   ```

2. Put it in `.env`:

   ```env
   AUTH_SECRET="<paste-the-output-here>"
   ```

3. Use a **different** secret for production than for local development.

---

## 4. Google OAuth 2.0 (`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`)

The app uses **Google** as the only sign-in provider (Auth.js). You will create OAuth credentials in Google Cloud Console.

### 4.1 Google Cloud project

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Enable the **Google+ API** is not required for basic profile; **Google Identity** / People API usage is driven by OAuth scopes Auth.js requests (email, profile). If prompted, enable **Google People API** or follow Console links to enable required APIs.

### 4.2 OAuth consent screen

1. Go to **APIs & Services** → **OAuth consent screen**.
2. Choose **External** (unless you use Google Workspace and want Internal).
3. Fill app name (e.g. “Guts”), user support email, developer contact.
4. Add scopes if the Console asks; the default openid/email/profile flow is what Auth.js uses for Google sign-in.
5. If the app is in **Testing**, add your Google account under **Test users** so you can sign in before verification.

### 4.3 OAuth client (Web application)

1. Go to **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**.
2. Application type: **Web application**.
3. **Authorized JavaScript origins** (add both for local and prod when ready):

   - `http://localhost:3000`
   - `https://your-production-domain.com` (replace with your real host)

4. **Authorized redirect URIs** — Auth.js uses this exact callback path:

   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-production-domain.com/api/auth/callback/google`

5. Create the client. Copy the **Client ID** and **Client secret** into `.env`:

   ```env
   AUTH_GOOGLE_ID="your-client-id.apps.googleusercontent.com"
   AUTH_GOOGLE_SECRET="your-client-secret"
   ```

6. Keep `AUTH_TRUST_HOST="true"` in development behind localhost. For production on Vercel, set `AUTH_TRUST_HOST="true"` or set **`AUTH_URL`** to your canonical site URL (Auth.js v5):

   ```env
   AUTH_URL="https://your-production-domain.com"
   ```

   This avoids redirect/callback mismatches.

### 4.4 Google blocks OAuth on raw private IPs (`192.168…`, `10…`)

If the sign-in URL is something like `http://192.168.0.104:3000`, Google often returns:

**Access blocked — `device_id` and `device_name` are required for private IP** / **Error 400: invalid_request**.

Google does not allow the OAuth **redirect URI** to use a **bare RFC1918 address**. That is unrelated to misconfigured `AUTH_GOOGLE_ID` / secret.

**Option A — Use `localhost` on the dev machine**  
Open `http://localhost:3000/login` on the PC running `next dev` and sign in there.

**Option B — Use [nip.io](https://nip.io) / sslip.io (same LAN, real phone/tablet)**  
Turn your IP into a hostname: **replace dots with dashes** and add `.nip.io`.

Example for PC address `192.168.0.104`:

| Use this in the browser | Not this |
|---------------------------|----------|
| `http://192-168-0-104.nip.io:3000` | `http://192.168.0.104:3000` |

In **Google Cloud → Credentials → your Web client**:

- **Authorized JavaScript origins:** `http://192-168-0-104.nip.io:3000`
- **Authorized redirect URIs:** `http://192-168-0-104.nip.io:3000/api/auth/callback/google`

In **`.env`** (then restart `next dev`):

```env
AUTH_URL="http://192-168-0-104.nip.io:3000"
ALLOWED_DEV_ORIGINS=192-168-0-104.nip.io
```

The phone must be on the **same Wi‑Fi**; public DNS for `*.nip.io` returns your embedded IP, and the browser still talks to your machine on the LAN.

**Option C — Tunnel** (ngrok, Cloudflare Tunnel, etc.)  
Use the tunnel’s `https://…` base URL as origin + callback in Google, and set `AUTH_URL` to that base URL.

### 4.5 Verify

1. Run `npm run dev`.
2. Open `/login` and use **Continue with Google**.
3. If you see `redirect_uri_mismatch`, double-check the redirect URI in Google Console matches **exactly** (including `http` vs `https`, no trailing slash on the path).

---

## 5. Spoonacular (`SPOONACULAR_API_KEY`) — optional

Used for **Discover** search and **Add to inbox**. Calls go through `/api/recipes/search` with per-user caching to reduce quota use.

1. Create an account at [Spoonacular Food API](https://spoonacular.com/food-api).
2. Open the developer **Dashboard** / console and copy your **API Key**.
3. In `.env`:

   ```env
   SPOONACULAR_API_KEY="your-key"
   ```

4. Without this key, Discover search returns an error from the API route; the rest of the app still works (manual recipes, URL import, planner, lists).

5. **Discover defaults** (optional): In the app, open **More → Discover defaults** to set your usual Spoonacular **diet** filter (including *Any* for omnivore results) and **default search text** (new accounts start with a plant-leaning `vegetables` query; clear the field and save for the widest matches).

---

## 6. Shopping lists (no retailer API)

Guts does **not** integrate with Instacart or other grocery APIs (those programs are usually partner-only). Shopping is intentionally **export-first**:

- **Lists** from the planner are grouped by category when possible; on a list page use **Copy list**, **Share** (system share sheet on supported devices), or **Download PDF**.
- **Recipes** have the same options for the ingredient block only.

No environment variables are required for this flow.

### 6.1 Pantry & “cook from home”

After **`npx prisma migrate deploy`**, you get **PantryItem** (pantry / fridge / freezer). From **Stock** in the nav you can add items, set **low-stock** thresholds, log **ate some** (partial use), or **remove / spoiled**. After a grocery run, open a shopping list and use **Add purchases to stock** to merge checked lines into inventory.

**Cook from home** (`/cook`) ranks your saved recipes against stock and calls Spoonacular (`findByIngredients` + biased search) using your staples. **Log cooked** on a recipe also tries to subtract matched ingredients from stock (fuzzy name match; units are best-effort).

---

## 7. First run checklist

- [ ] `.env` exists with `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- [ ] `npx prisma migrate dev` completed successfully
- [ ] `npm run dev` and sign-in at `/login` works
- [ ] (Optional) `SPOONACULAR_API_KEY` set and **Discover** search works

---

## 8. Deploying (e.g. Vercel)

1. Connect the repo and set **all** environment variables from `.env` in the Vercel project **Settings → Environment Variables** (Production). **Required for sign-in:**

   | Variable | Notes |
   |----------|--------|
   | `DATABASE_URL` | Neon **pooled** connection string (`-pooler` host) is best for serverless. Append **`&pgbouncer=true`** to the query string when using the pooler (Prisma + PgBouncer). Keep `sslmode=require`. |
   | `AUTH_SECRET` | Long random string; **if omitted, Google OAuth completes then Auth.js shows “Server error”.** |
   | `AUTH_GOOGLE_ID` | Web client ID from Google Cloud. |
   | `AUTH_GOOGLE_SECRET` | Web client secret. |
   | `AUTH_URL` | `https://your-deployment.vercel.app` (no trailing slash). |
   | `AUTH_TRUST_HOST` | `true` |

   Optional: Spoonacular key as needed.
2. Use a **PostgreSQL** `DATABASE_URL` in production (not `file:./dev.db`).
3. Run migrations once against the production database (from your machine with `DATABASE_URL` set, or in CI):

   ```bash
   npx prisma migrate deploy
   ```

4. In Vercel, set:

   ```env
   AUTH_URL="https://YOUR-PROJECT.vercel.app"
   AUTH_TRUST_HOST="true"
   ```

   Use your **exact** deployment URL (no trailing slash). If you add a **custom domain** later, set `AUTH_URL` to that `https://` URL and register the same values in Google (below).

5. After deploy, open **`https://YOUR-PROJECT.vercel.app/api/health`** in the browser. You should see JSON with `"database": { "ok": true }` and all `*Configured` / `authSecret` flags `true`. If `database.ok` is false, fix `DATABASE_URL` (Neon pooler + `pgbouncer=true`) or run migrations against that database. Remove or protect `/api/health` later if you prefer not to expose a public check.

### 8.1 Fix `redirect_uri_mismatch` on Vercel

Auth.js sends Google a redirect URI shaped like:

`https://<your-host>/api/auth/callback/google`

Google rejects sign-in until that string is **explicitly** allowed on the **same** OAuth client as `AUTH_GOOGLE_ID`.

1. Open [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Open your **OAuth 2.0 Client ID** (type *Web application*) — the one whose ID matches `AUTH_GOOGLE_ID` (e.g. ends with `...apps.googleusercontent.com`).
3. Under **Authorized JavaScript origins**, click **Add URI** and enter **only** the site origin (no path):

   ```text
   https://guts-nine.vercel.app
   ```

   (Replace with your real Vercel URL or custom domain.)

4. Under **Authorized redirect URIs**, click **Add URI** and enter the **full** callback URL (must match what appears in the error’s `redirect_uri=`):

   ```text
   https://guts-nine.vercel.app/api/auth/callback/google
   ```

5. **Save**. Wait a minute, then try **Sign in with Google** again (hard refresh if needed).

**Common mistakes**

- Using `http://` instead of `https://` for Vercel.
- Trailing slash on the redirect URI (Google is strict; Auth.js uses **no** trailing slash after `google`).
- Editing a **different** OAuth client than the one whose Client ID is in Vercel’s `AUTH_GOOGLE_ID`.
- **Preview deployments** (`your-app-git-branch-xxx.vercel.app`): each distinct hostname needs the same pair of URIs added, or sign-in only on the **production** URL you registered.

**Custom domain example**

- Origins: `https://guts.example.com`
- Redirect: `https://guts.example.com/api/auth/callback/google`
- Vercel env: `AUTH_URL="https://guts.example.com"`

---

## 9. Troubleshooting

| Issue | What to check |
|--------|----------------|
| Google `redirect_uri_mismatch` | In Google Cloud → Credentials → your Web client, add **Authorized JavaScript origin** `https://your-host` and **Authorized redirect URI** `https://your-host/api/auth/callback/google` (copy from the error’s `redirect_uri=`). Set Vercel `AUTH_URL` to `https://your-host`. See **§8.1**. |
| **“Server error” / “problem with the server configuration”** right after choosing a Google account | **If `AUTH_SECRET` is already set:** the failure is often **database** (Prisma adapter cannot create the user/session) or **host/URL** mismatch. Use **`/api/health`** (see **§8** step 5) to confirm the DB round-trip. In **Vercel → Runtime Logs**, look for **`[next-auth]`** lines or Prisma errors on `/api/auth/callback/google`. Set **`AUTH_DEBUG=true`** temporarily, redeploy, reproduce sign-in, then remove **`AUTH_DEBUG`**. Confirm **`AUTH_URL`** matches the hostname you are actually visiting (Production vs Preview). For Neon pooled URLs, add **`&pgbouncer=true`** to **`DATABASE_URL`**. Try a fresh browser profile or incognito (stale `callbackUrl` cookies pointing at localhost can break production). If **`AUTH_SECRET` is missing**, add it for **Production** and redeploy. |
| Sign-in loops or CSRF | `AUTH_SECRET` set; `AUTH_TRUST_HOST` / `AUTH_URL` correct in production. |
| Prisma errors on install | Node version (see README); run `npx prisma generate`. |
| Spoonacular 402 / limit | Plan quota; app caches searches per user for one hour to reduce calls. |

For Spoonacular, refer to their official docs for the latest dashboard URLs and pricing.
