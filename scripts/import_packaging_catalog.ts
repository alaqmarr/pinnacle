/**
 * scripts/import_packaging_catalog.ts
 *
 * One-time catalog import script for Pinnacle Distributing.
 * Populates industrial packaging categories, products, and multi-size/variant matrices
 * into SQLite via Prisma.
 *
 * Usage:
 *   npx tsx scripts/import_packaging_catalog.ts
 *   npx tsx scripts/import_packaging_catalog.ts --force   (re-syncs existing catalog items)
 */

import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";

interface CatalogVariantSeed {
  sku: string;
  legacySku?: string | null;
  size: string;
  style?: string | null;
  price: number;
  priceUnit?: string | null;
  inventory?: number;
  specs?: Record<string, string>;
}

interface CatalogProductSeed {
  name: string;
  slug: string;
  categorySlug: string;
  description: string;
  image?: string | null;
  featured?: boolean;
  price: number;
  sku: string;
  inventory: number;
  variants: CatalogVariantSeed[];
}

interface CatalogCategorySeed {
  name: string;
  slug: string;
  description: string;
  image?: string | null;
}

interface CatalogPayload {
  categories: CatalogCategorySeed[];
  products: CatalogProductSeed[];
}

async function main() {
  const forceResync = process.argv.includes("--force");
  const dataPath = path.join(__dirname, "data", "packaging-catalog.json");

  if (!fs.existsSync(dataPath)) {
    throw new Error(`Catalog data file not found at: ${dataPath}`);
  }

  const raw = fs.readFileSync(dataPath, "utf8");
  const catalog: CatalogPayload = JSON.parse(raw);

  const existingVariantsCount = await prisma.productVariant.count();
  if (existingVariantsCount > 0 && !forceResync) {
    console.log(
      `[Import] Packaging catalog already populated (${existingVariantsCount} variants found). Skipping one-time import. Pass --force to re-sync.`
    );
    return;
  }

  console.log(
    `[Import] Starting one-time import: ${catalog.categories.length} categories, ${catalog.products.length} products...`
  );

  // 1. Upsert Categories
  const categoryIdBySlug = new Map<string, string>();
  for (const cat of catalog.categories) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        ...(cat.image ? { image: cat.image } : {}),
      },
      create: {
        id: cat.slug,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image || null,
      },
    });
    categoryIdBySlug.set(cat.slug, record.id);
  }

  // 2. Upsert Products + ProductVariants
  let createdProducts = 0;
  let updatedProducts = 0;
  let totalVariantsInserted = 0;

  for (const prod of catalog.products) {
    const categoryId = categoryIdBySlug.get(prod.categorySlug) || null;
    const imagesJson = prod.image ? JSON.stringify([prod.image]) : "[]";

    // Check if product already exists by slug or sku
    const existing = await prisma.product.findFirst({
      where: {
        OR: [{ slug: prod.slug }, { sku: prod.sku }],
      },
    });

    const variantRows = prod.variants.map((v, idx) => ({
      sku: v.sku,
      legacySku: v.legacySku || null,
      size: v.size,
      style: v.style || null,
      price: Math.max(0, Math.round(v.price || 0)),
      priceUnit: v.priceUnit || null,
      inventory: typeof v.inventory === "number" ? v.inventory : 100,
      specs: JSON.stringify(v.specs || {}),
      sortOrder: idx,
    }));

    if (existing) {
      if (!forceResync) {
        continue;
      }

      await prisma.$transaction(async (tx) => {
        await tx.productVariant.deleteMany({ where: { productId: existing.id } });
        await tx.product.update({
          where: { id: existing.id },
          data: {
            name: prod.name,
            description: prod.description,
            price: prod.price,
            inventory: prod.inventory,
            categoryId,
            images: imagesJson,
            featured: Boolean(prod.featured),
            variants: {
              create: variantRows,
            },
          },
        });
      });

      updatedProducts++;
      totalVariantsInserted += variantRows.length;
    } else {
      await prisma.product.create({
        data: {
          id: prod.slug,
          name: prod.name,
          slug: prod.slug,
          sku: prod.sku,
          description: prod.description,
          price: prod.price,
          inventory: prod.inventory,
          categoryId,
          images: imagesJson,
          featured: Boolean(prod.featured),
          variants: {
            create: variantRows,
          },
        },
      });

      createdProducts++;
      totalVariantsInserted += variantRows.length;
    }
  }

  console.log(
    `[Import] Completed! Created ${createdProducts} products, updated ${updatedProducts} products, inserted ${totalVariantsInserted} size/variant rows.`
  );
}

main()
  .catch((err) => {
    console.error("[Import] Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
