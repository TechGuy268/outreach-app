import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";

export async function getAuthUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user: session.user, error: null };
}
