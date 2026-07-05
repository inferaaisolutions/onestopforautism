import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import TherapiesExplorer from "./TherapiesExplorer";
import { Therapy } from "@/lib/schema";

const makeTherapy = (overrides: Partial<Therapy>): Therapy => ({
  slug: "t",
  name: "Speech Therapy",
  category: "Communication",
  summary: "Helps with communication",
  description: "desc",
  claimedBenefits: ["benefit"],
  evidenceNotes: "notes",
  evidenceLevel: "clinical",
  regions: ["Global"],
  sources: [{ label: "Source", url: "https://example.org" }],
  image: "img.jpg",
  sourceType: "seed",
  updatedAt: "2026-01-01",
  ...overrides,
});

describe("TherapiesExplorer", () => {
  it("filters visible cards as the user types", async () => {
    const user = userEvent.setup();
    const therapies = [
      makeTherapy({ slug: "speech", name: "Speech Therapy" }),
      makeTherapy({ slug: "music", name: "Music Therapy" }),
    ];
    render(<TherapiesExplorer therapies={therapies} />);
    expect(screen.getAllByRole("link")).toHaveLength(2);

    await user.type(screen.getByLabelText("Search"), "speech");
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByText("Speech Therapy")).toBeInTheDocument();
  });

  it("shows a no-results message when nothing matches", async () => {
    const user = userEvent.setup();
    render(<TherapiesExplorer therapies={[makeTherapy({})]} />);
    await user.type(screen.getByLabelText("Search"), "nonexistent");
    expect(screen.getByText(/no therapies match/i)).toBeInTheDocument();
  });
});
