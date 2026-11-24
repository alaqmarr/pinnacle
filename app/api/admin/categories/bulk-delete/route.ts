import { NextRequest } from "next/server";
import { handleBulkCategoryDeleteRequest } from "@/lib/admin/catalog-delete";

export async function POST(req: NextRequest) {
  return handleBulkCategoryDeleteRequest(req);
}

export async function DELETE(req: NextRequest) {
  return handleBulkCategoryDeleteRequest(req);
}
