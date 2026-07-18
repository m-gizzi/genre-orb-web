import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { DebouncedInput } from "./DebouncedInput";

describe("DebouncedInput", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("does not commit on first render", () => {
    const onCommit = vi.fn();
    render(<DebouncedInput value="hello" onCommit={onCommit} placeholder="x" />);
    act(() => vi.advanceTimersByTime(1000));
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("commits the value after the delay", () => {
    const onCommit = vi.fn();
    render(
      <DebouncedInput value="" onCommit={onCommit} delay={350} placeholder="x" />
    );

    fireEvent.change(screen.getByPlaceholderText("x"), {
      target: { value: "war" },
    });
    act(() => vi.advanceTimersByTime(349));
    expect(onCommit).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(onCommit).toHaveBeenCalledWith("war");
  });

  it("resyncs local state when the value prop changes", () => {
    const { rerender } = render(
      <DebouncedInput value="a" onCommit={vi.fn()} placeholder="x" />
    );
    expect(screen.getByPlaceholderText("x")).toHaveValue("a");

    rerender(<DebouncedInput value="b" onCommit={vi.fn()} placeholder="x" />);
    expect(screen.getByPlaceholderText("x")).toHaveValue("b");
  });
});
