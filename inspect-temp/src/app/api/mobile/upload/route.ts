import { NextRequest, NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { getSessionUser } from "@/lib/getSessionUser";

const utapi = new UTApi();

export async function POST(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
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
    return NextResponse.json({ error: "Upload failed", details: error.message }, { status: 500 });
  }
}