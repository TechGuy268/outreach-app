import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-user";
import { verifyConnection } from "@/lib/outlook";

export async function GET() {
  const { error } = await getAuthUser();
  if (error) return error;

  try {
    await verifyConnection();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "SMTP connection failed. Check OUTLOOK_EMAIL and OUTLOOK_PASSWORD." },
      { status: 500 }
    );
  }
}
