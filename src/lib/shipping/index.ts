import { ecotrackProvider, ECOTRACK_COMPANIES } from "./ecotrack";
import { yalidineProvider } from "./yalidine";
import { zrProvider } from "./zr";
import type { ProviderId, ShippingProvider } from "./types";

export * from "./types";
export { ECOTRACK_COMPANIES } from "./ecotrack";

const REGISTRY: Record<ProviderId, ShippingProvider> = {
  yalidine: yalidineProvider,
  zr: zrProvider,
  ecotrack: ecotrackProvider,
};

export const PROVIDERS: ShippingProvider[] = [yalidineProvider, zrProvider, ecotrackProvider];

export function getProvider(id: string): ShippingProvider | null {
  if (id !== "yalidine" && id !== "zr" && id !== "ecotrack") return null;
  return REGISTRY[id];
}

/** Adding Noest (or any company) later = one new adapter file + one line here. */
export function providerLabel(id: string): string {
  return getProvider(id)?.label ?? id;
}
