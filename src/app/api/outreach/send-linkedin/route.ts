import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/get-user";
import { sendConnectionRequest, sendMessage } from "@/lib/linkedin";
import { renderTemplate, buildVariablesFromLead } from "@/lib/templates";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(req: Request) {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const { leadId, channel, body, campaignStepId } = await req.json();

  // Rate limit check
  const action =
    channel === "LINKEDIN_CONNECT" ? "linkedin_connect" : "linkedin_message";
  const limit = checkRateLimit(user!.id, action);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Rate limited. Try again in ${Math.ceil(limit.resetIn / 1000)}s` },
      { status: 429 }
    );
  }

  // Get user's LinkedIn cookie
  const dbUser = await prisma.user.findUnique({
    where: { id: user!.id },
    select: { linkedinCookie: true },
  });

  if (!dbUser?.linkedinCookie) {
    return NextResponse.json(
      { error: "LinkedIn not connected. Go to Settings to add your cookie." },
      { status: 400 }
    );
  }

  // Get lead
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, userId: user!.id },
  });

  if (!lead || !lead.linkedinUrl) {
    return NextResponse.json(
      { error: "Lead not found or has no LinkedIn URL" },
      { status: 400 }
    );
  }

  // Extract profile ID from LinkedIn URL
  const profileId = lead.linkedinUrl
    .replace(/\/$/, "")
    .split("/")
    .pop();

  if (!profileId) {
    return NextResponse.json(
      { error: "Invalid LinkedIn URL" },
      { status: 400 }
    );
  }

  // Render template
  const variables = buildVariablesFromLead(lead);
  const renderedBody = body ? renderTemplate(body, variables) : undefined;

  // Create tracking log
  const log = await prisma.outreachLog.create({
    data: {
      channel,
      status: "PENDING",
      userId: user!.id,
      leadId: lead.id,
      campaignStepId: campaignStepId || null,
    },
  });

  try {
    if (channel === "LINKEDIN_CONNECT") {
      await sendConnectionRequest(
        dbUser.linkedinCookie,
        profileId,
        renderedBody
      );
    } else {
      if (!renderedBody) {
        return NextResponse.json(
          { error: "Message body is required for LinkedIn messages" },
          { status: 400 }
        );
      }
      await sendMessage(dbUser.linkedinCookie, profileId, renderedBody);
    }

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

    return NextResponse.json(
      { error: "Failed to send LinkedIn action" },
      { status: 500 }
    );
  }
}
