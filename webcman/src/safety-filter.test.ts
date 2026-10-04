import { isSafe, sanitize, isSafeObject } from "./safety-filter";

const blockedPhrases = ["consult your doctor", "medical advice", "seek medical attention"];

it("passes clean content", () => {
  expect(isSafe("Research suggests this therapy may help with communication.", blockedPhrases)).toBe(true);
});
it("blocks content with forbidden phrase", () => {
  expect(isSafe("You should consult your doctor before trying this.", blockedPhrases)).toBe(false);
});
it("blocks case-insensitively", () => {
  expect(isSafe("This is not Medical Advice.", blockedPhrases)).toBe(false);
});
it("sanitize trims and collapses whitespace", () => {
  expect(sanitize("  hello   world  ")).toBe("hello world");
});
it("isSafeObject checks all values in an object", () => {
  expect(isSafeObject({ summary: "consult your doctor before use" }, blockedPhrases)).toBe(false);
  expect(isSafeObject({ summary: "Research suggests improvements" }, blockedPhrases)).toBe(true);
});
