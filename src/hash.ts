
export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

export function normalizePhone(input: string, countryCode = '1'): string {
  const digits = input.replace(/\D/g, '').replace(/^00/, '');
  if (digits.startsWith(countryCode)) return digits;
  const national = digits.replace(/^0+/, '');
  return national ? `${countryCode}${national}` : '';
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
  const add = async (key: string, value: string) => {
    if (value) out[key] = await sha256(value);
  };
  await add('em', normalizeEmail(user.email ?? ''));
  await add('ph', normalizePhone(user.phone ?? ''));
  await add('fn', normalizeName(user.firstName ?? ''));
  await add('ln', normalizeName(user.lastName ?? ''));
  return out;
}
