import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  boolean,
  uniqueIndex,
  index,
  customType,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/* -------------------------------------------------------------------------- */
/*  Shared JSON shapes                                                         */
/* -------------------------------------------------------------------------- */

export type BrandOverrides = {
  primary?: string;
  accent?: string;
  bg?: string;
  fg?: string;
  headingFont?: string;
  bodyFont?: string;
  radius?: string;
};

export type StoreContent = {
  announcement?: string;
  heroEyebrow?: string;
  heroHeadline?: string;
  heroSub?: string;
  heroCta?: string;
  heroImage?: string;
  aboutTitle?: string;
  aboutText?: string;
  trustItems?: string[];
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  email?: string;
  footerNote?: string;
};

export type StoreSettings = {
  currency: "DZD";
  language: "fr" | "ar";
  homeDeliveryFee: number;
  deskDeliveryFee: number;
  freeShippingThreshold: number | null;
  rateOverrides: Record<string, { home: number; desk: number }>;
  returnDays: number;
  checkoutNote?: string;
};

export type ProductFeature = { title: string; text: string };
export type ProductOption = { name: string; values: string[] };

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
  variant?: string | null;
  image?: string | null;
};

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "returned",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PLAN_IDS = ["starter", "growth", "scale"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

/* -------------------------------------------------------------------------- */
/*  Auth                                                                        */
/* -------------------------------------------------------------------------- */

// In Supabase mode the `id` mirrors auth.users.id and passwordHash stays null.
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default(""),
  passwordHash: text("password_hash"),
  authProvider: text("auth_provider").notNull().default("local"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(), // sha256 of the cookie token
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/* -------------------------------------------------------------------------- */
/*  Stores                                                                      */
/* -------------------------------------------------------------------------- */

export const stores = pgTable(
  "stores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    publicId: text("public_id").unique(), // merchant-facing ID (ORD-XXXXXX), given to the admin
    subdomain: text("subdomain").notNull().unique(),
    name: text("name").notNull(),
    tagline: text("tagline").notNull().default(""),
    vertical: text("vertical").notNull().default("general"),
    template: text("template").notNull().default("atelier"),
    logoUrl: text("logo_url"),
    brand: jsonb("brand").$type<BrandOverrides>().notNull().default({}),
    content: jsonb("content").$type<StoreContent>().notNull().default({}),
    settings: jsonb("settings")
      .$type<StoreSettings>()
      .notNull()
      .default({
        currency: "DZD",
        language: "fr",
        homeDeliveryFee: 600,
        deskDeliveryFee: 400,
        freeShippingThreshold: null,
        rateOverrides: {},
        returnDays: 14,
      }),
    plan: text("plan").$type<PlanId>().notNull().default("starter"),
    planStatus: text("plan_status").notNull().default("active"),
    trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
    published: boolean("published").notNull().default(true),
    orderSeq: integer("order_seq").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("stores_owner_idx").on(t.ownerId)],
);

/* -------------------------------------------------------------------------- */
/*  Catalog                                                                     */
/* -------------------------------------------------------------------------- */

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    shortDescription: text("short_description").notNull().default(""),
    description: text("description").notNull().default(""),
    price: integer("price").notNull(), // DZD, whole dinars
    compareAtPrice: integer("compare_at_price"),
    images: jsonb("images").$type<string[]>().notNull().default([]),
    features: jsonb("features").$type<ProductFeature[]>().notNull().default([]),
    options: jsonb("options").$type<ProductOption[]>().notNull().default([]),
    status: text("status").notNull().default("active"), // draft | active | archived
    stock: integer("stock"), // null = unlimited
    featured: boolean("featured").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("products_store_slug_idx").on(t.storeId, t.slug),
    index("products_store_idx").on(t.storeId),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Customers & Orders                                                          */
/* -------------------------------------------------------------------------- */

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    phone: text("phone").notNull(),
    name: text("name").notNull(),
    wilayaCode: text("wilaya_code").notNull(),
    commune: text("commune").notNull().default(""),
    address: text("address").notNull().default(""),
    ordersCount: integer("orders_count").notNull().default(0),
    totalSpent: integer("total_spent").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("customers_store_phone_idx").on(t.storeId, t.phone)],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    idempotencyKey: text("idempotency_key").notNull(),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    wilayaCode: text("wilaya_code").notNull(),
    commune: text("commune").notNull().default(""),
    address: text("address").notNull().default(""),
    deliveryType: text("delivery_type").notNull().default("home"), // home | desk
    items: jsonb("items").$type<OrderItem[]>().notNull(),
    subtotal: integer("subtotal").notNull(),
    deliveryFee: integer("delivery_fee").notNull(),
    total: integer("total").notNull(),
    status: text("status").$type<OrderStatus>().notNull().default("pending"),
    customerNote: text("customer_note").notNull().default(""),
    internalNote: text("internal_note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("orders_store_number_idx").on(t.storeId, t.number),
    uniqueIndex("orders_idempotency_idx").on(t.storeId, t.idempotencyKey),
    index("orders_store_status_idx").on(t.storeId, t.status),
    index("orders_store_created_idx").on(t.storeId, t.createdAt),
  ],
);

export const orderEvents = pgTable(
  "order_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("order_events_order_idx").on(t.orderId)],
);

/* -------------------------------------------------------------------------- */
/*  Media (fallback when Supabase Storage is not configured)                    */
/* -------------------------------------------------------------------------- */

export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "cascade" }),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  data: bytea("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  Billing                                                                     */
/* -------------------------------------------------------------------------- */

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    plan: text("plan").$type<PlanId>().notNull(),
    status: text("status").notNull(), // trialing | active | past_due | cancelled
    provider: text("provider").notNull().default("manual"), // chargily | stripe | manual
    providerRef: text("provider_ref"),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  },
  (t) => [index("subscriptions_store_idx").on(t.storeId)],
);

/* -------------------------------------------------------------------------- */
/*  Contact (plan upgrade requests — reviewed manually by the admin)            */
/* -------------------------------------------------------------------------- */

export const contactRequests = pgTable(
  "contact_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    contact: text("contact").notNull(), // email or phone
    plan: text("plan").$type<PlanId>().notNull().default("growth"),
    message: text("message").notNull().default(""),
    source: text("source").notNull().default("contact"), // contact (footer/page form) | plan (plan button)
    status: text("status").notNull().default("open"), // open | handled | closed
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("contact_requests_status_idx").on(t.status)],
);

export type User = typeof users.$inferSelect;
export type Store = typeof stores.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderEvent = typeof orderEvents.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type ContactRequest = typeof contactRequests.$inferSelect;
