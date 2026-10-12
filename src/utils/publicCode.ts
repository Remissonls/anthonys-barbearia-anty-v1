// Public booking code generator: generates random, non-sequential alphanumeric codes
// Example: AP-8K2X9

export function generatePublicCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude ambiguous characters (0, 1, I, O)
  let code = '';
  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }
  return `AP-${code}`;
}
