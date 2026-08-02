import { describe, it, expect, vi, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ApiCollection, Playlist, SmartPlaylistDetail } from "@/api/client";
import { playlistsApi, smartPlaylistsApi } from "@/api/client";
import { renderWithProviders } from "@/test/utils";
import { NewSmartPlaylistDialog } from "./NewSmartPlaylistDialog";

const navigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigate };
});

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

const source = { id: 9, name: "Road Trip", track_count: 5, is_liked_songs: false } as Playlist;

const page: ApiCollection<Playlist> = {
  data: [source],
  meta: { page: 1, per_page: 30, total: 1, total_pages: 1 },
};

function renderDialog() {
  mockedPlaylistsApi.paginated.mockResolvedValue(page);
  mockedPlaylistsApi.liked.mockResolvedValue(null as unknown as Playlist);

  return renderWithProviders(
    <NewSmartPlaylistDialog open onOpenChange={vi.fn()} />,
    { withQuery: true },
  );
}

function createButton() {
  return screen.getByRole("button", { name: "Create on Spotify" });
}

afterEach(() => vi.clearAllMocks());

describe("NewSmartPlaylistDialog", () => {
  it("says up front that this creates a real Spotify playlist", async () => {
    renderDialog();

    expect(
      await screen.findByText(/creates a real playlist on Spotify/),
    ).toBeInTheDocument();
  });

  it("will not create without a name", async () => {
    renderDialog();

    await userEvent.click(await screen.findByRole("checkbox", { name: /Road Trip/ }));

    expect(createButton()).toBeDisabled();
  });

  it("will not create without a source", async () => {
    renderDialog();

    await userEvent.type(await screen.findByLabelText("Name"), "Doom Only");

    expect(createButton()).toBeDisabled();
  });

  it("creates the playlist and its rule set together, then opens it", async () => {
    mockedSmartApi.create.mockResolvedValue({ id: 7 } as SmartPlaylistDetail);
    renderDialog();

    await userEvent.type(await screen.findByLabelText("Name"), "Doom Only");
    await userEvent.type(screen.getByLabelText("Description"), "Heavy");
    await userEvent.click(screen.getByRole("checkbox", { name: /Road Trip/ }));
    await userEvent.click(createButton());

    expect(mockedSmartApi.create).toHaveBeenCalledWith({
      target_playlist_attributes: { name: "Doom Only", description: "Heavy" },
      source_playlist_ids: [9],
    });
    expect(navigate).toHaveBeenCalledWith("/smart-playlists/7");
  });

  it("omits an empty description", async () => {
    mockedSmartApi.create.mockResolvedValue({ id: 7 } as SmartPlaylistDetail);
    renderDialog();

    await userEvent.type(await screen.findByLabelText("Name"), "Doom Only");
    await userEvent.click(screen.getByRole("checkbox", { name: /Road Trip/ }));
    await userEvent.click(createButton());

    expect(mockedSmartApi.create).toHaveBeenCalledWith({
      target_playlist_attributes: { name: "Doom Only", description: undefined },
      source_playlist_ids: [9],
    });
  });

  it("surfaces the API error and does not navigate", async () => {
    mockedSmartApi.create.mockRejectedValue(new Error("Spotify not connected"));
    renderDialog();

    await userEvent.type(await screen.findByLabelText("Name"), "Doom Only");
    await userEvent.click(screen.getByRole("checkbox", { name: /Road Trip/ }));
    await userEvent.click(createButton());

    expect(await screen.findByText("Spotify not connected")).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });
});
