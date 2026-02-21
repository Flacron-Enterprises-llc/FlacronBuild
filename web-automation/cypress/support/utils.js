
export function generateShortUniqueCompanyName(prefix = 'Co') {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomStr = '';
  for (let i = 0; i < 5; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}_${randomStr}`;
}
