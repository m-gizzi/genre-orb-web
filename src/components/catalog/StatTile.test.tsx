import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/utils";
import { StatTile } from "./StatTile";

describe("StatTile", () => {
  it("formats the value", () => {
    renderWithProviders(<StatTile label="Tracks" value={1234} />);
    expect(screen.getByText("Tracks")).toBeInTheDocument();
    expect(screen.getByText("1,234")).toBeInTheDocument();
  });

  it("shows a dash while loading", () => {
    renderWithProviders(<StatTile label="Tracks" value={1234} isLoading />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("1,234")).not.toBeInTheDocument();
  });

  it("wraps in a link when a target is given", () => {
    renderWithProviders(<StatTile label="Tracks" value={5} to="/tracks" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/tracks");
  });

  it("renders without a link when no target is given", () => {
    renderWithProviders(<StatTile label="Tracks" value={5} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
