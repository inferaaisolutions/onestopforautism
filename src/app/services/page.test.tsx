import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ServicesPage from "./page";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

describe("ServicesPage", () => {
  it("renders zip input and submit button", () => {
    render(<ServicesPage />);
    expect(screen.getByPlaceholderText(/zip code/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /find services/i })).toBeInTheDocument();
  });

  it("shows searching state while fetching", async () => {
    vi.mocked(fetch).mockReturnValueOnce(new Promise(() => {})); // never resolves
    render(<ServicesPage />);
    fireEvent.change(screen.getByPlaceholderText(/zip code/i), {
      target: { value: "10001" },
    });
    fireEvent.click(screen.getByRole("button", { name: /find services/i }));
    expect(await screen.findByText(/searching/i)).toBeInTheDocument();
  });

  it("renders result cards after successful fetch", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          zip: "10001",
          city: "New York City",
          state: "New York",
          results: [
            {
              id: 1,
              name: "NYC Autism Center",
              address: "5th Ave, New York",
              type: "Clinic",
              distance: 0.5,
              lat: 40.75,
              lon: -73.99,
            },
          ],
        }),
        { status: 200 }
      )
    );
    render(<ServicesPage />);
    fireEvent.change(screen.getByPlaceholderText(/zip code/i), {
      target: { value: "10001" },
    });
    fireEvent.click(screen.getByRole("button", { name: /find services/i }));
    expect(await screen.findByText("NYC Autism Center")).toBeInTheDocument();
    expect(screen.getByText(/0\.5 mi/i)).toBeInTheDocument();
  });

  it("shows no-results message for empty results array", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ zip: "10001", city: "Nowhere", state: "XX", results: [] }),
        { status: 200 }
      )
    );
    render(<ServicesPage />);
    fireEvent.change(screen.getByPlaceholderText(/zip code/i), {
      target: { value: "10001" },
    });
    fireEvent.click(screen.getByRole("button", { name: /find services/i }));
    expect(await screen.findByText(/no services found/i)).toBeInTheDocument();
  });

  it("shows error message on failed fetch", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: "Zip code not found" }),
        { status: 404 }
      )
    );
    render(<ServicesPage />);
    fireEvent.change(screen.getByPlaceholderText(/zip code/i), {
      target: { value: "99999" },
    });
    fireEvent.click(screen.getByRole("button", { name: /find services/i }));
    expect(await screen.findByText(/zip code not found/i)).toBeInTheDocument();
  });
});
