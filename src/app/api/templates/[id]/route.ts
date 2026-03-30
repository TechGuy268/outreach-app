import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/get-user";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const { id } = await params;

  await prisma.template.deleteMany({
    where: { id, userId: user!.id },
  });

  return NextResponse.json({ success: true });
}
