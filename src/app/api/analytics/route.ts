import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/get-user";

export async function GET() {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const userId = user!.id;

  const [totalSent, totalOpened, totalClicked, totalReplied, totalBounced] =
    await Promise.all([
      prisma.outreachLog.count({ where: { userId, sentAt: { not: null } } }),
      prisma.outreachLog.count({ where: { userId, openedAt: { not: null } } }),
      prisma.outreachLog.count({ where: { userId, clickedAt: { not: null } } }),
      prisma.outreachLog.count({ where: { userId, repliedAt: { not: null } } }),
      prisma.outreachLog.count({ where: { userId, status: "BOUNCED" } }),
    ]);

  const overview = {
    totalSent,
    totalOpened,
    totalClicked,
    totalReplied,
    totalBounced,
    openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
    clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
    replyRate: totalSent > 0 ? (totalReplied / totalSent) * 100 : 0,
    bounceRate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
  };

  // Daily stats for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const logs = await prisma.outreachLog.findMany({
    where: { userId, createdAt: { gte: thirtyDaysAgo } },
    select: { sentAt: true, openedAt: true, repliedAt: true },
  });

  const dailyMap = new Map<string, { sent: number; opened: number; replied: number }>();
  for (const log of logs) {
    if (!log.sentAt) continue;
    const date = log.sentAt.toISOString().split("T")[0];
    const entry = dailyMap.get(date) || { sent: 0, opened: 0, replied: 0 };
    entry.sent++;
    if (log.openedAt) entry.opened++;
    if (log.repliedAt) entry.replied++;
    dailyMap.set(date, entry);
  }

  const daily = Array.from(dailyMap.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Stats by campaign
  const campaigns = await prisma.campaign.findMany({
    where: { userId },
    select: {
      name: true,
      steps: {
        select: {
          outreachLogs: {
            select: { sentAt: true, openedAt: true, repliedAt: true },
          },
        },
      },
    },
  });

  const byCampaign = campaigns.map((c) => {
    const allLogs = c.steps.flatMap((s) => s.outreachLogs);
    const sent = allLogs.filter((l) => l.sentAt).length;
    const opened = allLogs.filter((l) => l.openedAt).length;
    const replied = allLogs.filter((l) => l.repliedAt).length;
    return {
      name: c.name,
      sent,
      opened,
      replied,
      openRate: sent > 0 ? (opened / sent) * 100 : 0,
      replyRate: sent > 0 ? (replied / sent) * 100 : 0,
    };
  });

  return NextResponse.json({ overview, daily, byCampaign });
}
