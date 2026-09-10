import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  // Static storefront routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/cart`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Dynamic category routes
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const categories = await prisma.category.findMany({
      select: { id: true, slug: true, updatedAt: true },
    });
    categoryRoutes = categories.map((cat) => ({
      url: `${baseUrl}/categories/${cat.id}`,
      lastModified: cat.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch (err) {
    console.warn("[Sitemap] Error querying categories:", err);
  }

  // Dynamic product routes
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await prisma.product.findMany({
      select: { id: true, slug: true, updatedAt: true },
    });
    productRoutes = products.map((prod) => ({
      url: `${baseUrl}/products/${prod.id}`,
      lastModified: prod.updatedAt,
      changeFrequency: "daily",
      priority: 0.9,
    }));
  } catch (err) {
    console.warn("[Sitemap] Error querying products:", err);
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
