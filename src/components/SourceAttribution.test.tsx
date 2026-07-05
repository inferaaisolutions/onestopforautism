import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import SourceAttribution from "./SourceAttribution";

describe("SourceAttribution", () => {
  it("renders a link per source with the correct href", () => {
    render(
      <SourceAttribution
        sources={[
          { label: "Source A", url: "https://a.example.org" },
          { label: "Source B", url: "https://b.example.org" },
        ]}
      />
    );
    expect(screen.getByRole("link", { name: "Source A" })).toHaveAttribute("href", "https://a.example.org");
    expect(screen.getByRole("link", { name: "Source B" })).toHaveAttribute("href", "https://b.example.org");
  });

  it("renders nothing for an empty source list", () => {
    const { container } = render(<SourceAttribution sources={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
