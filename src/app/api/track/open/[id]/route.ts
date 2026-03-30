import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// 1x1 transparent GIF
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Update the outreach log with open timestamp
  try {
    await prisma.outreachLog.update({
      where: { id },
      data: { openedAt: new Date(), status: "OPENED" },
    });
  } catch {
    // Log not found, ignore
  }

  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
