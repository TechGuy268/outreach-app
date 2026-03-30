import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/get-user";
import { scrapeBusinesses } from "@/lib/scraper";

export async function POST(req: Request) {
  const { user, error } = await getAuthUser();
  if (error) return error;

  const { query, location, maxResults } = await req.json();

  if (!query || !location) {
    return NextResponse.json(
      { error: "Query and location are required" },
      { status: 400 }
    );
  }

  // Create scraping job
  const job = await prisma.scrapingJob.create({
    data: {
      source: "google_business",
      query,
      location,
      status: "RUNNING",
      userId: user!.id,
    },
  });

  try {
    const businesses = await scrapeBusinesses(
      query,
      location,
      parseInt(maxResults) || 20
    );

    // Create leads from results
    let created = 0;
    for (const biz of businesses) {
      try {
        // Extract first/last name from business name
        const nameParts = biz.name.split(" ");
        await prisma.lead.create({
          data: {
            firstName: nameParts[0] || biz.name,
            lastName: nameParts.slice(1).join(" ") || "—",
            company: biz.name,
            phone: biz.phone || null,
            website: biz.website || null,
            location: biz.address,
            source: "google_business",
            userId: user!.id,
          },
        });
        created++;
      } catch {
        // Skip duplicates
      }
    }

    await prisma.scrapingJob.update({
      where: { id: job.id },
      data: { status: "COMPLETED", resultsCount: created },
    });

    return NextResponse.json({ count: created, total: businesses.length });
  } catch (err) {
    await prisma.scrapingJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        error: err instanceof Error ? err.message : "Unknown error",
      },
    });

    return NextResponse.json(
      { error: "Scraping failed. Check your Google Places API key." },
      { status: 500 }
    );
  }
}
