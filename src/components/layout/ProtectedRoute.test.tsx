import { describe, it, expect, vi, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { renderWithProviders } from "@/test/utils";
import { ProtectedRoute } from "./ProtectedRoute";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }));

const mockedUseAuth = vi.mocked(useAuth);

function setAuth(overrides: Partial<ReturnType<typeof useAuth>>) {
  mockedUseAuth.mockReturnValue({
    user: null,
    isLoading: false,
    isAuthenticated: false,
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    ...overrides,
  });
}

function renderGuard() {
  return renderWithProviders(
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<div>Protected content</div>} />
      </Route>
      <Route path="/login" element={<div>Login page</div>} />
    </Routes>
  );
}

describe("ProtectedRoute", () => {
  afterEach(() => vi.clearAllMocks());

  it("shows a loading orb while auth resolves", () => {
    setAuth({ isLoading: true });
    renderGuard();
    expect(screen.getByRole("img", { name: "Loading" })).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("redirects to /login when unauthenticated", () => {
    setAuth({ isAuthenticated: false });
    renderGuard();
    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders the protected outlet when authenticated", () => {
    setAuth({ isAuthenticated: true, user: { id: 1 } as never });
    renderGuard();
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });
});
