/**
 * Slug generation and manipulation utilities.
 */

export function generateSlug(name: string): string {
  if (!name) return "";
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug;
}

export function generateRandomSuffix(): string {
  const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
  return `_${randomStr}`;
}
