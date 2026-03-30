import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/get-user";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const { id } = await params;

  const campaign = await prisma.campaign.findFirst({
    where: { id, userId: user!.id },
    include: {
      steps: { orderBy: { order: "asc" } },
      campaignLeads: {
        include: {
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              company: true,
            },
          },
        },
      },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  return NextResponse.json({ campaign });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();

  const campaign = await prisma.campaign.updateMany({
    where: { id, userId: user!.id },
    data: body,
  });

  return NextResponse.json({ campaign });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const { id } = await params;

  await prisma.campaign.deleteMany({
    where: { id, userId: user!.id },
  });

  return NextResponse.json({ success: true });
}
