import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface ProductCascadeResult {
  deletedProducts: number;
  deletedVariants: number;
  deletedCartItems: number;
  unlinkedOrderItems: number;
}

export interface CategoryCascadeResult extends ProductCascadeResult {
  deletedCategories: number;
  uncategorizedProducts: number;
}

/**
 * Revalidates public storefront pages impacted by catalog mutations.
 */
export function revalidateCatalogPaths() {
  try {
    revalidatePath("/", "layout");
    revalidatePath("/products", "page");
    revalidatePath("/products/[id]", "page");
    revalidatePath("/categories", "page");
    revalidatePath("/categories/[id]", "page");
  } catch {
    // Safe no-op if called outside Next.js request lifecycle (e.g. CLI test scripts)
  }
}

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function deleteProductsInTx(
  tx: TxClient,
  productIds: string[]
): Promise<ProductCascadeResult> {
  if (productIds.length === 0) {
    return {
      deletedProducts: 0,
      deletedVariants: 0,
      deletedCartItems: 0,
      unlinkedOrderItems: 0,
    };
  }

  const variants = await tx.productVariant.findMany({
    where: { productId: { in: productIds } },
    select: { id: true },
  });
  const variantIds = variants.map((v) => v.id);

  // Preserve order line-item snapshots while detaching product/variant foreign keys
  const orderWhere =
    variantIds.length > 0
      ? { OR: [{ productId: { in: productIds } }, { variantId: { in: variantIds } }] }
      : { productId: { in: productIds } };

  const unlinkedOrders = await tx.orderItem.updateMany({
    where: orderWhere,
    data: { productId: null, variantId: null },
  });

  // Clean up cart items referencing any of the products or their variants
  const cartWhere =
    variantIds.length > 0
      ? { OR: [{ productId: { in: productIds } }, { variantId: { in: variantIds } }] }
      : { productId: { in: productIds } };

  const deletedCart = await tx.cartItem.deleteMany({
    where: cartWhere,
  });

  // Delete variants explicitly before deleting products
  const deletedVars = await tx.productVariant.deleteMany({
    where: { productId: { in: productIds } },
  });

  const deletedProds = await tx.product.deleteMany({
    where: { id: { in: productIds } },
  });

  return {
    deletedProducts: deletedProds.count,
    deletedVariants: deletedVars.count,
    deletedCartItems: deletedCart.count,
    unlinkedOrderItems: unlinkedOrders.count,
  };
}

/**
 * Atomically deletes products along with all child ProductVariants and CartItems,
 * while safely detaching historical OrderItems to preserve order records.
 */
export async function deleteProductsCascade(
  rawIds: string[]
): Promise<ProductCascadeResult> {
  const uniqueIds = Array.from(
    new Set(rawIds.map((id) => String(id).trim()).filter(Boolean))
  );

  if (uniqueIds.length === 0) {
    return {
      deletedProducts: 0,
      deletedVariants: 0,
      deletedCartItems: 0,
      unlinkedOrderItems: 0,
    };
  }

  const result = await prisma.$transaction((tx) =>
    deleteProductsInTx(tx, uniqueIds)
  );

  revalidateCatalogPaths();
  return result;
}

/**
 * Atomically deletes categories. When `cascadeProducts` is true (default),
 * cascades deletion to every product assigned to those categories (along with
 * their variants and cart items). Otherwise detaches products to Uncategorized.
 */
export async function deleteCategoriesCascade(
  rawIds: string[],
  cascadeProducts = true
): Promise<CategoryCascadeResult> {
  const uniqueIds = Array.from(
    new Set(rawIds.map((id) => String(id).trim()).filter(Boolean))
  );

  if (uniqueIds.length === 0) {
    return {
      deletedCategories: 0,
      deletedProducts: 0,
      deletedVariants: 0,
      deletedCartItems: 0,
      unlinkedOrderItems: 0,
      uncategorizedProducts: 0,
    };
  }

  const result = await prisma.$transaction(async (tx) => {
    let productStats: ProductCascadeResult = {
      deletedProducts: 0,
      deletedVariants: 0,
      deletedCartItems: 0,
      unlinkedOrderItems: 0,
    };
    let uncategorizedProducts = 0;

    if (cascadeProducts) {
      const taggedProducts = await tx.product.findMany({
        where: { categoryId: { in: uniqueIds } },
        select: { id: true },
      });
      const productIds = taggedProducts.map((p) => p.id);
      productStats = await deleteProductsInTx(tx, productIds);
    } else {
      const updated = await tx.product.updateMany({
        where: { categoryId: { in: uniqueIds } },
        data: { categoryId: null },
      });
      uncategorizedProducts = updated.count;
    }

    const deletedCats = await tx.category.deleteMany({
      where: { id: { in: uniqueIds } },
    });

    return {
      deletedCategories: deletedCats.count,
      ...productStats,
      uncategorizedProducts,
    };
  });

  revalidateCatalogPaths();
  return result;
}

function parseIdsList(rawIds: unknown): string[] {
  if (!Array.isArray(rawIds)) return [];
  return Array.from(
    new Set(
      rawIds
        .filter((id): id is string => typeof id === "string")
        .map((id) => id.trim())
        .filter(Boolean)
    )
  );
}

/**
 * Shared HTTP handler for bulk deleting products via DELETE or POST.
 */
export async function handleBulkProductDeleteRequest(req: Request) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const ids = parseIdsList(body?.ids);
    if (ids.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one product ID to delete." },
        { status: 400 }
      );
    }

    const stats = await deleteProductsCascade(ids);
    return NextResponse.json({
      success: true,
      ...stats,
      message: `Deleted ${stats.deletedProducts} product(s), ${stats.deletedVariants} variant(s), and ${stats.deletedCartItems} cart item(s).`,
    });
  } catch (error: any) {
    console.error("[Admin API] Bulk delete products failed:", error);
    return NextResponse.json(
      { error: "Failed to bulk delete products", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Shared HTTP handler for bulk deleting categories with optional product cascade (default true).
 */
export async function handleBulkCategoryDeleteRequest(req: Request) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const ids = parseIdsList(body?.ids);
    if (ids.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one category ID to delete." },
        { status: 400 }
      );
    }

    const cascadeProducts = body?.cascadeProducts !== false;
    const stats = await deleteCategoriesCascade(ids, cascadeProducts);

    const suffix = cascadeProducts
      ? `Cascaded ${stats.deletedProducts} product(s), ${stats.deletedVariants} variant(s), and ${stats.deletedCartItems} cart item(s).`
      : `Moved ${stats.uncategorizedProducts} product(s) to Uncategorized.`;

    return NextResponse.json({
      success: true,
      ...stats,
      message: `Deleted ${stats.deletedCategories} category(ies). ${suffix}`,
    });
  } catch (error: any) {
    console.error("[Admin API] Bulk delete categories failed:", error);
    return NextResponse.json(
      { error: "Failed to bulk delete categories", details: error.message },
      { status: 500 }
    );
  }
}
