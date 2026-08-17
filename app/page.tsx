import Navbar from "@/components/Navbar";
import PostCard from "@/components/PostCard";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { username: true } },
    },
  });

  return (
    <main className="min-h-screen bg-slate-950">
      <Navbar />
      <div className="mx-auto max-w-lg px-4 py-8">
        {posts.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            No memes posted yet. Be the first to troll!
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </main>
  );
}