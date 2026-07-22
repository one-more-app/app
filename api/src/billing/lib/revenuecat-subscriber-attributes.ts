export type RevenueCatSubscriberSnapshot = {
  userId: string;
  email: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  gender?: string | null;
  weightKg?: number | null;
  heightCm?: number | null;
  isPremium?: boolean;
  mediaSource?: string | null;
  campaign?: string | null;
  adset?: string | null;
  adgroup?: string | null;
  keywords?: string | null;
  sub1?: string | null;
};

export type RevenueCatAttributePayload = Record<
  string,
  { value: string | null }
>;

function trimOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function resolveRevenueCatDisplayName(snapshot: {
  firstName?: string | null;
  lastName?: string | null;
}): string | null {
  const first = trimOrNull(snapshot.firstName ?? null);
  const last = trimOrNull(snapshot.lastName ?? null);
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  if (last) return last;
  return null;
}

function setAttribute(
  attributes: RevenueCatAttributePayload,
  key: string,
  value: string | number | boolean | null | undefined,
): void {
  if (value === undefined) return;
  if (value === null || value === '') {
    attributes[key] = { value: null };
    return;
  }
  attributes[key] = { value: String(value) };
}

export function buildRevenueCatSubscriberAttributes(
  snapshot: RevenueCatSubscriberSnapshot,
): RevenueCatAttributePayload {
  const attributes: RevenueCatAttributePayload = {};

  setAttribute(attributes, '$email', trimOrNull(snapshot.email));
  setAttribute(
    attributes,
    '$displayName',
    resolveRevenueCatDisplayName(snapshot),
  );
  setAttribute(
    attributes,
    'first_name',
    trimOrNull(snapshot.firstName ?? null),
  );
  setAttribute(attributes, 'last_name', trimOrNull(snapshot.lastName ?? null));
  setAttribute(attributes, 'username', trimOrNull(snapshot.username ?? null));
  setAttribute(attributes, 'gender', trimOrNull(snapshot.gender ?? null));
  setAttribute(attributes, 'weight_kg', snapshot.weightKg ?? null);
  setAttribute(attributes, 'height_cm', snapshot.heightCm ?? null);
  setAttribute(attributes, 'is_premium', snapshot.isPremium ?? null);
  setAttribute(attributes, 'user_id', snapshot.userId);
  setAttribute(
    attributes,
    '$mediaSource',
    trimOrNull(snapshot.mediaSource ?? null),
  );
  setAttribute(attributes, '$campaign', trimOrNull(snapshot.campaign ?? null));
  setAttribute(attributes, 'adset', trimOrNull(snapshot.adset ?? null));
  setAttribute(attributes, '$adGroup', trimOrNull(snapshot.adgroup ?? null));
  setAttribute(attributes, '$keyword', trimOrNull(snapshot.keywords ?? null));
  setAttribute(attributes, 'af_sub1', trimOrNull(snapshot.sub1 ?? null));

  return attributes;
}
