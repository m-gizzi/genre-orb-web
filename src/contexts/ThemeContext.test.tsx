import { describe, it, expect, afterEach } from "vitest";
import { renderHook, act, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { ThemeProvider, useTheme } from "./ThemeContext";

const STORAGE_KEY = "genre-orb-theme";

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe("ThemeContext", () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("defaults to light and does not set the dark class", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("light");
  });

  it("reads the stored theme on mount", () => {
    localStorage.setItem(STORAGE_KEY, "dark");
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("toggles the theme and persists it", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("sets a specific theme", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.setTheme("dark"));
    expect(result.current.theme).toBe("dark");
  });

  it("throws when used outside a provider", () => {
    function Consumer() {
      useTheme();
      return null;
    }
    expect(() => render(<Consumer />)).toThrow(
      /useTheme must be used within a ThemeProvider/
    );
  });
});
