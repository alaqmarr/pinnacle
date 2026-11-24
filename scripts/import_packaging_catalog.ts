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

  console.log(
    `[Import] Checking catalog (${catalog.categories.length} categories, ${catalog.products.length} products)...`
  );

  // 1. Ensure Categories exist (create missing categories; update existing only with --force)
  const categoryIdBySlug = new Map<string, string>();
  let createdCategories = 0;
  for (const cat of catalog.categories) {
    const existingCat = await prisma.category.findUnique({
      where: { slug: cat.slug },
    });

    if (existingCat) {
      if (forceResync) {
        await prisma.category.update({
          where: { id: existingCat.id },
          data: {
            name: cat.name,
            description: cat.description,
            ...(cat.image ? { image: cat.image } : {}),
          },
        });
      }
      categoryIdBySlug.set(cat.slug, existingCat.id);
    } else {
      const record = await prisma.category.create({
        data: {
          id: cat.slug,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          image: cat.image || null,
        },
      });
      categoryIdBySlug.set(cat.slug, record.id);
      createdCategories++;
    }
  }

  // 2. Upsert Products + ProductVariants (insert missing products unless --force)
  let createdProducts = 0;
  let updatedProducts = 0;
  let totalVariantsInserted = 0;

  for (const prod of catalog.products) {
    const categoryId = categoryIdBySlug.get(prod.categorySlug) || null;
    const imagesJson = prod.image ? JSON.stringify([prod.image]) : "[]";

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

    const positivePrices = variantRows.map((v) => v.price).filter((p) => p > 0);
    const resolvedPrice =
      typeof prod.price === "number"
        ? prod.price
        : positivePrices.length > 0
          ? Math.min(...positivePrices)
          : 0;
    const resolvedSku = prod.sku || variantRows[0]?.sku || prod.slug;
    const resolvedInventory =
      typeof prod.inventory === "number" ? prod.inventory : variantRows.length * 100;

    // Check if product already exists by slug or sku
    const existing = await prisma.product.findFirst({
      where: {
        OR: [{ slug: prod.slug }, { sku: resolvedSku }],
      },
    });

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
            price: resolvedPrice,
            inventory: resolvedInventory,
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
          sku: resolvedSku,
          description: prod.description,
          price: resolvedPrice,
          inventory: resolvedInventory,
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

  if (createdCategories === 0 && createdProducts === 0 && updatedProducts === 0) {
    console.log(
      `[Import] Catalog is already up to date (${catalog.products.length} products checked). Pass --force to re-sync existing products.`
    );
  } else {
    console.log(
      `[Import] Completed! Created ${createdCategories} categories, ${createdProducts} products, updated ${updatedProducts} products, inserted ${totalVariantsInserted} size/variant rows.`
    );
  }
}

main()
  .catch((err) => {
    console.error("[Import] Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
