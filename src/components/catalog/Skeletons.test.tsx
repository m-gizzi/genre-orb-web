import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { TableSkeleton, CardGridSkeleton } from "./Skeletons";

describe("TableSkeleton", () => {
  it("renders the default number of rows", () => {
    const { container } = render(<TableSkeleton />);
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(8);
  });

  it("renders a custom number of rows", () => {
    const { container } = render(<TableSkeleton rows={3} />);
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3);
  });
});

describe("CardGridSkeleton", () => {
  it("renders the default number of cards", () => {
    const { container } = render(<CardGridSkeleton />);
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(8);
  });

  it("renders a custom number of cards", () => {
    const { container } = render(<CardGridSkeleton count={4} />);
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(4);
  });
});
