# Guts — setup instructions

Follow these steps to finish configuration after cloning the repo and running `npm install`. You can do them in order; only **Google OAuth** and **`AUTH_SECRET`** are required for basic sign-in. **Spoonacular** and **Instacart** are optional but unlock discovery and one-tap grocery handoff.

---

## 1. Environment file

1. Copy the example env file:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in values as you complete each section below. Never commit `.env` (it is gitignored).

---

## 2. Database (`DATABASE_URL`)

### Local development (default)

The project ships with **SQLite** for zero-config local use:

```env
DATABASE_URL="file:./dev.db"
```

After changing `DATABASE_URL`, run:

```bash
npx prisma migrate dev
```

### Production (PostgreSQL, e.g. Neon)

1. Create a PostgreSQL database and copy its connection string.
2. In `prisma/schema.prisma`, change the datasource:

   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. Adjust any **SQLite-only** field types if you add `Json` columns later (the current schema uses `String` for JSON payloads for SQLite compatibility).
4. Set in `.env`:

   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
   ```

5. Run migrations against that database:

   ```bash
   npx prisma migrate deploy
   ```

   (Use `migrate dev` only in development.)

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

### 4.4 Verify

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

---

## 6. Instacart Developer Platform (`INSTACART_API_KEY`, `INSTACART_API_BASE`) — optional

Used to create **shopping list** and **recipe** links that open in Instacart so the user can match products and check out there. This is **not** checkout inside Guts.

### 6.1 Account and API key

1. Read the overview: [Instacart Developer Platform](https://docs.instacart.com/developer_platform_api/).
2. Sign in to the [Instacart Developer Dashboard](https://docs.instacart.com/developer_platform_api/get_started/api-keys) (linked from Instacart docs) and create an API key.
3. For **development**, Instacart’s docs use the dev API host. In `.env`:

   ```env
   INSTACART_API_KEY="keys.your-development-key"
   INSTACART_API_BASE="https://connect.dev.instacart.tools"
   ```

4. For **production**, create a **production** key in the dashboard after you meet their checklist, then set:

   ```env
   INSTACART_API_BASE="https://connect.instacart.com"
   ```

   Production keys are subject to Instacart **review** (terms, correct API usage, error handling). See their [approval process](https://docs.instacart.com/developer_platform_api/guide/concepts/launch_activities/approval_process).

### 6.2 Behavior notes

- The app sends ingredient or list line items; Instacart **matches** names (and optional UPCs if you add them later). Results depend on store and inventory.
- You **cannot** force a specific retailer via the public API; the user’s session and location drive defaults.
- Generated URLs are **cached** briefly server-side to respect Instacart guidance about not regenerating identical lists unnecessarily.

### 6.3 Without Instacart

Leave `INSTACART_API_KEY` empty. Users can still use **Copy list** and **Download PDF** on shopping list pages.

---

## 7. First run checklist

- [ ] `.env` exists with `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- [ ] `npx prisma migrate dev` completed successfully
- [ ] `npm run dev` and sign-in at `/login` works
- [ ] (Optional) `SPOONACULAR_API_KEY` set and **Discover** search works
- [ ] (Optional) `INSTACART_API_KEY` + correct `INSTACART_API_BASE`; **Send list to Instacart** / **Continue in Instacart** opens Instacart

---

## 8. Deploying (e.g. Vercel)

1. Connect the repo and set **all** environment variables from `.env` in the Vercel project settings (use production values).
2. Use a **PostgreSQL** `DATABASE_URL` in production (not `file:./dev.db`).
3. Run migrations in CI or once from your machine against the production DB:

   ```bash
   npx prisma migrate deploy
   ```

4. Google OAuth: add production **Authorized origins** and **redirect URI** for your Vercel URL.
5. Set `AUTH_URL` to `https://your-app.vercel.app` (or your custom domain).

---

## 9. Troubleshooting

| Issue | What to check |
|--------|----------------|
| Google `redirect_uri_mismatch` | Redirect URI in Google Console must be exactly `/api/auth/callback/google` on your origin. |
| Sign-in loops or CSRF | `AUTH_SECRET` set; `AUTH_TRUST_HOST` / `AUTH_URL` correct in production. |
| Prisma errors on install | Node version (see README); run `npx prisma generate`. |
| Instacart 401 / 403 | Key type (dev vs prod) matches `INSTACART_API_BASE`; key not expired or revoked. |
| Spoonacular 402 / limit | Plan quota; app caches searches per user for one hour to reduce calls. |

For Instacart and Spoonacular, refer to their official docs for the latest dashboard URLs and pricing.
