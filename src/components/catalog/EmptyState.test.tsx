import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders title, description, and action", () => {
    render(
      <EmptyState
        title="Nothing here"
        description="Try again"
        action={<button>Retry</button>}
      />
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByText("Try again")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("shows the orb by default and hides it when disabled", () => {
    const { container, rerender } = render(<EmptyState title="Empty" />);
    expect(container.querySelector(".orb")).toBeInTheDocument();

    rerender(<EmptyState title="Empty" showOrb={false} />);
    expect(container.querySelector(".orb")).not.toBeInTheDocument();
  });
});
