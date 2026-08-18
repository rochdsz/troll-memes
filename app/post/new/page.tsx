"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function NewPostPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!session) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-slate-400">Please sign in to upload memes.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) {
      setError("Please provide a title and an image.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const mimeType = file.type || "image/jpeg";

      // 1. Request Signed Upload URL
      const signedRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: mimeType }),
      });
      
      const signedData = await signedRes.json();
      if (!signedRes.ok) {
        throw new Error(signedData.message || "Failed to get signed upload URL");
      }

      const { uploadUrl, publicUrl } = signedData;
      if (!uploadUrl) {
        throw new Error("No upload URL returned from server");
      }

      // 2. Direct binary upload to GCS
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": mimeType },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error(`Failed to upload image file (HTTP ${uploadRes.status})`);
      }

      // 3. Save post metadata to database
      const postRes = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, imageUrl: publicUrl }),
      });

      const postData = await postRes.json();
      if (!postRes.ok) {
        throw new Error(postData.message || "Failed to save post");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-6">Drop a New Meme</h1>

        {error && (
          <div className="mb-4 rounded bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300">Title</label>
            <input
              type="text"
              required
              className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="When the code compiles on first try..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Description (Optional)</label>
            <textarea
              className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Context or extra troll..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Meme Image</label>
            <input
              type="file"
              accept="image/*"
              required
              className="mt-1 w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-500"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition"
          >
            {loading ? "Uploading to Cloud..." : "Post Meme"}
          </button>
        </form>
      </div>
    </div>
  );
}