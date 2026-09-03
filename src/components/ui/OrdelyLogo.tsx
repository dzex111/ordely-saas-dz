/** ORDELY wordmark — header preview.
 *  The "O" is a parcel ring (brand orange) sealed with an ink tape mark,
 *  followed by "RDELY" in bold tight type. Together they read ORDELY.
 */
export function OrdelyLogo() {
  return (
    <span className="inline-flex items-center gap-[7px]" aria-label="ORDELY">
      <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <circle cx="14" cy="14.5" r="10" stroke="#ff5a1f" strokeWidth="3.4" />
        <rect x="11" y="1.4" width="6" height="4.6" rx="1.3" fill="#0b0b0f" />
      </svg>
      <span className="text-[17px] font-bold leading-none tracking-[-0.02em] text-ink">
        RDELY
      </span>
    </span>
  );
}
