import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import EvidenceTag from "./EvidenceTag";

describe("EvidenceTag", () => {
  it.each([
    ["clinical", "Clinical / Peer-Reviewed"],
    ["emerging", "Emerging Evidence"],
    ["anecdotal", "Anecdotal / Community-Sourced"],
  ] as const)("renders the label for %s", (level, label) => {
    render(<EvidenceTag level={level} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
