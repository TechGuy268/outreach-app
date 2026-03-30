import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/get-user";

export async function GET(req: NextRequest) {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const search = req.nextUrl.searchParams.get("search") || "";
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "100");

  const leads = await prisma.lead.findMany({
    where: {
      userId: user!.id,
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { company: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ leads });
}

export async function POST(req: Request) {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const body = await req.json();
  const { firstName, lastName, email, company, jobTitle, linkedinUrl, phone, website, location, source } = body;

  if (!firstName || !lastName) {
    return NextResponse.json(
      { error: "First name and last name are required" },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.create({
    data: {
      firstName,
      lastName,
      email: email || null,
      company: company || null,
      jobTitle: jobTitle || null,
      linkedinUrl: linkedinUrl || null,
      phone: phone || null,
      website: website || null,
      location: location || null,
      source: source || "manual",
      userId: user!.id,
    },
  });

  return NextResponse.json({ lead }, { status: 201 });
}
