import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchInput } from "./SearchInput";

describe("SearchInput", () => {
  it("uses the default placeholder", () => {
    render(<SearchInput value="" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText("Search…")).toBeInTheDocument();
  });

  it("reports typed input via onChange", () => {
    const onChange = vi.fn();
    render(<SearchInput value="" onChange={onChange} placeholder="Genre…" />);
    fireEvent.change(screen.getByPlaceholderText("Genre…"), {
      target: { value: "rock" },
    });
    expect(onChange).toHaveBeenCalledWith("rock");
  });
});
