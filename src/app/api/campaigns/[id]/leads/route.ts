import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/get-user";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const { id } = await params;
  const { leadIds } = await req.json();

  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return NextResponse.json({ error: "leadIds required" }, { status: 400 });
  }

  // Verify campaign belongs to user
  const campaign = await prisma.campaign.findFirst({
    where: { id, userId: user!.id },
  });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  // Filter out leads already in campaign
  const existing = await prisma.campaignLead.findMany({
    where: { campaignId: id, leadId: { in: leadIds } },
    select: { leadId: true },
  });
  const existingIds = new Set(existing.map((e) => e.leadId));
  const newLeadIds = leadIds.filter((lid: string) => !existingIds.has(lid));

  if (newLeadIds.length > 0) {
    await prisma.campaignLead.createMany({
      data: newLeadIds.map((leadId: string) => ({
        campaignId: id,
        leadId,
      })),
    });
  }

  return NextResponse.json({ count: newLeadIds.length });
}
