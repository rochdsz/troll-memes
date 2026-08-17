import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        actor: { select: { username: true } },
        post: { select: { title: true } },
      },
    });

    return NextResponse.json(notifications);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching notifications" }, { status: 500 });
  }
}