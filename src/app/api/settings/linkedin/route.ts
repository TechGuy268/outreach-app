import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/get-user";

export async function POST(req: Request) {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const { cookie } = await req.json();
  if (!cookie) {
    return NextResponse.json({ error: "Cookie is required" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user!.id },
    data: { linkedinCookie: cookie },
  });

  return NextResponse.json({ success: true });
}
