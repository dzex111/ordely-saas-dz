# ORDELY — Premium COD SaaS for Algeria

Shopify for cash-on-delivery. Merchants sign up, pick one of 7 agency-grade templates, add products and receive
COD orders across the 58 wilayas. Built with Next.js 16 (App Router), Drizzle ORM, PostgreSQL and Supabase.

## Demo
- Landing: `/` · Storefronts: `/maison-yasmine`, `/voltix`, `/nour-skin`, `/dar-olive`, `/iron-dz`, `/sirocco`, `/terroir-dor`
- Merchant login: `demo@ordely.app` / `demo1234!` (store with live orders, customers, Growth trial)
- Seed again anytime: `npx tsx src/db/seed.ts` (idempotent)

## Supabase (plug-in via `.env`)
1. Create a Supabase project. Set `DATABASE_URL` to the **Transaction pooler** URL and run `npx drizzle-kit push`.
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
   Auth switches to Supabase Auth (email/password, cookie sessions via `@supabase/ssr`, refreshed in `src/proxy.ts`).
3. Storage: create a **public** bucket `store-media`. Uploads go to `stores/{storeId}/…` through the service role.
4. Recommended RLS (all app queries go through the server with the service role / direct Postgres, so RLS is defense-in-depth):
```sql
alter table stores enable row level security;
create policy "owner reads own store" on stores for select using (auth.uid() = owner_id);
alter table products enable row level security;
create policy "public reads active products" on products for select using (status = 'active');
```
Without Supabase env vars the platform runs fully self-hosted: scrypt-hashed passwords + DB sessions, and images stored in Postgres served from `/api/media/[id]`.

## Multi-tenancy
`src/proxy.ts` rewrites `{sub}.{NEXT_PUBLIC_ROOT_DOMAIN}/*` → `/{sub}/*`. The path form works everywhere (dev, previews).

## Architecture
- `src/db/schema.ts` — users, sessions, stores (brand/content/settings JSON), products, customers, orders (+ idempotency), order_events, media, subscriptions
- `src/lib/templates.ts` — 7 templates (Atelier, Nova, Bloom, Maison, Pulse, Luxe, Souk): tokens, fonts, layout variants, sample catalog
- `src/components/store/*` — storefront sections (7 hero variants, 7 card variants), gallery, COD checkout
- `src/lib/actions/*` — server actions: auth, store/customize/settings/billing, products (+uploads), orders (checkout & lifecycle)
- `src/app/(dashboard)/dashboard/*` — overview, orders, products, customers, appearance (live preview), settings, billing
