import { NextRequest } from "next/server";
import { handleBulkProductDeleteRequest } from "@/lib/admin/catalog-delete";

export async function POST(req: NextRequest) {
  return handleBulkProductDeleteRequest(req);
}

export async function DELETE(req: NextRequest) {
  return handleBulkProductDeleteRequest(req);
}
