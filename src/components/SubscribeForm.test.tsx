import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, afterEach } from "vitest";
import SubscribeForm from "./SubscribeForm";

describe("SubscribeForm", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders email input and subscribe button", () => {
    render(<SubscribeForm />);
    expect(screen.getByPlaceholderText("your@email.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /subscribe/i })).toBeInTheDocument();
  });

  it("shows success message after successful submit", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
    render(<SubscribeForm />);
    fireEvent.change(screen.getByPlaceholderText("your@email.com"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /subscribe/i }));
    await waitFor(() => {
      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
    });
  });

  it("shows error message on failed submit", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 500 })));
    render(<SubscribeForm />);
    fireEvent.change(screen.getByPlaceholderText("your@email.com"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /subscribe/i }));
    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  it("disables input and button while loading", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(new Response("{}", { status: 200 })), 100)
          )
      )
    );
    render(<SubscribeForm />);
    fireEvent.change(screen.getByPlaceholderText("your@email.com"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /subscribe/i }));
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByPlaceholderText("your@email.com")).toBeDisabled();
  });
});
