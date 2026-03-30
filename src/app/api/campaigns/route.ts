import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/get-user";

export async function GET() {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const campaigns = await prisma.campaign.findMany({
    where: { userId: user!.id },
    include: {
      _count: { select: { campaignLeads: true, steps: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ campaigns });
}

export async function POST(req: Request) {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const { name, description, type, dailyLimit, steps } = await req.json();

  if (!name || !type) {
    return NextResponse.json(
      { error: "Name and type are required" },
      { status: 400 }
    );
  }

  const campaign = await prisma.campaign.create({
    data: {
      name,
      description: description || null,
      type,
      dailyLimit: dailyLimit || 50,
      userId: user!.id,
      steps: {
        create: (steps || []).map(
          (
            step: { channel: string; delayDays: number; subject?: string; body: string },
            index: number
          ) => ({
            order: index,
            channel: step.channel,
            delayDays: step.delayDays || 0,
            subject: step.subject || null,
            body: step.body || "",
          })
        ),
      },
    },
    include: { steps: true },
  });

  return NextResponse.json({ campaign }, { status: 201 });
}
