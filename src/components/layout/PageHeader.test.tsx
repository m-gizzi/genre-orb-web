import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
  it("renders the title as a heading", () => {
    render(<PageHeader title="Tracks" />);
    expect(screen.getByRole("heading", { name: "Tracks" })).toBeInTheDocument();
  });

  it("renders description and actions when provided", () => {
    render(
      <PageHeader
        title="Tracks"
        description="Your library"
        actions={<button>Sort</button>}
      />
    );
    expect(screen.getByText("Your library")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sort" })).toBeInTheDocument();
  });

  it("omits the description when not provided", () => {
    render(<PageHeader title="Tracks" />);
    expect(screen.queryByText("Your library")).not.toBeInTheDocument();
  });
});
