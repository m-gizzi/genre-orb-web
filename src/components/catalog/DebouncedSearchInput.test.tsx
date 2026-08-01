import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { DebouncedSearchInput } from "./DebouncedSearchInput";

describe("DebouncedSearchInput", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("does not commit on first render", () => {
    const onCommit = vi.fn();
    render(
      <DebouncedSearchInput value="hi" onCommit={onCommit} placeholder="Title…" />
    );
    act(() => vi.advanceTimersByTime(1000));
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("commits the debounced value", () => {
    const onCommit = vi.fn();
    render(
      <DebouncedSearchInput
        value=""
        onCommit={onCommit}
        delay={350}
        placeholder="Title…"
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Title…"), {
      target: { value: "war" },
    });
    act(() => vi.advanceTimersByTime(350));
    expect(onCommit).toHaveBeenCalledWith("war");
  });

  it("resyncs local state when the value prop changes", () => {
    const { rerender } = render(
      <DebouncedSearchInput value="a" onCommit={vi.fn()} placeholder="Title…" />
    );
    expect(screen.getByPlaceholderText("Title…")).toHaveValue("a");

    rerender(
      <DebouncedSearchInput value="b" onCommit={vi.fn()} placeholder="Title…" />
    );
    expect(screen.getByPlaceholderText("Title…")).toHaveValue("b");
  });
});
