"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";

export default function PostCard({ post }: { post: any }) {
  const { data: session } = useSession();
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [hasLiked, setHasLiked] = useState(post.hasLiked);
  const [loading, setLoading] = useState(false);

  const toggleLike = async () => {
    if (!session || loading) return;
    setLoading(true);

    // Optimistic UI update
    setHasLiked(!hasLiked);
    setLikesCount(hasLiked ? likesCount - 1 : likesCount + 1);

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
      const data = await res.json();
      setHasLiked(data.liked);
    } catch {
      // Revert if request fails
      setHasLiked(hasLiked);
      setLikesCount(likesCount);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl mb-6">
      <div className="p-4 border-b border-slate-800/60 flex items-center justify-between">
        <span className="font-semibold text-sm text-blue-400">@{post.author.username}</span>
        <span className="text-xs text-slate-500">
          {new Date(post.createdAt).toLocaleDateString()}
        </span>
      </div>

      <div className="relative bg-slate-950 flex justify-center max-h-[500px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.imageUrl} alt={post.title} className="object-contain max-h-[500px] w-full" />
      </div>

      <div className="p-4 space-y-2">
        <h2 className="text-lg font-bold text-white">{post.title}</h2>
        {post.description && <p className="text-sm text-slate-400">{post.description}</p>}

        <div className="flex items-center pt-2">
          <button
            onClick={toggleLike}
            disabled={!session}
            className={`flex items-center gap-1.5 text-sm font-semibold transition ${
              hasLiked ? "text-red-500" : "text-slate-400 hover:text-red-400"
            }`}
          >
            <Heart size={18} fill={hasLiked ? "currentColor" : "none"} />
            <span>{likesCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
}