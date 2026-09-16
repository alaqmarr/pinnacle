import { NextResponse } from "next/server";
import { getGlobalSettings, getPublicSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getGlobalSettings();
    const publicSettings = getPublicSettings(settings);
    return NextResponse.json(publicSettings);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to retrieve public settings", details: error.message },
      { status: 500 }
    );
  }
}
