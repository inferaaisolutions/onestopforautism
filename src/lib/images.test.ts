import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";
import { getTherapies } from "./content";

describe("images", () => {
  it("every therapy image file exists in public/images", () => {
    for (const t of getTherapies()) {
      const imgPath = path.join(process.cwd(), "public", "images", t.image);
      expect(fs.existsSync(imgPath)).toBe(true);
    }
  });

  it("every therapy image has a matching credits.json entry", () => {
    const credits: { filename: string }[] = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "content", "credits.json"), "utf-8")
    );
    const creditedFiles = new Set(credits.map((c) => c.filename));
    for (const t of getTherapies()) {
      expect(creditedFiles.has(t.image)).toBe(true);
    }
  });
});
