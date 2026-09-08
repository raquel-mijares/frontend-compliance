/**
 * Normalización y hash para APIs de conversión del lado servidor (Meta CAPI,
 * Google Enhanced Conversions).
 *
 * El hash sin normalizar previa es la causa número uno de tasas de match malas:
 * "  Ana@Example.COM " y "ana@example.com" dan hashes distintos y el proveedor
 * no reconcilia nada. Normalizar no es cosmético, es lo que hace que funcione.
 *
 * Esto reduce exposición, no la elimina: un hash de email sigue siendo un
 * identificador estable y bajo GDPR sigue siendo dato personal. Necesita base
 * legal igual.
 */

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

export function normalizePhone(input: string, countryCode = '1'): string {
  const digits = input.replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith(countryCode) ? digits : `${countryCode}${digits}`;
}

export function normalizeName(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

export async function hashUserData(
  user: UserData,
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  if (user.email) out.em = await sha256(normalizeEmail(user.email));
  if (user.phone) out.ph = await sha256(normalizePhone(user.phone));
  if (user.firstName) out.fn = await sha256(normalizeName(user.firstName));
  if (user.lastName) out.ln = await sha256(normalizeName(user.lastName));
  return out;
}
