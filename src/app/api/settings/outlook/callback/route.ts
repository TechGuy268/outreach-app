import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/get-user";
import { getTokenFromCode } from "@/lib/outlook";

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser();
  if (error) return NextResponse.redirect(new URL("/login", req.url));

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/settings?error=no_code", req.url));
  }

  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/settings/outlook/callback`;
    const result = await getTokenFromCode(code, redirectUri);

    await prisma.user.update({
      where: { id: user!.id },
      data: {
        outlookAccessToken: result.accessToken,
        outlookRefreshToken: (result as unknown as { refreshToken?: string }).refreshToken || null,
        outlookTokenExpiry: result.expiresOn || null,
      },
    });

    return NextResponse.redirect(new URL("/settings?outlook=connected", req.url));
  } catch {
    return NextResponse.redirect(new URL("/settings?error=auth_failed", req.url));
  }
}
