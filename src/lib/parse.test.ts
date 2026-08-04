import { describe, it, expect } from "vitest";
import { minutesToMs, msToMinutes, toNumber } from "./parse";

describe("toNumber", () => {
  it("parses a numeric string", () => {
    expect(toNumber("42")).toBe(42);
    expect(toNumber("-1.5")).toBe(-1.5);
  });

  it("has nothing to give for a blank or unparseable string", () => {
    expect(toNumber("")).toBeUndefined();
    expect(toNumber("banana")).toBeUndefined();
  });
});

describe("msToMinutes", () => {
  it("converts whole minutes", () => {
    expect(msToMinutes(210_000 + 30_000)).toBe("4");
    expect(msToMinutes(0)).toBe("0");
  });

  it("shows a value that is not a whole minute as it really is", () => {
    expect(msToMinutes(210_000)).toBe("3.5");
  });

  it("has nothing to show for a missing duration", () => {
    expect(msToMinutes(undefined)).toBe("");
  });
});

describe("minutesToMs", () => {
  it("converts minutes to milliseconds", () => {
    expect(minutesToMs("4")).toBe(240_000);
  });

  it("rounds to the whole minute it can store", () => {
    expect(minutesToMs("3.5")).toBe(240_000);
  });

  it("has nothing to store for a blank input", () => {
    expect(minutesToMs("")).toBeUndefined();
  });
});
