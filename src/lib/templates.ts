import type { BrandOverrides, Store, StoreContent } from "@/db/schema";

export type FontKey =
  | "inter"
  | "cormorant"
  | "space"
  | "fraunces"
  | "nunito"
  | "dmserif"
  | "manrope"
  | "syne"
  | "playfair"
  | "lora"
  | "outfit";

export const FONT_OPTIONS: Record<FontKey, { label: string; css: string; kind: "serif" | "sans" | "display" }> = {
  inter: { label: "Inter", css: "var(--font-inter)", kind: "sans" },
  manrope: { label: "Manrope", css: "var(--font-manrope)", kind: "sans" },
  nunito: { label: "Nunito", css: "var(--font-nunito)", kind: "sans" },
  outfit: { label: "Outfit", css: "var(--font-outfit)", kind: "sans" },
  space: { label: "Space Grotesk", css: "var(--font-space)", kind: "sans" },
  syne: { label: "Syne", css: "var(--font-syne)", kind: "display" },
  cormorant: { label: "Cormorant Garamond", css: "var(--font-cormorant)", kind: "serif" },
  playfair: { label: "Playfair Display", css: "var(--font-playfair)", kind: "serif" },
  fraunces: { label: "Fraunces", css: "var(--font-fraunces)", kind: "serif" },
  dmserif: { label: "DM Serif Display", css: "var(--font-dmserif)", kind: "serif" },
  lora: { label: "Lora", css: "var(--font-lora)", kind: "serif" },
};

export type HeroVariant = "editorial" | "glow" | "soft" | "fullbleed" | "stacked" | "minimal" | "market";
export type CardVariant = "editorial" | "tech" | "soft" | "warm" | "bold" | "luxe" | "market";
export type HeaderVariant = "centered" | "left" | "pill" | "bar";
export type ProductPageVariant = "classic" | "sticky" | "dark" | "soft";

export type TemplateConfig = {
  id: string;
  name: string;
  vertical: string;
  tagline: string;
  description: string;
  mood: string[];
  colors: { bg: string; fg: string; primary: string; primaryFg: string; accent: string; muted: string; card: string; border: string };
  fonts: { heading: FontKey; body: FontKey };
  radius: string;
  layout: {
    hero: HeroVariant;
    card: CardVariant;
    header: HeaderVariant;
    product: ProductPageVariant;
    headingCase: "normal" | "upper";
    headingWeight: number;
    imageRatio: string; // css aspect-ratio for cards
  };
  defaults: Required<Pick<StoreContent, "heroEyebrow" | "heroHeadline" | "heroSub" | "heroCta" | "trustItems" | "aboutTitle" | "aboutText">>;
  sampleProducts: { name: string; price: number; compareAt?: number; short: string; image: string; features: { title: string; text: string }[]; options?: { name: string; values: string[] }[] }[];
};

const img = (id: string, w = 1400) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const TEMPLATES: TemplateConfig[] = [
  {
    id: "atelier",
    name: "Atelier",
    vertical: "Mode & Prêt-à-porter",
    tagline: "Éditorial, silencieux, désirable.",
    description: "Une mise en page magazine : grands visuels, serif élégant, respiration généreuse. Pour les marques de vêtements, abayas, chaussures et accessoires.",
    mood: ["Éditorial", "Crème & noir", "Serif"],
    colors: { bg: "#F6F1EA", fg: "#141210", primary: "#141210", primaryFg: "#F6F1EA", accent: "#B8552F", muted: "#6F675E", card: "#EFE8DE", border: "#DED5C8" },
    fonts: { heading: "cormorant", body: "inter" },
    radius: "0px",
    layout: { hero: "editorial", card: "editorial", header: "centered", product: "classic", headingCase: "normal", headingWeight: 500, imageRatio: "3 / 4" },
    defaults: {
      heroEyebrow: "Nouvelle collection",
      heroHeadline: "Des pièces pensées pour durer, portées pour être remarquées.",
      heroSub: "Coupes précises, matières nobles, livraison partout en Algérie. Payez à la réception.",
      heroCta: "Découvrir la collection",
      trustItems: ["Paiement à la livraison", "Livraison 58 wilayas", "Échange sous 14 jours"],
      aboutTitle: "L’atelier",
      aboutText: "Chaque pièce est dessinée à Alger et confectionnée en petites séries. Nous privilégions les matières naturelles et les finitions qui traversent les saisons.",
    },
    sampleProducts: [
      { name: "Trench Sahel en lin", price: 12900, compareAt: 15900, short: "Trench léger en lin lavé, coupe droite, ceinture amovible.", image: img("photo-1539533018447-63fcce2678e3"), features: [{ title: "Matière", text: "100% lin lavé, 240g" }, { title: "Coupe", text: "Droite, tombe sur la hanche" }, { title: "Entretien", text: "Lavage 30°, séchage à plat" }], options: [{ name: "Taille", values: ["S", "M", "L", "XL"] }, { name: "Couleur", values: ["Sable", "Noir"] }] },
      { name: "Robe Casbah plissée", price: 8900, short: "Robe midi plissée soleil, taille marquée, fluide au mouvement.", image: img("photo-1496747611176-843222e1e57c"), features: [{ title: "Matière", text: "Crêpe de viscose" }, { title: "Longueur", text: "Midi, 118 cm" }], options: [{ name: "Taille", values: ["S", "M", "L"] }] },
      { name: "Sac cabas Médina", price: 6400, short: "Cabas en cuir grainé, doublure coton, fermeture aimantée.", image: img("photo-1584917865442-de89df76afd3"), features: [{ title: "Cuir", text: "Cuir de vachette grainé" }, { title: "Dimensions", text: "38 × 30 × 14 cm" }] },
    ],
  },
  {
    id: "nova",
    name: "Nova",
    vertical: "Tech & Gadgets",
    tagline: "Sombre, précis, futuriste.",
    description: "Interface dark avec halos lumineux, grilles de spécifications et cartes verre. Pour écouteurs, smartphones, accessoires, gaming et domotique.",
    mood: ["Dark", "Néon violet", "Grotesk"],
    colors: { bg: "#0B0D12", fg: "#F2F4F8", primary: "#7C5CFF", primaryFg: "#FFFFFF", accent: "#22D3EE", muted: "#8B93A7", card: "#12151D", border: "#20242F" },
    fonts: { heading: "space", body: "inter" },
    radius: "16px",
    layout: { hero: "glow", card: "tech", header: "pill", product: "dark", headingCase: "normal", headingWeight: 600, imageRatio: "1 / 1" },
    defaults: {
      heroEyebrow: "Garantie 12 mois incluse",
      heroHeadline: "La tech qui mérite votre bureau.",
      heroSub: "Produits originaux, testés avant expédition. Payez à la livraison, partout en Algérie.",
      heroCta: "Voir les produits",
      trustItems: ["Produits 100% originaux", "Testé avant envoi", "Garantie 12 mois", "Paiement à la réception"],
      aboutTitle: "Pourquoi nous",
      aboutText: "Nous importons directement auprès des fabricants agréés et vérifions chaque unité. Pas de contrefaçon, pas de surprise.",
    },
    sampleProducts: [
      { name: "Écouteurs ANC Pro 2", price: 14500, compareAt: 18900, short: "Réduction de bruit active hybride, 36h d’autonomie, Bluetooth 5.3.", image: img("photo-1590658268037-6bf12165a8df"), features: [{ title: "Autonomie", text: "36h avec boîtier" }, { title: "ANC", text: "Hybride –42 dB" }, { title: "Codec", text: "AAC, LDAC" }], options: [{ name: "Couleur", values: ["Graphite", "Blanc"] }] },
      { name: "Clavier mécanique 75%", price: 19900, short: "Switches linéaires pré-lubrifiés, hot-swap, gasket mount, RGB sud.", image: img("photo-1618384887929-16ec33fab9ef"), features: [{ title: "Switches", text: "Linéaires 45g, hot-swap" }, { title: "Connexion", text: "USB-C, 2.4G, BT" }], options: [{ name: "Layout", values: ["AZERTY", "QWERTY"] }] },
      { name: "Chargeur GaN 100W", price: 6900, short: "3 ports USB-C + 1 USB-A, charge un laptop et deux téléphones.", image: img("photo-1583863788434-e58a36330cf0"), features: [{ title: "Puissance", text: "100W total" }, { title: "Ports", text: "3× USB-C, 1× USB-A" }] },
    ],
  },
  {
    id: "bloom",
    name: "Bloom",
    vertical: "Beauté & Soins",
    tagline: "Doux, lumineux, rassurant.",
    description: "Palette rosée, coins très arrondis, typographie chaleureuse et rituels illustrés. Pour cosmétiques, skincare, parfums légers et bien-être.",
    mood: ["Pastel", "Arrondi", "Chaleureux"],
    colors: { bg: "#FFF7F4", fg: "#3B2A2A", primary: "#D9738A", primaryFg: "#FFFFFF", accent: "#6FA287", muted: "#8A6F70", card: "#FFFFFF", border: "#F3DCD9" },
    fonts: { heading: "fraunces", body: "nunito" },
    radius: "24px",
    layout: { hero: "soft", card: "soft", header: "left", product: "soft", headingCase: "normal", headingWeight: 500, imageRatio: "4 / 5" },
    defaults: {
      heroEyebrow: "Formules propres · Testées dermatologiquement",
      heroHeadline: "Une peau apaisée, un rituel qui vous ressemble.",
      heroSub: "Des soins doux, sans parfum agressif, livrés chez vous. Vous payez à la réception.",
      heroCta: "Composer mon rituel",
      trustItems: ["Sans parabènes", "Non testé sur animaux", "Livraison discrète", "Satisfaite ou échangée"],
      aboutTitle: "Notre promesse",
      aboutText: "Des formules courtes, des actifs dosés efficacement, et une transparence totale sur ce que vous appliquez sur votre peau.",
    },
    sampleProducts: [
      { name: "Sérum Éclat Vitamine C", price: 4200, compareAt: 5200, short: "Sérum 15% vitamine C stabilisée, unifie et illumine en 4 semaines.", image: img("photo-1620916566398-39f1143ab7be"), features: [{ title: "Actifs", text: "Vit. C 15%, acide férulique" }, { title: "Texture", text: "Fluide, absorption rapide" }, { title: "Usage", text: "Matin, avant SPF" }] },
      { name: "Crème Nuit Réparatrice", price: 3800, short: "Céramides + peptides pour une barrière cutanée restaurée au réveil.", image: img("photo-1556228720-195a672e8a03"), features: [{ title: "Actifs", text: "Céramides, peptides" }, { title: "Format", text: "50 ml" }] },
      { name: "Huile Cheveux Argan Pur", price: 2900, short: "Argan pressé à froid, nourrit sans alourdir, brillance immédiate.", image: img("photo-1608248543803-ba4f8c70ae0b"), features: [{ title: "Origine", text: "Argan 100% pur" }, { title: "Format", text: "100 ml" }] },
    ],
  },
  {
    id: "maison",
    name: "Maison",
    vertical: "Maison & Décoration",
    tagline: "Chaleureux, terreux, intemporel.",
    description: "Photographie plein écran, tons terre, serif italique et grilles d’objets. Pour décoration, luminaires, textile maison, céramique et mobilier.",
    mood: ["Terre", "Plein écran", "Artisanal"],
    colors: { bg: "#F4EFE6", fg: "#2B2622", primary: "#5B5A46", primaryFg: "#F4EFE6", accent: "#C7A27C", muted: "#7A7166", card: "#EBE4D8", border: "#DDD4C5" },
    fonts: { heading: "dmserif", body: "manrope" },
    radius: "8px",
    layout: { hero: "fullbleed", card: "warm", header: "left", product: "classic", headingCase: "normal", headingWeight: 400, imageRatio: "1 / 1" },
    defaults: {
      heroEyebrow: "Fait main · Petites séries",
      heroHeadline: "Des objets qui rendent une maison habitée.",
      heroSub: "Céramique, lin, bois d’olivier. Livraison soignée dans toute l’Algérie, paiement à la réception.",
      heroCta: "Explorer la maison",
      trustItems: ["Emballage renforcé", "Livraison 58 wilayas", "Casse remboursée", "Paiement à la livraison"],
      aboutTitle: "La maison",
      aboutText: "Nous travaillons avec des artisans de Kabylie, de Ghardaïa et d’Oran pour des pièces qui gardent la trace de la main.",
    },
    sampleProducts: [
      { name: "Vase céramique Tassili", price: 5600, short: "Vase tourné main, émail mat sable, 28 cm.", image: img("photo-1578500494198-246f612d3b3d"), features: [{ title: "Matière", text: "Grès émaillé" }, { title: "Hauteur", text: "28 cm" }] },
      { name: "Plaid lin lavé Aurès", price: 7900, compareAt: 9500, short: "Plaid 130 × 180 cm en lin lavé, doux dès le premier jour.", image: img("photo-1522758971460-1d21eed7dc1d"), features: [{ title: "Matière", text: "100% lin lavé" }, { title: "Dimensions", text: "130 × 180 cm" }], options: [{ name: "Couleur", values: ["Ocre", "Argile", "Olive"] }] },
      { name: "Lampe à poser Djerba", price: 11800, short: "Abat-jour en raphia tressé, base bois d’olivier, ampoule E27 incluse.", image: img("photo-1513506003901-1e6a229e2d15"), features: [{ title: "Matières", text: "Raphia, olivier" }, { title: "Hauteur", text: "46 cm" }] },
    ],
  },
  {
    id: "pulse",
    name: "Pulse",
    vertical: "Sport & Fitness",
    tagline: "Brut, rapide, énergique.",
    description: "Typographie géante, contrastes noir/volt, bandeaux défilants et fiches produits musclées. Pour compléments, équipement, sportswear et outdoor.",
    mood: ["Bold", "Noir & volt", "Uppercase"],
    colors: { bg: "#FFFFFF", fg: "#0A0A0A", primary: "#0A0A0A", primaryFg: "#D7FF3F", accent: "#D7FF3F", muted: "#5B5B5B", card: "#F3F3F3", border: "#E3E3E3" },
    fonts: { heading: "syne", body: "inter" },
    radius: "4px",
    layout: { hero: "stacked", card: "bold", header: "bar", product: "sticky", headingCase: "upper", headingWeight: 800, imageRatio: "1 / 1" },
    defaults: {
      heroEyebrow: "Expédié sous 24h",
      heroHeadline: "Entraîne-toi. Récupère. Recommence.",
      heroSub: "Équipement et nutrition sélectionnés par des athlètes. Payez quand vous recevez.",
      heroCta: "Shop maintenant",
      trustItems: ["Authenticité garantie", "Expédition 24h", "Retour 14 jours", "COD partout"],
      aboutTitle: "Le crew",
      aboutText: "Nous testons chaque produit à la salle avant de le mettre en ligne. Si ça ne tient pas la distance, ce n’est pas ici.",
    },
    sampleProducts: [
      { name: "Whey Isolate 2kg", price: 11900, compareAt: 13500, short: "90% protéines, 0 sucre, digestion rapide. 66 doses.", image: img("photo-1593095948071-474c5cc2989d"), features: [{ title: "Protéines", text: "27g / dose" }, { title: "Doses", text: "66" }], options: [{ name: "Goût", values: ["Chocolat", "Vanille", "Fraise"] }] },
      { name: "Bandes de résistance Set", price: 3400, short: "5 niveaux de résistance, latex naturel, sac inclus.", image: img("photo-1598289431512-b97b0917affc"), features: [{ title: "Niveaux", text: "5 (5–40 kg)" }, { title: "Matière", text: "Latex naturel" }] },
      { name: "Gourde Inox 1L", price: 2800, short: "Double paroi, garde le froid 24h, bouchon sport anti-fuite.", image: img("photo-1602143407151-7111542de6e8"), features: [{ title: "Capacité", text: "1 L" }, { title: "Isolation", text: "24h froid / 12h chaud" }], options: [{ name: "Couleur", values: ["Noir", "Volt"] }] },
    ],
  },
  {
    id: "luxe",
    name: "Luxe",
    vertical: "Bijoux, Parfums & Montres",
    tagline: "Noir, or, silence.",
    description: "Ultra-minimal : fond nuit, accents dorés, filets fins et beaucoup d’air. Pour bijouterie, parfumerie, horlogerie et cadeaux premium.",
    mood: ["Noir & or", "Minimal", "Précieux"],
    colors: { bg: "#0E0D0B", fg: "#EDE6D6", primary: "#C9A961", primaryFg: "#0E0D0B", accent: "#C9A961", muted: "#9A917F", card: "#161410", border: "#2A261F" },
    fonts: { heading: "playfair", body: "inter" },
    radius: "0px",
    layout: { hero: "minimal", card: "luxe", header: "centered", product: "dark", headingCase: "normal", headingWeight: 400, imageRatio: "4 / 5" },
    defaults: {
      heroEyebrow: "Maison fondée à Alger",
      heroHeadline: "L’élégance se porte, elle ne se crie pas.",
      heroSub: "Pièces authentiques, écrin offert, livraison assurée. Réglez à la remise en main propre.",
      heroCta: "Voir la collection",
      trustItems: ["Certificat d’authenticité", "Écrin offert", "Livraison assurée", "Paiement à la réception"],
      aboutTitle: "La maison",
      aboutText: "Nous sélectionnons des pièces intemporelles auprès de maisons reconnues. Chaque commande est vérifiée, scellée et suivie.",
    },
    sampleProducts: [
      { name: "Montre Automatique Sirocco", price: 48000, short: "Mouvement automatique, saphir, bracelet cuir italien.", image: img("photo-1524592094714-0f0654e20314"), features: [{ title: "Mouvement", text: "Automatique 21 rubis" }, { title: "Verre", text: "Saphir" }, { title: "Étanchéité", text: "5 ATM" }] },
      { name: "Eau de Parfum Oud Royal", price: 15500, compareAt: 18000, short: "Oud, safran, rose de Taïf. Tenue 12h+. 100 ml.", image: img("photo-1541643600914-78b084683601"), features: [{ title: "Notes", text: "Oud, safran, rose" }, { title: "Format", text: "100 ml" }] },
      { name: "Collier Or 18k Lune", price: 62000, short: "Or jaune 18 carats, pendentif croissant serti, chaîne 45 cm.", image: img("photo-1599643478518-a784e5dc4c8f"), features: [{ title: "Or", text: "18k poinçonné" }, { title: "Chaîne", text: "45 cm" }] },
    ],
  },
  {
    id: "souk",
    name: "Souk",
    vertical: "Épicerie fine & Artisanat",
    tagline: "Généreux, coloré, authentique.",
    description: "Étiquettes, tampons, couleurs safran et olive, ton chaleureux. Pour dattes, huiles, miel, épices, pâtisseries et produits du terroir.",
    mood: ["Terroir", "Safran & olive", "Étiquettes"],
    colors: { bg: "#FBF6EC", fg: "#2E2A1F", primary: "#2F6B3A", primaryFg: "#FBF6EC", accent: "#E0A526", muted: "#77705F", card: "#FFFFFF", border: "#EADFC8" },
    fonts: { heading: "lora", body: "outfit" },
    radius: "12px",
    layout: { hero: "market", card: "market", header: "bar", product: "classic", headingCase: "normal", headingWeight: 600, imageRatio: "1 / 1" },
    defaults: {
      heroEyebrow: "Du producteur à votre table",
      heroHeadline: "Le goût du terroir algérien, livré chez vous.",
      heroSub: "Dattes Deglet Nour, huile d’olive de Kabylie, miel de montagne. Payez à la livraison.",
      heroCta: "Remplir mon panier",
      trustItems: ["Récolte de l’année", "Producteurs identifiés", "Livraison rapide", "Paiement à la réception"],
      aboutTitle: "Nos producteurs",
      aboutText: "Nous achetons en direct auprès de coopératives et de familles productrices. Prix justes pour eux, qualité garantie pour vous.",
    },
    sampleProducts: [
      { name: "Dattes Deglet Nour 1kg", price: 1800, short: "Branchées, récolte Tolga, calibre premium, sucrées et fondantes.", image: img("photo-1601045569976-699ab3c3ce8b"), features: [{ title: "Origine", text: "Tolga, Biskra" }, { title: "Poids", text: "1 kg" }] },
      { name: "Huile d’olive extra vierge 1L", price: 2400, compareAt: 2800, short: "Première pression à froid, acidité < 0,3%, Kabylie.", image: img("photo-1474979266404-7eaacbcd87c5"), features: [{ title: "Acidité", text: "< 0,3%" }, { title: "Origine", text: "Béjaïa" }] },
      { name: "Miel de jujubier 500g", price: 4500, short: "Miel de sidr brut, non chauffé, récolté dans les Aurès.", image: img("photo-1587049352846-4a222e784d38"), features: [{ title: "Type", text: "Sidr (jujubier)" }, { title: "Poids", text: "500 g" }] },
    ],
  },
];

export const TEMPLATE_IDS = TEMPLATES.map((t) => t.id);

export function getTemplate(id: string): TemplateConfig {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

export type ResolvedTheme = {
  template: TemplateConfig;
  cssVars: Record<string, string>;
  content: Required<TemplateConfig["defaults"]> & StoreContent;
};

function isHex(v?: string): v is string {
  return !!v && /^#[0-9a-fA-F]{6}$/.test(v);
}

/** Merge template defaults with merchant overrides into CSS variables + content. */
export function resolveTheme(store: Pick<Store, "template" | "brand" | "content">): ResolvedTheme {
  const template = getTemplate(store.template);
  const b: BrandOverrides = store.brand ?? {};
  const c = template.colors;
  const heading = FONT_OPTIONS[(b.headingFont as FontKey) in FONT_OPTIONS ? (b.headingFont as FontKey) : template.fonts.heading];
  const body = FONT_OPTIONS[(b.bodyFont as FontKey) in FONT_OPTIONS ? (b.bodyFont as FontKey) : template.fonts.body];
  const cssVars: Record<string, string> = {
    "--bg": isHex(b.bg) ? b.bg : c.bg,
    "--fg": isHex(b.fg) ? b.fg : c.fg,
    "--primary": isHex(b.primary) ? b.primary : c.primary,
    "--primary-fg": c.primaryFg,
    "--accent": isHex(b.accent) ? b.accent : c.accent,
    "--muted": c.muted,
    "--card": c.card,
    "--border": c.border,
    "--radius": b.radius && /^\d{1,2}px$/.test(b.radius) ? b.radius : template.radius,
    "--font-heading": heading.css,
    "--font-body": body.css,
    "--heading-weight": String(template.layout.headingWeight),
    "--heading-case": template.layout.headingCase === "upper" ? "uppercase" : "none",
    "--img-ratio": template.layout.imageRatio,
  };
  // If merchant customised primary, derive readable foreground.
  if (isHex(b.primary)) cssVars["--primary-fg"] = contrastFg(b.primary);
  const content = { ...template.defaults, ...stripEmpty(store.content ?? {}) };
  return { template, cssVars, content };
}

function stripEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const k in obj) {
    const v = obj[k];
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    out[k] = v;
  }
  return out;
}

export function contrastFg(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const bl = parseInt(hex.slice(5, 7), 16);
  const l = (0.299 * r + 0.587 * g + 0.114 * bl) / 255;
  return l > 0.6 ? "#111111" : "#FFFFFF";
}
