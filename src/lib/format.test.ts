import { describe, it, expect } from "vitest";
import { formatDuration, formatNumber, formatDate } from "./format";

describe("formatDuration", () => {
  it("formats minutes and seconds", () => {
    expect(formatDuration(215000)).toBe("3:35");
  });

  it("zero-pads seconds", () => {
    expect(formatDuration(65000)).toBe("1:05");
  });

  it("includes hours for long durations", () => {
    expect(formatDuration(3_725_000)).toBe("1:02:05");
  });

  it("returns a dash for null or negative", () => {
    expect(formatDuration(null)).toBe("—");
    expect(formatDuration(-1)).toBe("—");
  });
});

describe("formatNumber", () => {
  it("adds thousands separators", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
  });

  it("returns a dash for null", () => {
    expect(formatNumber(null)).toBe("—");
  });
});

describe("formatDate", () => {
  it("returns 'Never' for null or invalid input", () => {
    expect(formatDate(null)).toBe("Never");
    expect(formatDate("not-a-date")).toBe("Never");
  });

  it("formats an ISO timestamp", () => {
    expect(formatDate("2026-07-12T10:00:00Z")).toMatch(/2026/);
  });
});
