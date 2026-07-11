import { describe, it, expect, vi, afterEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { playlistsApi, type Playlist } from "@/api/client";
import { usePlaylists } from "@/hooks/usePlaylists";
import { PlaylistList } from "./PlaylistList";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return {
    ...actual,
    playlistsApi: {
      list: vi.fn(),
      update: vi.fn(),
    },
  };
});

const mockedPlaylistsApi = vi.mocked(playlistsApi);

function makePlaylist(overrides: Partial<Playlist> = {}): Playlist {
  return {
    id: 1,
    name: "Jazz",
    spotify_id: "abc",
    is_liked_songs: false,
    is_public: true,
    track_count: 12,
    sync_enabled: false,
    last_synced_at: null,
    available_on_spotify: true,
    ...overrides,
  };
}

function Harness() {
  const { data } = usePlaylists(true);
  return data ? <PlaylistList playlists={data} /> : null;
}

function renderHarness() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<Harness />, { wrapper });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("PlaylistList", () => {
  afterEach(() => vi.clearAllMocks());

  it("optimistically toggles the switch and calls the API with the negated value", async () => {
    const user = userEvent.setup();
    let server = [makePlaylist({ sync_enabled: false })];
    mockedPlaylistsApi.list.mockImplementation(() => Promise.resolve(server));
    mockedPlaylistsApi.update.mockImplementation((id, data) => {
      const updated = makePlaylist({ id, sync_enabled: data.sync_enabled });
      server = [updated];
      return Promise.resolve(updated);
    });

    renderHarness();

    const toggle = await screen.findByRole("switch");
    expect(toggle).not.toBeChecked();

    await user.click(toggle);

    expect(mockedPlaylistsApi.update).toHaveBeenCalledWith(1, {
      sync_enabled: true,
    });
    await waitFor(() => expect(toggle).toBeChecked());
  });

  it("rolls the switch back when the update fails", async () => {
    const user = userEvent.setup();
    const pending = deferred<Playlist>();
    mockedPlaylistsApi.list.mockResolvedValue([
      makePlaylist({ sync_enabled: false }),
    ]);
    mockedPlaylistsApi.update.mockReturnValue(pending.promise);

    renderHarness();

    const toggle = await screen.findByRole("switch");
    await user.click(toggle);

    await waitFor(() => expect(toggle).toBeChecked());

    pending.reject(new Error("Server said no"));

    await waitFor(() => expect(toggle).not.toBeChecked());
  });
});
