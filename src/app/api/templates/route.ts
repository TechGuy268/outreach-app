import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/get-user";
import { extractVariables } from "@/lib/templates";

export async function GET() {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const templates = await prisma.template.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ templates });
}

export async function POST(req: Request) {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const { name, channel, subject, body } = await req.json();

  if (!name || !channel || !body) {
    return NextResponse.json(
      { error: "Name, channel, and body are required" },
      { status: 400 }
    );
  }

  const variables = extractVariables(body + (subject || ""));

  const template = await prisma.template.create({
    data: {
      name,
      channel,
      subject: subject || null,
      body,
      variables,
      userId: user!.id,
    },
  });

  return NextResponse.json({ template }, { status: 201 });
}
