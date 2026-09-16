/**
 * lib/whatsapp.ts
 *
 * WhatsApp Click-to-Chat utility functions for Pinnacle Distributing.
 * wa.me requires digits only with country code prefix (e.g. 18005550199).
 */

/**
 * Sanitizes a phone number for wa.me format.
 * Strips all non-digit characters.
 * If 10 digits (US standard without country code prefix), prepends "1".
 */
export function sanitizeWhatsAppNumber(phone: string | null | undefined): string {
  if (!phone) return "18005550199";
  const trimmed = phone.trim();
  const hasLeadingPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!hasLeadingPlus && digits.length === 10) {
    return `1${digits}`;
  }
  return digits || "18005550199";
}

/**
 * Builds a direct WhatsApp click-to-chat URL for product inquiries.
 * 
 * @param phone - Admin configured whatsappNumber
 * @param productName - Product name
 * @param sku - Optional SKU
 * @param productUrl - Optional current product URL
 * @param quantity - Optional requested quantity
 */
export function buildWhatsAppUrl(
  phone: string | null | undefined,
  productName: string,
  sku?: string | null,
  productUrl?: string | null,
  quantity?: number
): string {
  const cleanNumber = sanitizeWhatsAppNumber(phone);
  
  let message = `Hello Pinnacle Distributing, I would like to inquire about: ${productName}`;
  if (sku) {
    message += ` (SKU: ${sku})`;
  }
  if (quantity && quantity > 1) {
    message += ` - Quantity: ${quantity}`;
  }
  if (productUrl) {
    message += `\nLink: ${productUrl}`;
  }
  message += `\nPlease provide wholesale pricing and freight availability.`;

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * General helper to build a WhatsApp link with any custom message.
 */
export function buildWhatsAppLink(
  phoneNumber: string | null | undefined,
  message?: string
): string {
  const cleanNumber = sanitizeWhatsAppNumber(phoneNumber);
  const baseUrl = `https://wa.me/${cleanNumber}`;
  if (message && message.trim()) {
    return `${baseUrl}?text=${encodeURIComponent(message.trim())}`;
  }
  return baseUrl;
}
