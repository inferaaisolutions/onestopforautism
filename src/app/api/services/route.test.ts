// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

const mockZippopotam = {
  "post code": "10001",
  country: "United States",
  places: [
    {
      "place name": "New York City",
      state: "New York",
      latitude: "40.7484",
      longitude: "-73.9967",
    },
  ],
};

const mockOverpass = {
  elements: [
    {
      type: "node",
      id: 1,
      lat: 40.75,
      lon: -73.99,
      tags: {
        name: "NYC Autism Center",
        amenity: "clinic",
        "addr:street": "5th Ave",
        "addr:city": "New York",
      },
    },
    {
      type: "node",
      id: 2,
      lat: 40.76,
      lon: -74.0,
      tags: { name: "General Hospital", amenity: "clinic" },
    },
  ],
};

function makeRequest(zip: string) {
  return new NextRequest(`http://localhost/api/services?zip=${zip}`);
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

describe("GET /api/services", () => {
  it("returns 400 for invalid zip", async () => {
    const res = await GET(makeRequest("abc"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid zip code");
  });

  it("returns 404 when zippopotam returns non-ok", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 404 }));
    const res = await GET(makeRequest("99999"));
    expect(res.status).toBe(404);
  });

  it("returns 502 when overpass fails", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockZippopotam), { status: 200 })
      )
      .mockResolvedValueOnce(new Response(null, { status: 500 }));
    const res = await GET(makeRequest("10001"));
    expect(res.status).toBe(502);
  });

  it("returns sorted results for valid zip", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockZippopotam), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockOverpass), { status: 200 })
      );
    const res = await GET(makeRequest("10001"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.zip).toBe("10001");
    expect(Array.isArray(body.results)).toBe(true);
    if (body.results.length >= 2) {
      expect(body.results[0].distance).toBeLessThanOrEqual(
        body.results[body.results.length - 1].distance
      );
    }
  });

  it("falls back to all results when fewer than 3 ASD-keyword matches", async () => {
    // mockOverpass has 1 ASD-relevant result ("autism" in name), 1 generic
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockZippopotam), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(mockOverpass), { status: 200 })
      );
    const res = await GET(makeRequest("10001"));
    const body = await res.json();
    // Only 1 ASD match → fallback to all 2 results
    expect(body.results.length).toBe(2);
  });
});
