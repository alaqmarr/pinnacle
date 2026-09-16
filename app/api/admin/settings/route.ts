import { NextRequest, NextResponse } from "next/server";
import { getGlobalSettings, updateGlobalSettings } from "@/lib/settings";
import { revalidatePath, revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getGlobalSettings();
    return NextResponse.json(
      {
        ...settings,
        businessHours: settings.hours,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("[Admin API] Failed to fetch settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  return handleUpdate(req);
}

export async function PATCH(req: NextRequest) {
  return handleUpdate(req);
}

export async function POST(req: NextRequest) {
  return handleUpdate(req);
}

async function handleUpdate(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Empty settings payload" }, { status: 400 });
    }

    // Support both businessHours and hours
    const payload = { ...body };
    if (payload.businessHours !== undefined && payload.hours === undefined) {
      payload.hours = payload.businessHours;
    }

    const updated = await updateGlobalSettings(payload);

    try {
      revalidatePath("/", "layout");
      revalidatePath("/(storefront)", "layout");
      revalidatePath("/products", "page");
      revalidatePath("/products/[id]", "page");
      revalidatePath("/categories", "page");
      revalidatePath("/categories/[id]", "page");
      revalidatePath("/cart", "page");
      revalidatePath("/checkout", "page");
      revalidatePath("/contact", "page");
      revalidateTag("settings", { expire: 0 });
    } catch {
      // Ignore when running outside active server/request context
    }

    return NextResponse.json({
      success: true,
      settings: {
        ...updated,
        businessHours: updated.hours,
      },
    });
  } catch (error: any) {
    console.error("[Admin API] Failed to update settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings", details: error.message },
      { status: 500 }
    );
  }
}
