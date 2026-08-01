import { describe, it, expect, vi, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { albumsApi } from "@/api/client";
import { renderWithProviders } from "@/test/utils";
import { AlbumDetailPage } from "./AlbumDetailPage";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return { ...actual, albumsApi: { list: vi.fn(), get: vi.fn() } };
});

const mockedAlbumsApi = vi.mocked(albumsApi);

function renderAt(route: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/albums/:id" element={<AlbumDetailPage />} />
    </Routes>,
    { route, withQuery: true }
  );
}

describe("AlbumDetailPage", () => {
  afterEach(() => vi.clearAllMocks());

  it("reports not found for a non-numeric id instead of loading forever", () => {
    renderAt("/albums/not-an-id");

    expect(screen.getByText("Album not found")).toBeInTheDocument();
    expect(mockedAlbumsApi.get).not.toHaveBeenCalled();
  });

  it("fetches the album for a numeric id", () => {
    mockedAlbumsApi.get.mockResolvedValue(new Promise(() => {}) as never);
    renderAt("/albums/7");

    expect(screen.queryByText("Album not found")).not.toBeInTheDocument();
    expect(mockedAlbumsApi.get).toHaveBeenCalledWith(7);
  });
});
