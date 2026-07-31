import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryState } from "./QueryState";

function query(overrides: Partial<Parameters<typeof QueryState>[0]["query"]> = {}) {
  return {
    isLoading: false,
    isError: false,
    error: undefined,
    refetch: vi.fn(),
    ...overrides,
  };
}

describe("QueryState", () => {
  it("shows the skeleton while loading", () => {
    render(
      <QueryState query={query({ isLoading: true })} skeleton={<p>Loading…</p>}>
        <p>Rows</p>
      </QueryState>
    );
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(screen.queryByText("Rows")).not.toBeInTheDocument();
  });

  it("shows the error with a working retry", () => {
    const refetch = vi.fn();
    render(
      <QueryState
        query={query({ isError: true, error: new Error("Nope"), refetch })}
        skeleton={<p>Loading…</p>}
      >
        <p>Rows</p>
      </QueryState>
    );

    expect(screen.getByText("Nope")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalled();
  });

  it("prefers the error state over an empty result", () => {
    render(
      <QueryState
        query={query({ isError: true, error: new Error("Nope") })}
        skeleton={<p>Loading…</p>}
        isEmpty
        empty={<p>Nothing here</p>}
      >
        <p>Rows</p>
      </QueryState>
    );
    expect(screen.queryByText("Nothing here")).not.toBeInTheDocument();
    expect(screen.getByText("Nope")).toBeInTheDocument();
  });

  it("shows the empty state for a successful but empty result", () => {
    render(
      <QueryState
        query={query()}
        skeleton={<p>Loading…</p>}
        isEmpty
        empty={<p>Nothing here</p>}
      >
        <p>Rows</p>
      </QueryState>
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.queryByText("Rows")).not.toBeInTheDocument();
  });

  it("renders children when the query has rows", () => {
    const { container } = render(
      <QueryState query={query()} skeleton={<p>Loading…</p>}>
        <p>Rows</p>
      </QueryState>
    );
    expect(screen.getByText("Rows")).toBeInTheDocument();
    expect(container.firstElementChild).not.toHaveClass("opacity-60");
  });

  it("dims stale rows while showing placeholder data", () => {
    const { container } = render(
      <QueryState
        query={query({ isPlaceholderData: true })}
        skeleton={<p>Loading…</p>}
      >
        <p>Rows</p>
      </QueryState>
    );
    expect(screen.getByText("Rows")).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass("opacity-60");
  });
});
