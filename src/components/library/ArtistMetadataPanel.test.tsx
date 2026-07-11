import { describe, it, expect, vi, afterEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { artistsApi, type ArtistSyncStatus } from "@/api/client";
import { ArtistMetadataPanel } from "./ArtistMetadataPanel";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return {
    ...actual,
    artistsApi: {
      getSyncStatus: vi.fn(),
      sync: vi.fn(),
    },
  };
});

const mockedArtistsApi = vi.mocked(artistsApi);

const baseStatus: ArtistSyncStatus = {
  has_active_sync: false,
  current_session: null,
  rate_limited: false,
  rate_limit_resume_at: null,
  artists_total: 10,
  artists_synced: 4,
};

function renderPanel() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(
    <ArtistMetadataPanel enabled onMessage={vi.fn()} />,
    { wrapper }
  );
}

describe("ArtistMetadataPanel", () => {
  afterEach(() => vi.clearAllMocks());

  it("renders nothing when the user has no artists yet", async () => {
    mockedArtistsApi.getSyncStatus.mockResolvedValue({
      ...baseStatus,
      artists_total: 0,
      artists_synced: 0,
    });

    const { container } = renderPanel();

    // Give the status query a chance to resolve, then confirm still empty.
    await waitFor(() =>
      expect(mockedArtistsApi.getSyncStatus).toHaveBeenCalled()
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows progress and enables Sync Genres when artists still need genres", async () => {
    mockedArtistsApi.getSyncStatus.mockResolvedValue(baseStatus);

    renderPanel();

    expect(await screen.findByText("4 / 10")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sync Genres" })
    ).toBeEnabled();
    expect(
      screen.queryByText("All artists have genre metadata!")
    ).not.toBeInTheDocument();
  });

  it("disables Sync Genres and confirms completion once every artist is synced", async () => {
    mockedArtistsApi.getSyncStatus.mockResolvedValue({
      ...baseStatus,
      artists_synced: 10,
    });

    renderPanel();

    expect(
      await screen.findByText("All artists have genre metadata!")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sync Genres" })
    ).toBeDisabled();
  });
});
