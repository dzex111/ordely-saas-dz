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
  maxQtyPerOrder: number; // anti-spam: max units of one product per order
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

export const PLAN_IDS = ["starter", "pro", "business"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

/** Legacy ids kept for the one-way DB migration (growth→pro, scale→business). */
export const LEGACY_PLAN_IDS = ["growth", "scale"] as const;

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
    customDomain: text("custom_domain"), // PRO+: merchant-owned hostname (null = none), unique enforced by DB constraint below
    customDomainStatus: text("custom_domain_status").notNull().default("none"), // none | pending | active
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
        maxQtyPerOrder: 5,
      }),
    plan: text("plan").$type<PlanId>().notNull().default("starter"),
    planStatus: text("plan_status").notNull().default("active"),
    trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
    published: boolean("published").notNull().default(true),
    suspended: boolean("suspended").notNull().default(false), // admin-only kill switch; merchant cannot unset
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
    ip: text("ip"), // abuse rate-limiting (orders per IP per store)
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
    plan: text("plan").$type<PlanId>().notNull().default("starter"),
    message: text("message").notNull().default(""),
    source: text("source").notNull().default("contact"), // contact (footer/page form) | plan (plan button)
    ip: text("ip"), // abuse rate-limiting
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

/* -------------------------------------------------------------------------- */
/*  Notifications (merchant inbox: new orders, plan changes, restrictions)      */
/* -------------------------------------------------------------------------- */

export const NOTIFICATION_TYPES = ["new_order", "plan_changed", "suspended", "unsuspended", "limit_warning"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    type: text("type").$type<NotificationType>().notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    link: text("link").notNull().default(""),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_store_idx").on(t.storeId), index("notifications_store_read_idx").on(t.storeId, t.readAt)],
);

export type Notification = typeof notifications.$inferSelect;

/* -------------------------------------------------------------------------- */
/*  AI usage (metered credits — subscription + included quota + paid top-ups)   */
/*  AI is NEVER unlimited, on any plan. Quotas live in plans.ts (central).      */
/* -------------------------------------------------------------------------- */

export const aiUsage = pgTable(
  "ai_usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().default("confirmation"), // confirmation | chatbot | ...
    units: integer("units").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ai_usage_store_idx").on(t.storeId), index("ai_usage_store_created_idx").on(t.storeId, t.createdAt)],
);

export type AiUsage = typeof aiUsage.$inferSelect;

/* -------------------------------------------------------------------------- */
/*  Shipping (provider layer: merchant brings their own courier account)        */
/*  ORDELY never pays shipping — it manages + tracks. New company = new row.   */
/* -------------------------------------------------------------------------- */

export const shippingCredentials = pgTable(
  "shipping_credentials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(), // yalidine | zr | ecotrack
    company: text("company"), // EcoTrack tenant id (dhd, conexlog, …) or null
    label: text("label").notNull().default(""),
    credentials: jsonb("credentials").$type<Record<string, string>>().notNull().default({}),
    isActive: boolean("is_active").notNull().default(true),
    lastTestAt: timestamp("last_test_at", { withTimezone: true }),
    lastTestOk: boolean("last_test_ok"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("shipping_credentials_store_idx").on(t.storeId)],
);

export const shipments = pgTable(
  "shipments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" })
      .unique(),
    provider: text("provider").notNull(),
    company: text("company"),
    trackingNumber: text("tracking_number").notNull(),
    labelUrl: text("label_url"),
    status: text("status").notNull().default("created"),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    raw: jsonb("raw").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("shipments_store_idx").on(t.storeId)],
);

export type ShippingCredential = typeof shippingCredentials.$inferSelect;
export type Shipment = typeof shipments.$inferSelect;

/* -------------------------------------------------------------------------- */
/*  Team (PRO: 3 seats, BUSINESS: 10 — Starter is owner-only, UI hidden)        */
/*  The owner is implicit via stores.ownerId and never has a member row.        */
/* -------------------------------------------------------------------------- */

export const MEMBER_ROLES = ["admin", "member"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];
export type TeamRole = "owner" | MemberRole;

export const storeMembers = pgTable(
  "store_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").$type<MemberRole>().notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("store_members_store_user_idx").on(t.storeId, t.userId), index("store_members_user_idx").on(t.userId)],
);

export const storeInvites = pgTable(
  "store_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role").$type<MemberRole>().notNull().default("member"),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("store_invites_store_idx").on(t.storeId)],
);

export type StoreMember = typeof storeMembers.$inferSelect;
export type StoreInvite = typeof storeInvites.$inferSelect;
