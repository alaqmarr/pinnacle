import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let slug = searchParams.get("slug");
  const type = searchParams.get("type"); // "category" or "product"
  const ignoreId = searchParams.get("ignoreId");

  if (!slug || !type) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    let existing = null;
    let finalSlug = slug;

    // Check if it exists
    const checkExists = async (testSlug: string) => {
      if (type === "category") {
        return await prisma.category.findFirst({
          where: { slug: testSlug, id: { not: ignoreId || undefined } }
        });
      } else if (type === "product") {
        return await prisma.product.findFirst({
          where: { slug: testSlug, id: { not: ignoreId || undefined } }
        });
      }
      return null;
    };

    existing = await checkExists(finalSlug);

    // If it exists, append a 4 digit random string in front with _
    if (existing) {
      const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
      finalSlug = `${randomStr}_${finalSlug}`;
    }

    return NextResponse.json({ slug: finalSlug });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to check slug" }, { status: 500 });
  }
}
