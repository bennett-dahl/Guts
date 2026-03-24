# Guts

**Guts** is a mobile-first web app for **gut-friendly meal planning**: recipes, a weekly planner, shopping lists, and a handoff to **Instacart** so you can finish checkout in their app. Recipe discovery uses **Spoonacular** (server-side, cached). Sign-in is **Google OAuth** only; your data lives in a database keyed to your account.

This is **wellness software, not medical advice**. It includes onboarding copy inspired by public themes from Dr. Will Bulsiewicz’s materials (fiber, plant diversity, ferments, etc.) with links to his official PDFs—not a clinical program.

## Features

- **Google sign-in** with database-backed sessions (Auth.js + Prisma).
- **Onboarding** with disclaimer and links to [theplantfedgut.com](https://theplantfedgut.com/fiber-fueled-book-resources/) resources (FODMAP guide, shopping lists, probiotic guide).
- **Recipes**: create manually, import from URLs (`schema.org` Recipe JSON-LD), difficulty and tags, **favorites**, **“Log cooked”** for plant-diversity tracking.
- **Discover**: search via Spoonacular API, queue hits to an **inbox**, approve into your library.
- **Meal planner** by week; **build a shopping list** from planned meals (grouped by category).
- **Shopping**: copy list, **PDF export**, or **Instacart Developer Platform** (shopping list or per-recipe ingredient pages).
- **Track**: weekly unique-plant count vs. a goal from your diet profile defaults.
- **Responsive UI**: bottom navigation on phones, side nav on larger screens; PWA-oriented `manifest.json` and theme color.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router), React 19, TypeScript, Tailwind CSS 4  
- [Prisma](https://www.prisma.io) 5 + SQLite locally (see [setupInstructions.md](setupInstructions.md) for PostgreSQL / Neon)  
- [Auth.js](https://authjs.dev) (NextAuth v5 beta) + `@auth/prisma-adapter`  
- [Spoonacular Food API](https://spoonacular.com/food-api) (optional)  
- [Instacart Developer Platform](https://docs.instacart.com/developer_platform_api/) (optional)  
- [jsPDF](https://github.com/parallax/jsPDF) for list PDFs  

## Quick start

1. **Node.js** 20.19+, 22.12+, or 24+ recommended (Prisma and tooling expect a current LTS).

2. Install dependencies and generate the Prisma client:

   ```bash
   npm install
   ```

3. Configure environment variables (see [setupInstructions.md](setupInstructions.md) for OAuth, Spoonacular, and Instacart):

   ```bash
   cp .env.example .env
   ```

4. Create / migrate the database:

   ```bash
   npx prisma migrate dev
   ```

5. Run the dev server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000). Sign in with Google after you have set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Start Next.js in development |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npx prisma migrate dev` | Apply migrations (development) |
| `npx prisma studio` | Browse SQLite/DB in a GUI |

`postinstall` runs `prisma generate` so the client is available after installs.

## Detailed setup

For **Google OAuth**, **Spoonacular**, **Instacart**, switching to **PostgreSQL**, and **production** (e.g. Vercel), follow **[setupInstructions.md](setupInstructions.md)**.

## Disclaimer

Guts does not diagnose or treat medical conditions. For IBS, IBD, SIBO, eating disorders, or prescribed diets, rely on qualified professionals. Instacart, Spoonacular, and Dr. Bulsiewicz’s programs are separate services; this app is not endorsed by them.
