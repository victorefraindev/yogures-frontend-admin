# AGENTS.md

Admin panel (SvelteKit) for the "proyecto-yogurt" store. One of three sibling dirs under the `proyecto-yogurt` parent: `frontend-admin` (this), `frontend-clientes`, and `backend/openapi` (the backend API spec, referenced as `../backend/openapi/admin-openapi.yml`).

## Stack
- SvelteKit 2 + Svelte 5; runes mode is forced in `vite.config.ts`.
- `.npmrc` sets `engine-strict=true` — newer Node than supported fails installs.
- Tailwind CSS v4 — CSS-first config lives in `src/app.css` (`@theme` tokens, custom color palette). There is **no** `tailwind.config.*`.
- shadcn-svelte UI components in `src/lib/components/ui/` (config: `components.json`, style `nova`, built on `bits-ui` primitives, `cn()` helper in `src/lib/utils.ts`). Icons: app code imports from `@jis3r/icons`; generated `ui/` components import deep from `@lucide/svelte/icons/*` (don't "fix" one into the other). Charts use `layerchart` + `d3-scale` (dashboard `+page.svelte`, `tasa-bcv`), with chart primitives in `src/lib/components/ui/chart/`.
- **Not a git repo** — the only git repo under `proyecto-yogurt` is `frontend/frontend-clientes/`; don't expect `git` commands to work here.
- There is **no** `svelte.config.*` — SvelteKit config lives in `vite.config.ts` (runes forced, adapter-auto).
- Supabase (`@supabase/supabase-js` + `@supabase/ssr`) para auth y storage de imágenes. Clientes en `src/lib/supabase/` (`client.ts` browser, `server.ts` SSR factory, `storage.ts` upload). Credenciales en `.env` (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
- UI copy, error messages, and code comments are in **Spanish** — keep new text/types in Spanish.

## Commands
- `npm run dev` — dev server.
- `npm run check` — svelte-check typecheck. This is the only verification (no lint or test setup exists). `npm run check:watch` for watch mode.
- `npm run build` / `npm run preview` — production build/preview.

## Architecture
- `src/routes/(panel)/admin/*` is a **CSR/SPA**: `+layout.ts` sets `export const ssr = false`, guards the route client-side and validates the role against `GET /api/admin/auth/verify-role` (if the backend responds).
- `src/routes/(auth)/admin/login` is the only SSR part; its `+page.server.ts` action calls Supabase Auth (`signInWithPassword` via `createServerSupabase` in `$lib/supabase/server.ts`), sets the `jwt` cookie (**non-HttpOnly mock** — value = Supabase `access_token`) and redirects to `/admin`.
- The SPA guard (`src/lib/session.ts`) reads the cookie from `document.cookie` — it only works because the cookie is client-readable. `$lib/supabase/client.ts` keeps the `jwt` cookie fresh via `onAuthStateChange`. Don't switch to HttpOnly until the panel validates the session against the real backend.
- `src/routes/+page.ts` redirects `/` → `/admin`.

## Data layer — wired to the Go backend
- `src/lib/api.ts` (reads) and `src/lib/client-api.ts` (mutations) call the backend at `http://localhost:8080` (env `PUBLIC_API_URL`, defaulted in code) with `credentials: "include"` (cookie `jwt`). Endpoints: `GET /api/admin/users`, `GET /api/admin/client/:userId`, `GET /api/admin/orders` (+ `/details`), `GET /api/products`, `GET /exchange-rate`, `PATCH /api/admin/orders/:orderId/status`, `POST/PUT/DELETE /api/admin/product[/:productId]`, `PATCH /api/admin/product/:productId/status`, `PATCH /api/admin/product/relatedProducts` (relaciona dos yogures del mismo sabor, body `{ id, related_id }`), `POST /api/admin/exchange-rate` (fuerza el refresco de la tasa BCV desde dolarapi; el botón "Actualizar" de Tasa BCV lo invoca). `GET /exchange-rate` se auto-refresca como máximo cada 6 h (throttle en memoria en el handler, se reinicia al reiniciar el backend). No hay endpoint para el histórico (`getTasaBcvHistory()` devuelve `[]`).
- Products now carry `size` (`pequeño`/`grande`, obligatorio desde la creación) and `relatedId` (id del yogur hermano del mismo sabor). El backend genera el `id` como slug del nombre + `-` + tamaño, normalizando diacríticos (`ñ` → `n`, sin acentos) vía `slugify()` en `backend/internal/product/store.go`. **La columna `related_id` de la DB tiene default `'null'` (texto)**: al leer, `toProduct()` en `src/lib/api.ts` normaliza `'null'`/vacío a `undefined` (lo mismo en el storefront `frontend-clientes/lib/api.ts`) para que "sin relación" se trate como tal. En el panel, al crear un producto sin relación se ofrece crear la variante opuesta con el modal precargado (mismo nombre e imagen, tamaño contrario). **Toda relación se escribe en ambos sentidos** con dos llamadas a `relateProducts()` (crear con relación manual, crear la contraparte y editar); al editar y cambiar la relación se limpia el back-pointer del hermano anterior. Tras crear/editar/eliminar se refetchea `getProducts()` (el backend es la fuente de ids reales).
- Contract notes: single `price` per product (no min/max), clients have `phone` (no `direction`), orders are snake_case (`user_id`, `receipt_img`, `created_at`, …) and include `user_id` to map each order to its client. Dashboard aggregates (`byMonth`, `byStatus`, `pendingPayment`) are computed locally from `getOrders()`. **No hay gráficos**: el dashboard y `tasa-bcv` muestran métricas en tarjetas con listas; `layerchart`/`d3-scale` y los primitives `ui/chart/` quedaron sin uso en rutas.
- Auth is real (Supabase Auth, email + password, **sin 2FA**): el usuario se crea en el dashboard de Supabase y las credenciales van en `.env`. Los buckets de Storage ya están configurados: `yogurts` (imágenes de productos, público, `PRODUCTS_BUCKET` en `src/lib/supabase/storage.ts`) y `payment_receipt` (comprobantes de pago, público, `RECEIPTS_BUCKET`). `receiptPublicUrl()` en `storage.ts` arma la URL pública de un comprobante a partir del path almacenado en `receipt_img`.