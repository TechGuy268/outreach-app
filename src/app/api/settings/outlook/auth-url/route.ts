import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-user";
import { getAuthUrl } from "@/lib/outlook";

export async function GET() {
  const { error } = await getAuthUser();
  if (error) return error;

  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/settings/outlook/callback`;
    const url = await getAuthUrl(redirectUri);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate auth URL. Check Outlook config." },
      { status: 500 }
    );
  }
}
