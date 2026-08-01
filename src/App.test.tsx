import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

vi.mock("@/api/client", () => ({
  authApi: {
    me: vi.fn().mockRejectedValue(new Error("Not authenticated")),
  },
  spotifyApi: { connect: vi.fn() },
}));

describe("App", () => {
  it("renders without crashing", () => {
    const { container } = render(<App />);
    expect(container).not.toBeEmptyDOMElement();
  });

  it("redirects unauthenticated users to the login page", async () => {
    render(<App />);
    expect(
      await screen.findByText(/Enter your credentials to continue/i)
    ).toBeInTheDocument();
  });
});
