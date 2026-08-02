import { describe, it, expect, vi, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ApiCollection, Playlist, SmartPlaylistDetail } from "@/api/client";
import { playlistsApi, smartPlaylistsApi } from "@/api/client";
import { renderWithProviders } from "@/test/utils";
import { MakeSmartDialog } from "./MakeSmartDialog";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return {
    ...actual,
    smartPlaylistsApi: { create: vi.fn() },
    playlistsApi: { paginated: vi.fn(), liked: vi.fn() },
  };
});

const mockedSmartApi = vi.mocked(smartPlaylistsApi);
const mockedPlaylistsApi = vi.mocked(playlistsApi);

const target = { id: 3, name: "Metal Mix" } as Playlist;
const source = { id: 9, name: "Road Trip", track_count: 5, is_liked_songs: false } as Playlist;

function page(rows: Playlist[]): ApiCollection<Playlist> {
  return {
    data: rows,
    meta: { page: 1, per_page: 30, total: rows.length, total_pages: 1 },
  };
}

function renderDialog(options: Playlist[] = [source]) {
  mockedPlaylistsApi.paginated.mockResolvedValue(page(options));
  mockedPlaylistsApi.liked.mockResolvedValue(null as unknown as Playlist);

  return renderWithProviders(
    <MakeSmartDialog playlist={target} open onOpenChange={vi.fn()} />,
    { withQuery: true },
  );
}

afterEach(() => vi.clearAllMocks());

describe("MakeSmartDialog", () => {
  it("warns that the playlist contents will be replaced", async () => {
    renderDialog();

    expect(
      await screen.findByText(/its contents on Spotify are replaced by the rule results/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Syncing will be turned on and locked/)).toBeInTheDocument();
  });

  it("will not create until a source is picked", async () => {
    renderDialog();
    await screen.findByText("Road Trip");

    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
  });

  it("converts the playlist with the picked sources", async () => {
    mockedSmartApi.create.mockResolvedValue({ id: 7 } as SmartPlaylistDetail);
    renderDialog();

    await userEvent.click(await screen.findByRole("checkbox", { name: /Road Trip/ }));
    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(mockedSmartApi.create).toHaveBeenCalledWith({
      target_playlist_id: 3,
      source_playlist_ids: [9],
    });
  });

  it("never offers the target playlist as its own source", async () => {
    renderDialog([target, source]);

    await screen.findByText("Road Trip");
    expect(screen.queryByRole("checkbox", { name: /Metal Mix/ })).not.toBeInTheDocument();
  });

  it("surfaces the API error", async () => {
    mockedSmartApi.create.mockRejectedValue(new Error("Spotify is unavailable."));
    renderDialog();

    await userEvent.click(await screen.findByRole("checkbox", { name: /Road Trip/ }));
    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Spotify is unavailable.")).toBeInTheDocument();
  });
});
