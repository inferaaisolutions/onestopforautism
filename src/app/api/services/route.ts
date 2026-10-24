import { NextRequest, NextResponse } from "next/server";

const ZIP_REGEX = /^\d{5}$/;
const UA = "OneStopForAutism/1.0 (onestopforautism.org)";
// ~25 miles in degrees (approximate)
const BBOX_DELTA = 0.4;

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

function labelType(type: string): string {
  const map: Record<string, string> = {
    clinic: "Clinic",
    hospital: "Hospital",
    doctors: "Doctor / GP",
    therapist: "Therapist",
    psychologist: "Psychologist",
    psychiatrist: "Psychiatrist",
    centre: "Healthcare Centre",
    social_facility: "Social Service",
  };
  return map[type] ?? type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function shortAddress(display_name: string): string {
  const parts = display_name.split(", ");
  if (parts.length > 3) return parts.slice(1, -1).join(", ");
  return display_name;
}

async function amenitySearch(amenity: string, viewbox: string): Promise<NominatimResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?amenity=${encodeURIComponent(amenity)}&format=json&limit=20&bounded=1&viewbox=${viewbox}&countrycodes=us`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
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

  // viewbox: minLon,maxLat,maxLon,minLat (Nominatim format)
  const viewbox = `${lon - BBOX_DELTA},${lat + BBOX_DELTA},${lon + BBOX_DELTA},${lat - BBOX_DELTA}`;

  const [r1, r2, r3, r4] = await Promise.all([
    amenitySearch("clinic", viewbox),
    amenitySearch("hospital", viewbox),
    amenitySearch("doctors", viewbox),
    amenitySearch("therapist", viewbox),
  ]);

  const seen = new Set<number>();
  const results: ServiceResult[] = [];

  for (const r of [...r1, ...r2, ...r3, ...r4]) {
    if (!r.name || seen.has(r.place_id)) continue;
    seen.add(r.place_id);
    results.push({
      id: r.place_id,
      name: r.name,
      address: shortAddress(r.display_name),
      type: labelType(r.type || r.class),
      distance: parseFloat(
        haversineDistance(lat, lon, parseFloat(r.lat), parseFloat(r.lon)).toFixed(1)
      ),
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
    });
  }

  results.sort((a, b) => a.distance - b.distance);

  return NextResponse.json({
    zip,
    city: place["place name"],
    state: place.state,
    results: results.slice(0, 20),
  });
}
