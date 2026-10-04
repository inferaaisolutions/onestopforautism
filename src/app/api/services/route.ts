import { NextRequest, NextResponse } from "next/server";

const ZIP_REGEX = /^\d{5}$/;
const RADIUS_METERS = 40000; // ~25 miles

const ASD_KEYWORDS = [
  "autism", "aba", "behavioral", "behaviour", "speech",
  "occupational", "therapy", "therapist", "developmental",
  "special needs", "pediatric",
];

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

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags: Record<string, string>;
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
  const R = 3958.8; // miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isAsdRelevant(tags: Record<string, string>): boolean {
  const text = Object.values(tags).join(" ").toLowerCase();
  return ASD_KEYWORDS.some((kw) => text.includes(kw));
}

function getServiceType(tags: Record<string, string>): string {
  if (tags["healthcare:speciality"]) return tags["healthcare:speciality"];
  if (tags["amenity"] === "clinic") return "Clinic";
  if (tags["amenity"] === "doctors") return "Doctor";
  if (tags["healthcare"]) return tags["healthcare"];
  return "Healthcare";
}

function buildAddress(tags: Record<string, string>): string {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:city"],
    tags["addr:state"],
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Address not available";
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

  const query = `[out:json][timeout:25];(node["healthcare"](around:${RADIUS_METERS},${lat},${lon});node["amenity"="clinic"](around:${RADIUS_METERS},${lat},${lon});node["amenity"="doctors"](around:${RADIUS_METERS},${lat},${lon});way["healthcare"](around:${RADIUS_METERS},${lat},${lon});way["amenity"="clinic"](around:${RADIUS_METERS},${lat},${lon}););out body;>;out skel qt;`;

  const overpassRes = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (!overpassRes.ok) {
    return NextResponse.json({ error: "Service lookup failed" }, { status: 502 });
  }

  const overpassData: { elements: OverpassElement[] } = await overpassRes.json();

  type Parsed = ServiceResult & { _isAsd: boolean };

  const parsed: Parsed[] = overpassData.elements
    .filter(
      (el) =>
        el.tags?.name &&
        (el.lat !== undefined || el.center?.lat !== undefined)
    )
    .map((el) => {
      const elLat = el.lat ?? el.center!.lat;
      const elLon = el.lon ?? el.center!.lon;
      return {
        id: el.id,
        name: el.tags.name,
        address: buildAddress(el.tags),
        type: getServiceType(el.tags),
        distance: parseFloat(
          haversineDistance(lat, lon, elLat, elLon).toFixed(1)
        ),
        lat: elLat,
        lon: elLon,
        _isAsd: isAsdRelevant(el.tags),
      };
    })
    .sort((a, b) => a.distance - b.distance);

  const asdFiltered = parsed.filter((r) => r._isAsd);
  const raw = asdFiltered.length >= 3 ? asdFiltered : parsed.slice(0, 20);
  const results: ServiceResult[] = raw.map(({ _isAsd: _a, ...r }) => r);

  return NextResponse.json({
    zip,
    city: place["place name"],
    state: place.state,
    results,
  });
}
