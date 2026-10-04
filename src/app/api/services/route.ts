import { NextRequest, NextResponse } from "next/server";

const ZIP_REGEX = /^\d{5}$/;
const NOMINATIM_UA = "ASD-Guide/1.0";

interface ZippopotamResponse {
  "post code": string;
  country: string;
  places: Array<{
    "place name": string;
    state: string;
    latitude: string;
    longitude: string;
  }>;
}

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  name: string;
  display_name: string;
  type: string;
  class: string;
}

export interface ServiceResult {
  id: number;
  name: string;
  address: string;
  type: string;
  distance: number;
  lat: number;
  lon: number;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatType(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function shortAddress(display_name: string): string {
  // display_name is "Name, house, street, suburb, city, state, zip, country"
  // Strip the first part (name) and last part (country), return rest trimmed
  const parts = display_name.split(", ");
  if (parts.length > 3) return parts.slice(1, -1).join(", ");
  return display_name;
}

async function nominatimSearch(q: string): Promise<NominatimResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=15&countrycodes=us&addressdetails=0`;
  const res = await fetch(url, { headers: { "User-Agent": NOMINATIM_UA } });
  if (!res.ok) return [];
  return res.json();
}

export async function GET(req: NextRequest) {
  const zip = req.nextUrl.searchParams.get("zip")?.trim() ?? "";

  if (!ZIP_REGEX.test(zip)) {
    return NextResponse.json({ error: "Invalid zip code" }, { status: 400 });
  }

  const geoRes = await fetch(`https://api.zippopotam.us/us/${zip}`);
  if (!geoRes.ok) {
    return NextResponse.json({ error: "Zip code not found" }, { status: 404 });
  }
  const geoData: ZippopotamResponse = await geoRes.json();
  const place = geoData.places[0];
  const lat = parseFloat(place.latitude);
  const lon = parseFloat(place.longitude);
  const cityState = `${place["place name"]} ${place.state}`;

  const city = place["place name"];

  // Three parallel searches using simple queries Nominatim handles well
  const [r1, r2, r3] = await Promise.all([
    nominatimSearch(`speech therapy ${city}`),
    nominatimSearch(`occupational therapy ${city}`),
    nominatimSearch(`behavioral health ${city}`),
  ]);

  // Merge, deduplicate by place_id
  const seen = new Set<number>();
  const merged: NominatimResult[] = [];
  for (const r of [...r1, ...r2, ...r3]) {
    if (!seen.has(r.place_id) && r.name) {
      seen.add(r.place_id);
      merged.push(r);
    }
  }

  const results: ServiceResult[] = merged
    .map((r) => ({
      id: r.place_id,
      name: r.name,
      address: shortAddress(r.display_name),
      type: formatType(r.type || r.class),
      distance: parseFloat(
        haversineDistance(lat, lon, parseFloat(r.lat), parseFloat(r.lon)).toFixed(1)
      ),
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 20);

  return NextResponse.json({
    zip,
    city: place["place name"],
    state: place.state,
    results,
  });
}
