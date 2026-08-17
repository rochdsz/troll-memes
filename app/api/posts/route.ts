import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { username: true } },
        likes: userId ? { where: { userId } } : false,
      },
    });

    const formattedPosts = posts.map((post) => ({
      ...post,
      hasLiked: post.likes && post.likes.length > 0,
    }));

    return NextResponse.json(formattedPosts);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching posts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, description, imageUrl } = await req.json();
    if (!title || !imageUrl) {
      return NextResponse.json({ message: "Title and Image are required" }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        title,
        description,
        imageUrl,
        authorId: userId,
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Failed to create post" }, { status: 500 });
  }
}