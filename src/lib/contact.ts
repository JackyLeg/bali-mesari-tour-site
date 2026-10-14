export const WHATSAPP_CONTACT = '+62 813-3873-3965';
export const WHATSAPP_NUMBER = WHATSAPP_CONTACT.replace(/\D/g, '');

export function getWhatsAppUrl(message = ''): string {
  const query = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${WHATSAPP_NUMBER}${query}`;
}
