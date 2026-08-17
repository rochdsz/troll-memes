import { Storage } from "@google-cloud/storage";

const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
});

export const bucket = storage.bucket(process.env.GCS_BUCKET_NAME || "");

export async function generateV4UploadSignedUrl(filename: string, contentType: string) {
  const blob = bucket.file(`memes/${Date.now()}-${filename}`);
  
  const [url] = await blob.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType,
  });

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
  return { uploadUrl: url, publicUrl };
}