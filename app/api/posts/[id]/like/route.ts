import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;

  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return NextResponse.json({ message: "Post not found" }, { status: 404 });

    const existingLike = await prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existingLike) {
      // Toggle OFF: Unlike
      await prisma.$transaction([
        prisma.like.delete({ where: { id: existingLike.id } }),
        prisma.post.update({
          where: { id: postId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);
      return NextResponse.json({ liked: false });
    } else {
      // Toggle ON: Like & Create Notification
      await prisma.$transaction([
        prisma.like.create({
          data: { userId, postId },
        }),
        prisma.post.update({
          where: { id: postId },
          data: { likesCount: { increment: 1 } },
        }),
        ...(post.authorId !== userId
          ? [
              prisma.notification.create({
                data: {
                  recipientId: post.authorId,
                  actorId: userId,
                  postId: post.id,
                },
              }),
            ]
          : []),
      ]);
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    return NextResponse.json({ message: "Error toggling like" }, { status: 500 });
  }
}