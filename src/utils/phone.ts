// Phone formatting and normalization utilities for Brazil (E.164 compatible digits)

/**
 * Strips all non-digit characters from a phone number string.
 * Example: "(82) 99876-5432" -> "82998765432"
 */
export function normalizePhoneBR(phone: string | null | undefined): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Formats a phone string into standard Brazilian pattern:
 * 11 digits: (XX) 9XXXX-XXXX
 * 10 digits: (XX) XXXX-XXXX
 */
export function formatPhoneBR(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = normalizePhoneBR(phone);
  
  if (digits.length <= 2) {
    return digits.length > 0 ? `(${digits}` : '';
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  // 11 digits (mobile)
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Validates Brazilian phone format (DDD + 8 or 9 digits)
 */
export function isValidPhoneBR(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const digits = normalizePhoneBR(phone);
  // Valid Brazilian phones have 10 (landline) or 11 (mobile) digits
  return digits.length === 10 || digits.length === 11;
}
