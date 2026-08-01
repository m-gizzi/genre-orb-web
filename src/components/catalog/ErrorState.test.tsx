import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorState } from "./ErrorState";

describe("ErrorState", () => {
  it("shows the message from an Error", () => {
    render(<ErrorState error={new Error("Spotify said no")} />);
    expect(screen.getByText("Spotify said no")).toBeInTheDocument();
    expect(screen.getByText("Couldn't load this")).toBeInTheDocument();
  });

  it("falls back for non-Error values", () => {
    render(<ErrorState error={"oops"} />);
    expect(
      screen.getByText("Something went wrong. Please try again.")
    ).toBeInTheDocument();
  });

  it("accepts a custom title", () => {
    render(<ErrorState error={new Error("x")} title="No artists" />);
    expect(screen.getByText("No artists")).toBeInTheDocument();
  });
});
