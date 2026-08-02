import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { ApiCollection, Playlist } from "@/api/client";
import { useInfinitePlaylists, useLikedPlaylist } from "@/hooks/usePlaylists";
import { SourcePlaylistPicker } from "./SourcePlaylistPicker";

vi.mock("@/hooks/usePlaylists", () => ({
  useInfinitePlaylists: vi.fn(),
  useLikedPlaylist: vi.fn(),
}));

const mockedUseInfinitePlaylists = vi.mocked(useInfinitePlaylists);
const mockedUseLikedPlaylist = vi.mocked(useLikedPlaylist);

type InfiniteResult = ReturnType<typeof useInfinitePlaylists>;

function playlist(id: number, name: string, overrides: Partial<Playlist> = {}) {
  return { id, name, track_count: 10, is_liked_songs: false, ...overrides } as Playlist;
}

function pageOf(playlists: Playlist[]): ApiCollection<Playlist> {
  return {
    data: playlists,
    meta: { page: 1, per_page: 30, total: playlists.length, total_pages: 1 },
  };
}

function mockPicker({
  pages = [[]] as Playlist[][],
  liked = null as Playlist | null,
  hasNextPage = false,
  fetchNextPage = vi.fn(),
  isFetchingNextPage = false,
} = {}) {
  mockedUseInfinitePlaylists.mockReturnValue({
    data: { pages: pages.map(pageOf), pageParams: [] },
    isLoading: false,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } as unknown as InfiniteResult);
  mockedUseLikedPlaylist.mockReturnValue({
    data: liked,
  } as ReturnType<typeof useLikedPlaylist>);
  return fetchNextPage;
}

function scroller() {
  return screen.getByTestId("source-playlist-scroller");
}

function scrollToBottom(element: HTMLElement) {
  Object.defineProperty(element, "scrollHeight", { value: 1000, configurable: true });
  Object.defineProperty(element, "clientHeight", { value: 200, configurable: true });
  Object.defineProperty(element, "scrollTop", { value: 800, configurable: true });
  fireEvent.scroll(element);
}

afterEach(() => vi.clearAllMocks());

describe("SourcePlaylistPicker", () => {
  it("renders every playlist across all loaded pages", () => {
    mockPicker({
      pages: [
        Array.from({ length: 30 }, (_, i) => playlist(i + 1, `Playlist ${i + 1}`)),
        Array.from({ length: 30 }, (_, i) => playlist(i + 31, `Playlist ${i + 31}`)),
      ],
    });

    render(<SourcePlaylistPicker selectedIds={[]} onChange={vi.fn()} />);

    expect(screen.getAllByRole("checkbox")).toHaveLength(60);
    expect(screen.getByText("Playlist 60")).toBeInTheDocument();
  });

  it("loads the next page when the list is scrolled to the bottom", () => {
    const fetchNextPage = mockPicker({
      pages: [[playlist(1, "Metal Mix")]],
      hasNextPage: true,
    });

    render(<SourcePlaylistPicker selectedIds={[]} onChange={vi.fn()} />);
    scrollToBottom(scroller());

    expect(fetchNextPage).toHaveBeenCalled();
  });

  it("does not request more pages when none remain", () => {
    const fetchNextPage = mockPicker({
      pages: [[playlist(1, "Metal Mix")]],
      hasNextPage: false,
    });

    render(<SourcePlaylistPicker selectedIds={[]} onChange={vi.fn()} />);
    scrollToBottom(scroller());

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it("does not stack requests while a page is already loading", () => {
    const fetchNextPage = mockPicker({
      pages: [[playlist(1, "Metal Mix")]],
      hasNextPage: true,
      isFetchingNextPage: true,
    });

    render(<SourcePlaylistPicker selectedIds={[]} onChange={vi.fn()} />);
    scrollToBottom(scroller());

    expect(fetchNextPage).not.toHaveBeenCalled();
    expect(screen.getByText("Loading more…")).toBeInTheDocument();
  });

  it("sends the search term to the server after debouncing", async () => {
    mockPicker({ pages: [[playlist(1, "Metal Mix")]] });

    render(<SourcePlaylistPicker selectedIds={[]} onChange={vi.fn()} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "metal" } });

    await waitFor(() =>
      expect(mockedUseInfinitePlaylists).toHaveBeenCalledWith("metal"),
    );
  });

  it("keeps selected playlists visible when a search excludes them", async () => {
    mockPicker({ pages: [[playlist(1, "Metal Mix"), playlist(2, "Road Trip")]] });

    const { rerender } = render(
      <SourcePlaylistPicker selectedIds={[1]} onChange={vi.fn()} />,
    );
    expect(screen.getByText("Selected (1)")).toBeInTheDocument();

    mockPicker({ pages: [[playlist(2, "Road Trip")]] });
    rerender(<SourcePlaylistPicker selectedIds={[1]} onChange={vi.fn()} />);

    expect(screen.getByText("Selected (1)")).toBeInTheDocument();
    expect(screen.getByText("Metal Mix")).toBeInTheDocument();
  });

  it("shows already-saved sources before any page has loaded", () => {
    mockPicker({ pages: [[]] });

    render(
      <SourcePlaylistPicker
        selectedIds={[7]}
        onChange={vi.fn()}
        initialSelected={[
          { id: 7, name: "Saved Source", spotify_id: "s7", is_liked_songs: false },
        ]}
      />,
    );

    expect(screen.getByText("Saved Source")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Saved Source/ })).toBeChecked();
  });

  it("lists Liked Songs first and hides it when it does not match the search", async () => {
    mockPicker({
      pages: [[playlist(2, "Road Trip")]],
      liked: playlist(9, "Liked Songs", { is_liked_songs: true }),
    });

    render(<SourcePlaylistPicker selectedIds={[]} onChange={vi.fn()} />);
    expect(screen.getAllByRole("checkbox")[0]?.closest("label")?.textContent).toContain(
      "Liked Songs",
    );

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "road" } });
    await waitFor(() =>
      expect(screen.queryByText("Liked Songs")).not.toBeInTheDocument(),
    );
  });

  it("excludes the target playlist from the options", () => {
    mockPicker({ pages: [[playlist(1, "Metal Mix"), playlist(2, "Road Trip")]] });

    render(
      <SourcePlaylistPicker selectedIds={[]} onChange={vi.fn()} excludePlaylistId={1} />,
    );

    expect(screen.queryByText("Metal Mix")).not.toBeInTheDocument();
    expect(screen.getByText("Road Trip")).toBeInTheDocument();
  });

  it("adds and removes ids as boxes are toggled", () => {
    mockPicker({ pages: [[playlist(1, "Metal Mix"), playlist(2, "Road Trip")]] });
    const onChange = vi.fn();

    const { rerender } = render(
      <SourcePlaylistPicker selectedIds={[]} onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: /Metal Mix/ }));
    expect(onChange).toHaveBeenCalledWith([1]);

    rerender(<SourcePlaylistPicker selectedIds={[1, 2]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("checkbox", { name: /Metal Mix/ }));
    expect(onChange).toHaveBeenCalledWith([2]);
  });

  it("explains itself when the user has no playlists to filter from", () => {
    mockPicker({ pages: [[]] });

    render(<SourcePlaylistPicker selectedIds={[]} onChange={vi.fn()} />);

    expect(screen.getByText(/No playlists available/i)).toBeInTheDocument();
  });

  it("distinguishes an empty search result from an empty library", async () => {
    mockPicker({ pages: [[]] });

    render(<SourcePlaylistPicker selectedIds={[]} onChange={vi.fn()} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzz" } });

    await waitFor(() =>
      expect(screen.getByText("No playlists match your search.")).toBeInTheDocument(),
    );
  });
});
