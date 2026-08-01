import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { PaginationMeta } from "@/api/client";
import { Pagination } from "./Pagination";

function meta(overrides: Partial<PaginationMeta> = {}): PaginationMeta {
  return { page: 2, per_page: 25, total: 120, total_pages: 5, ...overrides };
}

describe("Pagination", () => {
  it("renders nothing when there are no items", () => {
    const { container } = render(
      <Pagination meta={meta({ total: 0 })} onPageChange={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the total count, label, and current page", () => {
    render(<Pagination meta={meta()} label="tracks" onPageChange={vi.fn()} />);
    expect(screen.getByText("120 tracks")).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 5")).toBeInTheDocument();
  });

  it("moves to the previous and next page", () => {
    const onPageChange = vi.fn();
    render(<Pagination meta={meta({ page: 2 })} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    expect(onPageChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("disables previous on the first page", () => {
    render(<Pagination meta={meta({ page: 1 })} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();
  });

  it("disables next on the last page", () => {
    render(
      <Pagination meta={meta({ page: 5, total_pages: 5 })} onPageChange={vi.fn()} />
    );
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("shows the per-page control only when a handler is given", () => {
    const { rerender } = render(
      <Pagination meta={meta()} onPageChange={vi.fn()} />
    );
    expect(screen.queryByText("Per page")).not.toBeInTheDocument();

    rerender(
      <Pagination meta={meta()} onPageChange={vi.fn()} onPerPageChange={vi.fn()} />
    );
    expect(screen.getByText("Per page")).toBeInTheDocument();
  });
});
