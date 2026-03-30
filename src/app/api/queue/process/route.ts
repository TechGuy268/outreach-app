import { NextResponse } from "next/server";

// QStash webhook endpoint for processing queued messages
export async function POST(req: Request) {
  // Verify QStash signature in production
  const signature = req.headers.get("upstash-signature");
  if (!signature && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const message = await req.json();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    switch (message.type) {
      case "send_email":
        await fetch(`${baseUrl}/api/outreach/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(message.payload),
        });
        break;

      case "send_linkedin":
        await fetch(`${baseUrl}/api/outreach/send-linkedin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(message.payload),
        });
        break;

      case "scrape":
        await fetch(`${baseUrl}/api/scrape/google-business`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(message.payload),
        });
        break;

      default:
        return NextResponse.json(
          { error: `Unknown message type: ${message.type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }
}
