import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// This cron job processes scheduled campaign sends
// Configure in vercel.json: runs every 15 minutes
export async function GET(req: Request) {
  // Verify cron secret (Vercel sets this automatically)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find campaign leads that are due for their next step
  const dueLeads = await prisma.campaignLead.findMany({
    where: {
      status: "IN_PROGRESS",
      nextSendAt: { lte: now },
      campaign: { status: "ACTIVE" },
    },
    include: {
      campaign: {
        include: {
          steps: { orderBy: { order: "asc" } },
          user: {
            select: {
              id: true,
              outlookAccessToken: true,
              linkedinCookie: true,
            },
          },
        },
      },
      lead: true,
    },
    take: 50, // Process in batches
  });

  let processed = 0;

  for (const cl of dueLeads) {
    const step = cl.campaign.steps[cl.currentStep];
    if (!step) {
      // No more steps, mark as completed
      await prisma.campaignLead.update({
        where: { id: cl.id },
        data: { status: "COMPLETED", completedAt: now },
      });
      continue;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      if (step.channel === "EMAIL") {
        await fetch(`${baseUrl}/api/outreach/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadId: cl.leadId,
            subject: step.subject || "",
            body: step.body,
            campaignStepId: step.id,
          }),
        });
      } else {
        await fetch(`${baseUrl}/api/outreach/send-linkedin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadId: cl.leadId,
            channel: step.channel,
            body: step.body,
            campaignStepId: step.id,
          }),
        });
      }

      // Move to next step
      const nextStep = cl.campaign.steps[cl.currentStep + 1];
      if (nextStep) {
        const nextSendAt = new Date();
        nextSendAt.setDate(nextSendAt.getDate() + nextStep.delayDays);

        await prisma.campaignLead.update({
          where: { id: cl.id },
          data: {
            currentStep: cl.currentStep + 1,
            nextSendAt,
          },
        });
      } else {
        await prisma.campaignLead.update({
          where: { id: cl.id },
          data: { status: "COMPLETED", completedAt: now },
        });
      }

      processed++;
    } catch {
      // Log error but continue processing others
    }
  }

  return NextResponse.json({ processed, total: dueLeads.length });
}
