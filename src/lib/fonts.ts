import {
  Inter,
  Cormorant_Garamond,
  Space_Grotesk,
  Fraunces,
  Nunito,
  DM_Serif_Display,
  Manrope,
  Syne,
  Playfair_Display,
  Lora,
  Outfit,
} from "next/font/google";

export const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
  preload: false,
});
export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
  preload: false,
});
export const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  preload: false,
});
export const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "swap", preload: false });
export const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-dmserif",
  display: "swap",
  preload: false,
});
export const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap", preload: false });
export const syne = Syne({ subsets: ["latin"], weight: ["400", "700", "800"], variable: "--font-syne", display: "swap", preload: false });
export const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
  preload: false,
});
export const lora = Lora({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-lora", display: "swap", preload: false });
export const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap", preload: false });

export const allFontVariables = [
  inter,
  cormorant,
  spaceGrotesk,
  fraunces,
  nunito,
  dmSerif,
  manrope,
  syne,
  playfair,
  lora,
  outfit,
]
  .map((f) => f.variable)
  .join(" ");
