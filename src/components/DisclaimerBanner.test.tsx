import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import DisclaimerBanner from "./DisclaimerBanner";

describe("DisclaimerBanner", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows the banner on first visit", () => {
    render(<DisclaimerBanner />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("hides the banner after dismiss is clicked and remembers it", async () => {
    const user = userEvent.setup();
    render(<DisclaimerBanner />);
    await user.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(localStorage.getItem("asd-guide-disclaimer-dismissed")).toBe("true");
  });
});
