import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/get-user";
import { sendEmail } from "@/lib/outlook";
import { renderTemplate, buildVariablesFromLead } from "@/lib/templates";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(req: Request) {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const { leadId, subject, body, campaignStepId } = await req.json();

  // Rate limit check
  const limit = checkRateLimit(user!.id, "outlook_email");
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Rate limited. Try again in ${Math.ceil(limit.resetIn / 1000)}s` },
      { status: 429 }
    );
  }

  // Get user's Outlook token
  const dbUser = await prisma.user.findUnique({
    where: { id: user!.id },
    select: { outlookAccessToken: true },
  });

  if (!dbUser?.outlookAccessToken) {
    return NextResponse.json(
      { error: "Outlook not connected. Go to Settings to connect." },
      { status: 400 }
    );
  }

  // Get lead
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, userId: user!.id },
  });

  if (!lead || !lead.email) {
    return NextResponse.json(
      { error: "Lead not found or has no email" },
      { status: 400 }
    );
  }

  // Render template
  const variables = buildVariablesFromLead(lead);
  const renderedSubject = renderTemplate(subject, variables);
  const renderedBody = renderTemplate(body, variables);

  // Create tracking log
  const log = await prisma.outreachLog.create({
    data: {
      channel: "EMAIL",
      status: "PENDING",
      userId: user!.id,
      leadId: lead.id,
      campaignStepId: campaignStepId || null,
    },
  });

  try {
    const trackingPixelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/track/open/${log.id}`;

    await sendEmail(dbUser.outlookAccessToken, {
      to: lead.email,
      subject: renderedSubject,
      body: renderedBody,
      trackingPixelUrl,
    });

    await prisma.outreachLog.update({
      where: { id: log.id },
      data: { status: "SENT", sentAt: new Date() },
    });

    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: "CONTACTED" },
    });

    return NextResponse.json({ success: true, logId: log.id });
  } catch (err) {
    await prisma.outreachLog.update({
      where: { id: log.id },
      data: {
        status: "FAILED",
        error: err instanceof Error ? err.message : "Send failed",
      },
    });

    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
