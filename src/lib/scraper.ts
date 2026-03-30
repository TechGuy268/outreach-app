/**
 * Google Business / Places scraper
 * Uses Google Places API (Text Search) to find businesses
 */

interface PlaceResult {
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  types?: string[];
  placeId: string;
}

interface PlaceDetails {
  name: string;
  address: string;
  phone?: string;
  website?: string;
  email?: string;
  rating?: number;
  reviewCount?: number;
}

const GOOGLE_PLACES_BASE = "https://maps.googleapis.com/maps/api/place";

export async function searchBusinesses(
  query: string,
  location?: string,
  apiKey?: string
): Promise<PlaceResult[]> {
  const key = apiKey || process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("Google Places API key not configured");

  const searchQuery = location ? `${query} in ${location}` : query;
  const params = new URLSearchParams({
    query: searchQuery,
    key,
  });

  const res = await fetch(`${GOOGLE_PLACES_BASE}/textsearch/json?${params}`);
  const data = await res.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Google Places API error: ${data.status}`);
  }

  return (data.results || []).map((place: Record<string, unknown>) => ({
    name: place.name as string,
    address: place.formatted_address as string,
    phone: undefined,
    website: undefined,
    rating: place.rating as number | undefined,
    types: place.types as string[] | undefined,
    placeId: place.place_id as string,
  }));
}

export async function getPlaceDetails(
  placeId: string,
  apiKey?: string
): Promise<PlaceDetails> {
  const key = apiKey || process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("Google Places API key not configured");

  const params = new URLSearchParams({
    place_id: placeId,
    fields: "name,formatted_address,formatted_phone_number,website,rating,user_ratings_total",
    key,
  });

  const res = await fetch(`${GOOGLE_PLACES_BASE}/details/json?${params}`);
  const data = await res.json();

  if (data.status !== "OK") {
    throw new Error(`Google Places Details API error: ${data.status}`);
  }

  const result = data.result;
  return {
    name: result.name,
    address: result.formatted_address,
    phone: result.formatted_phone_number,
    website: result.website,
    rating: result.rating,
    reviewCount: result.user_ratings_total,
  };
}

export async function scrapeBusinesses(
  query: string,
  location: string,
  maxResults = 20,
  apiKey?: string
): Promise<PlaceDetails[]> {
  const places = await searchBusinesses(query, location, apiKey);
  const limited = places.slice(0, maxResults);

  const details: PlaceDetails[] = [];
  for (const place of limited) {
    // Rate limit: small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 200));
    try {
      const detail = await getPlaceDetails(place.placeId, apiKey);
      details.push(detail);
    } catch {
      // Skip failed lookups
      details.push({
        name: place.name,
        address: place.address,
        phone: place.phone,
        website: place.website,
        rating: place.rating,
      });
    }
  }

  return details;
}
