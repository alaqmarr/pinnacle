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
    const checkExists = async (testSlug: string) => {
      const whereClause: any = { slug: testSlug };
      if (ignoreId) {
        whereClause.id = { not: ignoreId };
      }
      if (type === "category") {
        return await prisma.category.findFirst({
          where: whereClause,
        });
      } else if (type === "product") {
        return await prisma.product.findFirst({
          where: whereClause,
        });
      }
      return null;
    };

    let finalSlug = slug;
    let existing = await checkExists(finalSlug);

    // If it exists, append a 4 digit random string prefixed with an underscore (e.g. _1234)
    while (existing) {
      const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
      finalSlug = `${slug}_${randomStr}`;
      existing = await checkExists(finalSlug);
    }

    return NextResponse.json({ slug: finalSlug });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to check slug" }, { status: 500 });
  }
}
