import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-user";

export async function POST(req: Request) {
  const { error } = await getAuthUser();
  if (error) return error;

  const { apiKey } = await req.json();
  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  // Store in environment (in production, use a secrets manager)
  // For now, we acknowledge it but the key should be set in .env
  // This is a placeholder — in production you'd store this securely
  return NextResponse.json({
    success: true,
    message: "API key acknowledged. Set GOOGLE_PLACES_API_KEY in your .env for it to take effect.",
  });
}
