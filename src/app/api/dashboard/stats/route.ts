import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/get-user";

export async function GET() {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const [totalLeads, activeCampaigns, emailLogs, linkedinLogs] =
    await Promise.all([
      prisma.lead.count({ where: { userId: user!.id } }),
      prisma.campaign.count({
        where: { userId: user!.id, status: "ACTIVE" },
      }),
      prisma.outreachLog.count({
        where: { userId: user!.id, channel: "EMAIL", status: { not: "PENDING" } },
      }),
      prisma.outreachLog.count({
        where: {
          userId: user!.id,
          channel: { in: ["LINKEDIN_CONNECT", "LINKEDIN_MESSAGE"] },
          status: { not: "PENDING" },
        },
      }),
    ]);

  const totalSent = await prisma.outreachLog.count({
    where: { userId: user!.id, status: { not: "PENDING" } },
  });
  const totalOpened = await prisma.outreachLog.count({
    where: { userId: user!.id, openedAt: { not: null } },
  });
  const totalReplied = await prisma.outreachLog.count({
    where: { userId: user!.id, repliedAt: { not: null } },
  });

  return NextResponse.json({
    totalLeads,
    activeCampaigns,
    emailsSent: emailLogs,
    linkedinSent: linkedinLogs,
    openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
    replyRate: totalSent > 0 ? (totalReplied / totalSent) * 100 : 0,
  });
}
