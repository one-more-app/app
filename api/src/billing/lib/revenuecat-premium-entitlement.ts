function normalizeEntitlementId(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * RevenueCat envoie `entitlement_ids` (tableau) et parfois `entitlement_id` (singulier).
 * Les identifiants RC sont sensibles à la casse côté dashboard ; on compare en normalisé.
 */
export function revenueCatEventHasPremiumEntitlement(
  event: Record<string, unknown>,
  configuredEntitlementId: string,
): boolean {
  const expected = normalizeEntitlementId(configuredEntitlementId);

  const ids = event.entitlement_ids;
  if (Array.isArray(ids)) {
    for (const id of ids) {
      if (typeof id === 'string' && normalizeEntitlementId(id) === expected) {
        return true;
      }
    }
  }

  const single = event.entitlement_id;
  if (
    typeof single === 'string' &&
    normalizeEntitlementId(single) === expected
  ) {
    return true;
  }

  return false;
}
