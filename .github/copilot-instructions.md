# Copilot Project Instructions

Purpose: Rapid onboarding for AI coding agents to work effectively in this SafeTravels (RakshaSetu) monorepo-style full‑stack TypeScript app (Express + Vite/React + in‑memory/file persistence + Drizzle schemas for future DB migration).

## Architecture & Runtime
- Single Node.js process serves both API and SPA. `server/index.ts` boots Express, mounts `/api/*` routes (`server/routes.ts`), then either injects Vite dev middleware (development) or serves the built client (production) via `serveStatic`.
- Frontend: React 18 + Vite + Tailwind + Radix UI + Wouter (lightweight router) under `client/src`. Entry HTML: `client/index.html`; TS entry: `client/src/main.tsx` → `<App />` in `client/src/App.tsx`.
- Data layer: Current storage is in-memory maps with JSON file persistence for `tourists` & `trips` (`server/storage.ts`). Domain schemas defined once in `shared/schema.ts` using Drizzle + `drizzle-zod` to derive validation (insert*Schema) and TS types. No live Postgres connection yet; Drizzle used only for schema/type safety.
- Translation/i18n: `client/src/i18n.tsx` loads static JSON (`translations/en.json`, `hi.json`) plus optional runtime fallback auto-translate via `/api/translate` (requires `GOOGLE_TRANSLATE_KEY`). Cached dynamic translations stored in `localStorage` key `fetchedTranslations`.
- Mock blockchain utilities in `client/src/lib/blockchain-utils.ts`; do NOT implement real chain calls unless adding a concrete provider—keep deterministic hash shape (`0x??????????...`).

## Core Conventions
- Shared types: Always import from `@shared/schema` (path alias). Do not duplicate interface shapes in client/server.
- Validation: Use the exported `insertXSchema.parse(req.body)` pattern before hitting storage (see routes). Keep server request handlers thin; push any transformation into storage/helper functions when logic grows.
- Routes pattern: Flat REST under `/api` with nouns; status transitions use subpaths (e.g. `PATCH /api/incidents/:id/status`, `POST /api/trips/start`). Follow existing naming for new resources.
- Persistence: Mutations to tourists or trips must call persistence helpers already in `MemStorage` (see `createTourist`, `saveTripsToDisk`). If adding new persisted entity, mirror approach: Map + JSON file in `server/data/<entity>.json` with ISO date serialization.
- Logging: Only `/api/*` responses are summarized (length-trimmed) in `server/index.ts`. Keep responses concise (< ~80 chars) or expect ellipsis.
- File uploads: Trips and logos use Multer disk storage (`/uploads/trips`, `/uploads/logos`). When adding new upload types, sanitize filenames same way (timestamp + safe chars) to avoid collisions.
- Geo data: Latitude/longitude stored as decimals/strings in schema; convert with `parseFloat` only when needed for map/heatmap calculations.

## Frontend Patterns
- Routing via Wouter `<Switch><Route ...>` inside `App.tsx`. Protect tourist-only pages by checking `currentTourist` in localStorage (pattern already in place). New protected route: follow `component={() => currentTourist ? <Component /> : <Login />}`.
- Data fetching: Use React Query (`queryClient` in `client/src/lib/queryClient.ts`). Create keys as tuple arrays (e.g. `['incidents']`). Invalidate after mutations. Prefer small focused hooks in `client/src/hooks` for reusable logic.
- UI components live under `client/src/components/ui` (Radix primitives + Tailwind). Extend via composition; avoid altering existing variant class APIs (`class-variance-authority`).
- i18n: Wrap new literal strings with `t('key_name')`. If key absent, fallback auto Title-Casing occurs; add to `en.json` then update `hi.json` (or rely on dynamic translate if enabled).

## Build & Run Workflows
- Dev server: `npm run dev` → Express with Vite middleware (hot reload both API + client). Ensure Windows environment variable spacing exactly matches script definition (`set NODE_ENV=development&&`).
- Build: `npm run build` (bundles client via Vite then esbuilds `server/index.ts` to `dist/index.js`). Start production: `npm start` (serves static from `dist/public`).
- Type check: `npm run check`. No separate lint config present—keep TS strictness.
- Demo / integration smoke: `npm run demo` then `npx tsx server/demo/verifyDemo.ts` or use combined `npm run test:integration` which runs scenario using storage.
- Populate translations from server side script: `npm run populate-translations` (invokes `server/scripts/populate-translations.mjs`).

## Adding Features Safely
1. Define schema/types in `shared/schema.ts` (if new entity). Export both table + `insertSchema`; update storage with in-memory Map & JSON persistence (keep date fields serialized to ISO on disk).
2. Add storage methods to `IStorage` & `MemStorage`; persist similarly to `trips`/`tourists` if needed.
3. Expose REST endpoints in `server/routes.ts` using existing parse/try/catch 400 error convention.
4. Frontend: Add React Query hooks + components; integrate routing; ensure keys for caching are consistent.
5. Internationalization: Add new translation keys before committing to avoid runtime fallback thrash.

## Gotchas / Edge Cases
- Duplicate tourist ID numbers: `getTouristByIdNumber` returns most recent by `issuedAt`; do not rely on uniqueness in memory store history.
- Large responses trimmed in logs; debug with direct console if necessary.
- Uploaded files are not cleaned up—avoid naming collisions by always using timestamp prefix.
- `MemStorage` not thread-safe/persistent across restarts beyond JSON dumps; any multi-process scaling would need real DB.
- Translate endpoint returns 501 if key missing—frontend must handle gracefully (current code does).

## Style & PR Expectations (for AI agents)
- Keep functions small; push cross-cutting logic into `storage` instead of inflating route handlers.
- Reuse existing helper patterns instead of new libs; prefer standard library & current stack.
- When extending types, avoid breaking existing consumer imports; add optional fields.

## Quick Reference Examples
- Validate & create incident: `const data = insertIncidentSchema.parse(req.body); const incident = await storage.createIncident(data);`
- Protected route pattern: `component={() => currentTourist ? <Dashboard touristId={currentTourist}/> : <Login />}`
- React Query invalidate example: `queryClient.invalidateQueries(['incidents']);`

(End of instructions. Provide feedback if any area is unclear or missing.)
