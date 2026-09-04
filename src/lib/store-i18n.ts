/* Storefront chrome translations (merchant content stays as the merchant wrote it). */

export type StoreLang = "fr" | "ar";

export const storeLangOf = (language: unknown): StoreLang => (language === "ar" ? "ar" : "fr");

type Dict = {
  // header
  navProducts: string;
  navAbout: string;
  navDelivery: string;
  navContact: string;
  navOrder: string;
  // hero chrome
  codNote: string;
  learnMore: string;
  delivery58: string;
  codBadge: [string, string, string];
  natural: string;
  // home
  selection: string;
  ourProducts: string;
  comingSoon: string;
  productsCount: (n: number) => string;
  codShort: string;
  emptyTitle: string;
  emptyDesc: string;
  step1t: string;
  step1d: string;
  step2t: string;
  step2d: string;
  step3t: string;
  step3d: (days: number) => string;
  // product card
  orderBtn: string;
  shopNow: string;
  saveX: (pct: number) => string;
  soldOut: string;
  noImage: string;
  singlePiece: string;
  // product page
  crumbProducts: string;
  offer: string;
  onlyLeft: (n: number) => string;
  perk1: string;
  perk2: string;
  perk3: string;
  perk4: (days: number) => string;
  story: string;
  alsoLike: string;
  seeAll: string;
  // checkout
  coTitle: string;
  coCod: string;
  coName: string;
  coNamePh: string;
  coPhone: string;
  coPhoneErr: string;
  coWilaya: string;
  coChoose: string;
  coCommune: string;
  coCommunePh: string;
  coHome: string;
  coDesk: string;
  coPerWilaya: string;
  coFree: string;
  coAddress: string;
  coOptional: string;
  coAddrHomePh: string;
  coAddrDeskPh: string;
  coLess: string;
  coMore: string;
  coSubtotal: string;
  coDelivery: string;
  coTotal: string;
  coSending: string;
  coOrderCta: (total: string) => string;
  coSoldOutBtn: string;
  coNeedOptions: string;
  coEtaTo: (eta: string, wilaya: string) => string;
  coEverywhere: string;
  coPayDriver: string;
  coMaxPerOrder: (n: number) => string;
  // thank-you
  tyOrderNo: string;
  tyThanks: (name: string) => string;
  tyReceived1: string;
  tyReceived2: string;
  tyQty: string;
  tyHome: string;
  tyDesk: string;
  tyToPay: string;
  tyAddress: string;
  tyConfirmT: string;
  tyConfirmD: string;
  tyDelivT: string;
  tyDelivD: (eta: string, wilaya: string) => string;
  tyPayT: string;
  tyPayD: (total: string) => string;
  tyContinue: string;
  tyWhatsapp: string;
  tyWaMsg: (n: number, store: string) => string;
  // footer
  fDelivery: string;
  fHome: string;
  fRelay: string;
  fFreeFrom: (amount: string) => string;
  fEta: string;
  fReturns: (days: number) => string;
  fContact: string;
  fAllProducts: string;
  fPowered: string;
  // layout banner + misc
  privateBanner: string;
  gallerySoon: string;
  galleryPrev: string;
  galleryNext: string;
  galleryImage: (n: number) => string;
  etaNorth: string;
  etaHighlands: string;
  etaSouth: string;
};

const fr: Dict = {
  navProducts: "Produits",
  navAbout: "À propos",
  navDelivery: "Livraison",
  navContact: "Contact",
  navOrder: "Commander",
  codNote: "Paiement à la livraison",
  learnMore: "En savoir plus",
  delivery58: "Livraison 58 wilayas",
  codBadge: ["Paiement", "à la", "livraison"],
  natural: "100% naturel",
  selection: "Sélection",
  ourProducts: "Nos produits",
  comingSoon: "Bientôt disponible",
  productsCount: (n) => `${n} ${n > 1 ? "produits" : "produit"} · paiement à la livraison`,
  codShort: "Paiement à la livraison",
  emptyTitle: "La collection arrive très bientôt.",
  emptyDesc: "Suivez-nous pour être averti du lancement. Paiement à la livraison partout en Algérie.",
  step1t: "Vous commandez",
  step1d: "Remplissez le formulaire en 30 secondes. Aucun paiement en ligne, aucune carte.",
  step2t: "Nous confirmons",
  step2d: "Un appel ou un message WhatsApp pour valider votre commande et l’adresse.",
  step3t: "Vous payez à la réception",
  step3d: (days) => `Livraison dans les 58 wilayas. Vous vérifiez, puis vous réglez le livreur. Retour sous ${days} jours.`,
  orderBtn: "Commander",
  shopNow: "Shop →",
  saveX: (pct) => `Économisez ${pct}%`,
  soldOut: "Épuisé",
  noImage: "Sans image",
  singlePiece: "Pièce unique",
  crumbProducts: "Produits",
  offer: "Offre",
  onlyLeft: (n) => `Plus que ${n}`,
  perk1: "Payez à la réception",
  perk2: "58 wilayas livrées",
  perk3: "Confirmation par appel",
  perk4: (days) => `Retour ${days} jours`,
  story: "L’histoire du produit",
  alsoLike: "Vous aimerez aussi",
  seeAll: "Tout voir",
  coTitle: "Commander maintenant",
  coCod: "Paiement à la livraison",
  coName: "Nom complet",
  coNamePh: "Prénom et nom",
  coPhone: "Téléphone",
  coPhoneErr: "Format : 05, 06 ou 07 + 8 chiffres",
  coWilaya: "Wilaya",
  coChoose: "Choisir…",
  coCommune: "Commune",
  coCommunePh: "Votre commune / baladiya",
  coHome: "À domicile",
  coDesk: "Point relais",
  coPerWilaya: "Selon wilaya",
  coFree: "Offerte",
  coAddress: "Adresse",
  coOptional: "(facultatif)",
  coAddrHomePh: "Rue, numéro, repère…",
  coAddrDeskPh: "Bureau du transporteur le plus proche",
  coLess: "Moins",
  coMore: "Plus",
  coSubtotal: "Sous-total",
  coDelivery: "Livraison",
  coTotal: "Total",
  coSending: "Envoi de la commande…",
  coOrderCta: (total) => `Commander · ${total}`,
  coSoldOutBtn: "Épuisé",
  coNeedOptions: "Choisissez vos options pour continuer",
  coEtaTo: (eta, wilaya) => `Livraison ${eta} vers ${wilaya}. `,
  coEverywhere: "Livraison partout en Algérie. ",
  coPayDriver: "Vous payez le livreur à la réception. Confirmation par téléphone.",
  coMaxPerOrder: (n) => `Max ${n} / commande`,
  tyOrderNo: "Commande n°",
  tyThanks: (name) => `Merci, ${name} !`,
  tyReceived1: "Votre commande est bien reçue. Nous vous appelons au",
  tyReceived2: "pour la confirmer avant expédition.",
  tyQty: "Qté",
  tyHome: "domicile",
  tyDesk: "point relais",
  tyToPay: "À payer au livreur",
  tyAddress: "Adresse de livraison",
  tyConfirmT: "Confirmation",
  tyConfirmD: "Appel sous 24h ouvrées",
  tyDelivT: "Livraison",
  tyDelivD: (eta, wilaya) => `${eta} vers ${wilaya}`,
  tyPayT: "Paiement",
  tyPayD: (total) => `${total} en espèces à la réception`,
  tyContinue: "Continuer mes achats",
  tyWhatsapp: "Nous écrire sur WhatsApp",
  tyWaMsg: (n, store) => `Bonjour, je viens de passer la commande n°${n} sur ${store}.`,
  fDelivery: "Livraison",
  fHome: "Domicile",
  fRelay: "Point relais",
  fFreeFrom: (amount) => `Offerte dès ${amount}`,
  fEta: "Nord 24–48h · Sud 3–5 jours",
  fReturns: (days) => `Retour sous ${days} jours`,
  fContact: "Contact",
  fAllProducts: "Tous les produits",
  fPowered: "Propulsé par",
  privateBanner: "Boutique en mode privé — visible uniquement par vous. Publiez-la depuis Paramètres.",
  gallerySoon: "Photos à venir",
  galleryPrev: "Précédente",
  galleryNext: "Suivante",
  galleryImage: (n) => `Image ${n}`,
  etaNorth: "24–48h",
  etaHighlands: "48–72h",
  etaSouth: "3–5 jours",
};

const ar: Dict = {
  navProducts: "المنتجات",
  navAbout: "من نحن",
  navDelivery: "التوصيل",
  navContact: "اتصل بنا",
  navOrder: "اطلب الآن",
  codNote: "الدفع عند الاستلام",
  learnMore: "اعرف المزيد",
  delivery58: "التوصيل لـ 58 ولاية",
  codBadge: ["الدفع", "عند", "الاستلام"],
  natural: "طبيعي 100%",
  selection: "تشكيلتنا",
  ourProducts: "منتجاتنا",
  comingSoon: "قريباً",
  productsCount: (n) => `${n} منتجات · الدفع عند الاستلام`,
  codShort: "الدفع عند الاستلام",
  emptyTitle: "التشكيلة تصل قريباً جداً.",
  emptyDesc: "تابعنا ليصلك جديد الإطلاق. الدفع عند الاستلام في كل الجزائر.",
  step1t: "تطلب",
  step1d: "املأ الاستمارة في 30 ثانية. بدون دفع إلكتروني ولا بطاقة.",
  step2t: "نؤكد طلبك",
  step2d: "مكالمة أو رسالة واتساب لتأكيد طلبك والعنوان.",
  step3t: "تدفع عند الاستلام",
  step3d: (days) => `التوصيل لكل الولايات. تعاين السلعة ثم تدفع للموصّل. الإرجاع خلال ${days} أيام.`,
  orderBtn: "اطلب",
  shopNow: "تسوّق ←",
  saveX: (pct) => `وفّر ${pct}%`,
  soldOut: "نفدت الكمية",
  noImage: "بدون صورة",
  singlePiece: "قطعة مميزة",
  crumbProducts: "المنتجات",
  offer: "عرض خاص",
  onlyLeft: (n) => `لم يتبق سوى ${n}`,
  perk1: "ادفع عند الاستلام",
  perk2: "التوصيل لـ 58 ولاية",
  perk3: "تأكيد عبر مكالمة",
  perk4: (days) => `إرجاع خلال ${days} أيام`,
  story: "قصة المنتج",
  alsoLike: "قد يعجبك أيضاً",
  seeAll: "عرض الكل",
  coTitle: "اطلب الآن",
  coCod: "الدفع عند الاستلام",
  coName: "الاسم الكامل",
  coNamePh: "الاسم واللقب",
  coPhone: "الهاتف",
  coPhoneErr: "الصيغة: 05 أو 06 أو 07 + 8 أرقام",
  coWilaya: "الولاية",
  coChoose: "اختر…",
  coCommune: "البلدية",
  coCommunePh: "بلديتك",
  coHome: "للمنزل",
  coDesk: "نقطة استلام",
  coPerWilaya: "حسب الولاية",
  coFree: "مجاني",
  coAddress: "العنوان",
  coOptional: "(اختياري)",
  coAddrHomePh: "الشارع، الرقم، علامة مميزة…",
  coAddrDeskPh: "مكتب شركة التوصيل الأقرب",
  coLess: "إنقاص",
  coMore: "زيادة",
  coSubtotal: "المجموع الفرعي",
  coDelivery: "التوصيل",
  coTotal: "المجموع",
  coSending: "جارٍ إرسال الطلب…",
  coOrderCta: (total) => `اطلب الآن · ${total}`,
  coSoldOutBtn: "نفدت الكمية",
  coNeedOptions: "اختر الخيارات للمتابعة",
  coEtaTo: (eta, wilaya) => `التوصيل خلال ${eta} نحو ${wilaya}. `,
  coEverywhere: "التوصيل لكل الجزائر. ",
  coPayDriver: "تدفع للموصّل عند الاستلام. تأكيد عبر الهاتف.",
  coMaxPerOrder: (n) => `الحد الأقصى ${n} / طلب`,
  tyOrderNo: "طلب رقم",
  tyThanks: (name) => `شكراً ${name}!`,
  tyReceived1: "تم استلام طلبك. سنتصل بك على",
  tyReceived2: "للتأكيد قبل الشحن.",
  tyQty: "الكمية",
  tyHome: "للمنزل",
  tyDesk: "نقطة استلام",
  tyToPay: "المبلغ عند الموصّل",
  tyAddress: "عنوان التوصيل",
  tyConfirmT: "التأكيد",
  tyConfirmD: "مكالمة خلال 24 ساعة عمل",
  tyDelivT: "التوصيل",
  tyDelivD: (eta, wilaya) => `${eta} نحو ${wilaya}`,
  tyPayT: "الدفع",
  tyPayD: (total) => `${total} نقداً عند الاستلام`,
  tyContinue: "مواصلة التسوق",
  tyWhatsapp: "راسلنا واتساب",
  tyWaMsg: (n, store) => `مرحباً، قدمت الطلب رقم ${n} على ${store}.`,
  fDelivery: "التوصيل",
  fHome: "المنزل",
  fRelay: "نقطة الاستلام",
  fFreeFrom: (amount) => `التوصيل مجاني ابتداءً من ${amount}`,
  fEta: "الشمال 24–48 سا · الجنوب 3–5 أيام",
  fReturns: (days) => `الإرجاع خلال ${days} أيام`,
  fContact: "اتصل بنا",
  fAllProducts: "كل المنتجات",
  fPowered: "بدعم من",
  privateBanner: "المتجر في الوضع الخاص — ظاهر لك فقط. انشره من الإعدادات.",
  gallerySoon: "الصور قريباً",
  galleryPrev: "السابق",
  galleryNext: "التالي",
  galleryImage: (n) => `صورة ${n}`,
  etaNorth: "24–48 ساعة",
  etaHighlands: "48–72 ساعة",
  etaSouth: "3–5 أيام",
};

export function st(lang: StoreLang): Dict {
  return lang === "ar" ? ar : fr;
}
