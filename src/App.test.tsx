import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

vi.mock("@/api/client", () => ({
  authApi: {
    me: vi.fn().mockRejectedValue(new Error("Not authenticated")),
  },
}));

describe("App", () => {
  it("renders without crashing", () => {
    render(<App />);
    expect(screen.getByText(/Genre Orb/i)).toBeInTheDocument();
  });

  it("shows get started button when not authenticated", async () => {
    render(<App />);
    expect(await screen.findByText(/Get Started/i)).toBeInTheDocument();
  });
});
