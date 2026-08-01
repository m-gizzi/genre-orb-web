import { describe, it, expect, vi, afterEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { useAuth } from "@/contexts/AuthContext";
import { renderWithProviders } from "@/test/utils";
import { Sidebar } from "./Sidebar";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }));

const mockedUseAuth = vi.mocked(useAuth);
const logout = vi.fn();

function setAuth() {
  mockedUseAuth.mockReturnValue({
    user: { id: 1, email: "matthew@example.com" } as never,
    isLoading: false,
    isAuthenticated: true,
    login: vi.fn(),
    signup: vi.fn(),
    logout,
    refreshUser: vi.fn(),
  });
}

describe("Sidebar", () => {
  afterEach(() => vi.clearAllMocks());

  it("links each nav item to its route", () => {
    setAuth();
    renderWithProviders(<Sidebar />, { withTheme: true });

    expect(screen.getByRole("link", { name: /Home/ })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /Tracks/ })).toHaveAttribute(
      "href",
      "/tracks"
    );
    expect(screen.getByRole("link", { name: /Library/ })).toHaveAttribute(
      "href",
      "/library"
    );
  });

  it("shows the signed-in user's email", () => {
    setAuth();
    renderWithProviders(<Sidebar />, { withTheme: true });
    expect(screen.getByText("matthew@example.com")).toBeInTheDocument();
  });

  it("logs out on click", () => {
    setAuth();
    renderWithProviders(<Sidebar />, { withTheme: true });
    fireEvent.click(screen.getByRole("button", { name: /Log out/ }));
    expect(logout).toHaveBeenCalled();
  });
});
