/** Normalise for display and hashing (trim, collapse spaces, uppercase). */
export function normalizePostcodeForEstimate(value: string): string {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

/**
 * Stable pseudo-random in [3, 5] — same normalised postcode always yields the same value.
 * Uses FNV-1a over the postcode string.
 */
export function discountPercentForPostcode(normalisedPostcode: string): number {
  let h = 2166136261;
  for (let i = 0; i < normalisedPostcode.length; i++) {
    h ^= normalisedPostcode.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const u = h >>> 0;
  // 3.00% … 5.00% inclusive in 0.01% steps
  return 3 + (u % 201) / 100;
}

export function estimateOrcaAnnualBill(
  annualBillPounds: number,
  normalisedPostcode: string
): { discountPercent: number; orcaBill: number; saving: number } {
  const discountPercent = discountPercentForPostcode(normalisedPostcode);
  const factor = 1 - discountPercent / 100;
  const orcaBill = Math.round(annualBillPounds * factor * 100) / 100;
  const saving = Math.round((annualBillPounds - orcaBill) * 100) / 100;
  return { discountPercent, orcaBill, saving };
}
