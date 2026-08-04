import { describe, it, expect } from "vitest";
import { pageStartIndex } from "./pagination";

describe("pageStartIndex", () => {
  it("is zero on the first page", () => {
    expect(pageStartIndex({ page: 1, per_page: 25, total: 100, total_pages: 4 })).toBe(0);
  });

  it("counts the rows on every earlier page", () => {
    expect(pageStartIndex({ page: 3, per_page: 25, total: 100, total_pages: 4 })).toBe(50);
  });

  it("is zero before any meta has arrived", () => {
    expect(pageStartIndex(undefined)).toBe(0);
  });
});
