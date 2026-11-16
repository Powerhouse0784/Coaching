import { NextRequest, NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { getSessionUser } from "@/lib/getSessionUser";
import { rateLimit } from "@/lib/rate-limit";

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "application/pdf",
]);

const utapi = new UTApi();

export async function POST(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const limit = await rateLimit({ identifier: `upload:${session.user.id}`, limit: 40, window: 3600 });
    if (!limit.success) {
      return NextResponse.json({ error: "Too many uploads. Please try again later." }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 15 MB)" }, { status: 413 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Only images and PDF files are allowed" }, { status: 415 });
    }

    const uploaded = await utapi.uploadFiles(file);

    if (uploaded.error) {
      return NextResponse.json({ error: uploaded.error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: uploaded.data.url,
      name: uploaded.data.name,
      size: uploaded.data.size,
    });
  } catch (error: any) {
    console.error("Mobile upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}