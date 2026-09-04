/**
 * Demo seed — idempotent. Creates one showcase store per template plus a demo
 * merchant account (demo@ordely.app / demo1234!) whose store has live orders.
 * Run: npx tsx src/db/seed.ts
 */
import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import { db, pool } from "./index";
import { customers, orderEvents, orders, products, stores, subscriptions, users, type OrderStatus } from "./schema";
import { TEMPLATES } from "../lib/templates";
import { hashPassword } from "../lib/auth";
import { slugify } from "../lib/utils";
import { computeDeliveryFee } from "../lib/commerce";
import { WILAYAS } from "../lib/algeria";

const DEMO_STORES: Record<string, { name: string; sub: string; phone: string; announcement: string }> = {
  atelier: { name: "Maison Yasmine", sub: "maison-yasmine", phone: "0550123456", announcement: "Nouvelle collection · Livraison offerte dès 15 000 DA · Paiement à la réception" },
  nova: { name: "Voltix", sub: "voltix", phone: "0661234567", announcement: "Produits 100% originaux · Garantie 12 mois · Livraison 58 wilayas" },
  bloom: { name: "Nour Skin", sub: "nour-skin", phone: "0770123456", announcement: "Rituel offert dès 2 articles · Livraison discrète" },
  maison: { name: "Dar Olive", sub: "dar-olive", phone: "0551987654", announcement: "Fait main en Algérie · Casse remboursée" },
  pulse: { name: "IRON DZ", sub: "iron-dz", phone: "0662345678", announcement: "EXPÉDIÉ SOUS 24H · COD PARTOUT · AUTHENTIQUE" },
  luxe: { name: "Maison Sirocco", sub: "sirocco", phone: "0553456789", announcement: "Écrin offert · Certificat d’authenticité · Livraison assurée" },
  souk: { name: "Terroir d’Or", sub: "terroir-dor", phone: "0771122334", announcement: "Récolte 2025 · Du producteur à votre table" },
};

const NAMES = ["Amina Benali", "Yacine Boudiaf", "Sarah Khelifi", "Mohamed Larbi", "Lina Haddad", "Karim Meziane", "Nesrine Ait Ahmed", "Riad Belkacem", "Imene Cherif", "Sofiane Ziani", "Meriem Touati", "Walid Saidi"];
const COMMUNES = ["Hydra", "Bab Ezzouar", "Kouba", "Es Senia", "Bir El Djir", "El Khroub", "Sidi Mabrouk", "Béjaïa centre", "Tizi Ouzou centre", "Blida centre", "Sétif centre", "Batna centre"];

async function main() {
  const existing = await db.query.users.findFirst({ where: eq(users.email, "demo@ordely.app") });
  if (existing) {
    console.log("Seed already applied — skipping.");
    return;
  }

  for (const tpl of TEMPLATES) {
    const d = DEMO_STORES[tpl.id];
    const isDemo = tpl.id === "atelier";
    const [user] = await db
      .insert(users)
      .values({ email: isDemo ? "demo@ordely.app" : `demo-${tpl.id}@ordely.app`, name: isDemo ? "Yasmine Demo" : `${d.name} Team`, passwordHash: hashPassword("demo1234!") })
      .returning();
    const [store] = await db
      .insert(stores)
      .values({
        ownerId: user.id,
        name: d.name,
        subdomain: d.sub,
        template: tpl.id,
        vertical: tpl.vertical,
        tagline: tpl.tagline,
        content: { phone: d.phone, whatsapp: d.phone, instagram: `@${d.sub}`, email: `contact@${d.sub}.dz` },
        settings: { currency: "DZD", language: "fr", homeDeliveryFee: 600, deskDeliveryFee: 400, freeShippingThreshold: isDemo ? 15000 : null, rateOverrides: isDemo ? { "16": { home: 400, desk: 250 }, "31": { home: 500, desk: 350 }, "01": { home: 1200, desk: 900 } } : {}, returnDays: 14, maxQtyPerOrder: 5 },
        plan: isDemo ? "pro" : "starter",
        planStatus: "active",
        trialEndsAt: null,
      })
      .returning();
    await db.insert(subscriptions).values({ storeId: store.id, plan: store.plan, status: store.planStatus, provider: "manual" });

    const prods = await db
      .insert(products)
      .values(
        tpl.sampleProducts.map((p, i) => ({
          storeId: store.id,
          name: p.name,
          slug: slugify(p.name),
          shortDescription: p.short,
          description: `${p.short}\n\nNous vérifions chaque pièce avant expédition. Livraison partout en Algérie, paiement à la réception : vous ouvrez, vous vérifiez, puis vous réglez le livreur.\n\nUne question ? Écrivez-nous sur WhatsApp, nous répondons en quelques minutes.`,
          price: p.price,
          compareAtPrice: p.compareAt ?? null,
          images: [p.image],
          features: p.features,
          options: p.options ?? [],
          featured: i === 0,
          sortOrder: i,
          stock: i === 2 ? 8 : null,
        })),
      )
      .returning();

    if (!isDemo) continue;

    // Realistic order history for the demo dashboard.
    const statuses: OrderStatus[] = ["delivered", "delivered", "delivered", "shipped", "confirmed", "pending", "pending", "delivered", "returned", "cancelled", "delivered", "shipped", "delivered", "confirmed", "pending", "delivered"];
    let seq = 0;
    for (let i = 0; i < statuses.length; i++) {
      const p = prods[i % prods.length];
      const w = WILAYAS[[15, 30, 24, 8, 5, 18, 14, 4, 15, 15, 30, 22, 9, 15, 34, 5][i]];
      const qty = i % 5 === 0 ? 2 : 1;
      const deliveryType = i % 3 === 0 ? "desk" : "home";
      const subtotal = p.price * qty;
      const fee = computeDeliveryFee(store.settings, w.code, deliveryType, subtotal);
      const total = subtotal + fee;
      const createdAt = new Date(Date.now() - (statuses.length - i) * 0.8 * 86400_000 - i * 3600_000);
      const phone = `05${String(50000000 + i * 1234567).slice(0, 8)}`;
      const name = NAMES[i % NAMES.length];
      seq += 1;
      const [cust] = await db
        .insert(customers)
        .values({ storeId: store.id, phone, name, wilayaCode: w.code, commune: COMMUNES[i % COMMUNES.length], address: `Cité ${120 + i}, Bt ${i + 1}`, ordersCount: 1, totalSpent: total, createdAt, updatedAt: createdAt })
        .onConflictDoUpdate({ target: [customers.storeId, customers.phone], set: { ordersCount: sql`${customers.ordersCount} + 1`, totalSpent: sql`${customers.totalSpent} + ${total}` } })
        .returning();
      const variant = p.options.length ? p.options.map((o) => o.values[i % o.values.length]).join(" / ") : null;
      const [o] = await db
        .insert(orders)
        .values({
          storeId: store.id,
          number: seq,
          customerId: cust.id,
          idempotencyKey: `seed-${i}`,
          customerName: name,
          customerPhone: phone,
          wilayaCode: w.code,
          commune: COMMUNES[i % COMMUNES.length],
          address: deliveryType === "home" ? `Cité ${120 + i}, Bt ${i + 1}` : "",
          deliveryType,
          items: [{ productId: p.id, name: p.name, price: p.price, qty, variant, image: p.images[0] }],
          subtotal,
          deliveryFee: fee,
          total,
          status: statuses[i],
          customerNote: i === 5 ? "Appeler après 17h svp" : "",
          createdAt,
          updatedAt: new Date(createdAt.getTime() + 36 * 3600_000),
        })
        .returning();
      const PATHS: Record<OrderStatus, OrderStatus[]> = { pending: ["pending"], confirmed: ["pending", "confirmed"], shipped: ["pending", "confirmed", "shipped"], delivered: ["pending", "confirmed", "shipped", "delivered"], returned: ["pending", "confirmed", "shipped", "returned"], cancelled: ["pending", "cancelled"] };
      const path = PATHS[statuses[i]];
      for (let k = 0; k < path.length; k++) {
        await db.insert(orderEvents).values({ orderId: o.id, fromStatus: k === 0 ? null : path[k - 1], toStatus: path[k], note: k === 0 ? "Commande reçue depuis la boutique." : k === 1 && path[k] === "confirmed" ? "Confirmée par téléphone." : "", createdAt: new Date(createdAt.getTime() + k * 8 * 3600_000) });
      }
    }
    await db.update(stores).set({ orderSeq: seq }).where(eq(stores.id, store.id));
  }
  console.log("Seed complete. Demo login: demo@ordely.app / demo1234!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
