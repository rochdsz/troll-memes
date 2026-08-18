import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generateV4UploadSignedUrl } from "@/lib/gcs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { filename, contentType } = await req.json();
    if (!filename) {
      return NextResponse.json({ message: "Missing filename" }, { status: 400 });
    }

    const type = contentType || "image/jpeg";
    const { uploadUrl, publicUrl } = await generateV4UploadSignedUrl(filename, type);
    return NextResponse.json({ uploadUrl, publicUrl });
  } catch (error: any) {
    console.error("Error generating signed upload URL:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}