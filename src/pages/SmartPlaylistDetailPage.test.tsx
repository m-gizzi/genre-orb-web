import { describe, it, expect, vi, afterEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Routes, Route } from "react-router-dom";
import type {
  ApiCollection,
  Playlist,
  RuleGroup,
  SmartPlaylistDetail,
} from "@/api/client";
import { playlistsApi, smartPlaylistsApi } from "@/api/client";
import { renderWithProviders } from "@/test/utils";
import { ruleSchema } from "@/test/ruleSchema";
import { SmartPlaylistDetailPage } from "./SmartPlaylistDetailPage";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return {
    ...actual,
    smartPlaylistsApi: { get: vi.fn(), update: vi.fn(), remove: vi.fn(), schema: vi.fn() },
    playlistsApi: { paginated: vi.fn(), liked: vi.fn() },
  };
});

const mockedSmartApi = vi.mocked(smartPlaylistsApi);
const mockedPlaylistsApi = vi.mocked(playlistsApi);

const withRule: RuleGroup = {
  match: "all",
  rules: [{ field: "genre", operator: "equals", value: "metal" }],
};

const noPlaylists: ApiCollection<Playlist> = {
  data: [],
  meta: { page: 1, per_page: 30, total: 0, total_pages: 0 },
};

function detail(overrides: Partial<SmartPlaylistDetail> = {}): SmartPlaylistDetail {
  return {
    id: 7,
    name: "Metal Mix",
    is_enabled: false,
    is_ready: false,
    rules: { match: "all", rules: [] },
    match_count: 0,
    source_count: 1,
    last_evaluated_at: null,
    last_pushed_at: null,
    target_playlist: { id: 3, name: "Metal Mix" } as Playlist,
    source_playlists: [
      { id: 4, name: "Road Trip", spotify_id: "s4", is_liked_songs: false },
    ],
    ...overrides,
  } as SmartPlaylistDetail;
}

function renderDetail(
  smartPlaylist: SmartPlaylistDetail,
  { route = "/smart-playlists/7", options = [] as Playlist[] } = {},
) {
  mockedSmartApi.get.mockResolvedValue(smartPlaylist);
  mockedSmartApi.schema.mockResolvedValue(ruleSchema);
  mockedPlaylistsApi.paginated.mockResolvedValue({
    ...noPlaylists,
    data: options,
    meta: { ...noPlaylists.meta, total: options.length, total_pages: 1 },
  });
  mockedPlaylistsApi.liked.mockResolvedValue(null as unknown as Playlist);

  return renderWithProviders(
    <Routes>
      <Route path="/smart-playlists/:id" element={<SmartPlaylistDetailPage />} />
    </Routes>,
    { route, withQuery: true },
  );
}

afterEach(() => vi.clearAllMocks());

describe("SmartPlaylistDetailPage", () => {
  it("reports not found for a non-numeric id instead of loading forever", () => {
    renderDetail(detail(), { route: "/smart-playlists/not-an-id" });

    expect(screen.getByText("Smart playlist not found")).toBeInTheDocument();
    expect(mockedSmartApi.get).not.toHaveBeenCalled();
  });

  it("explains why an empty rule set cannot be enabled", async () => {
    renderDetail(detail());

    expect(
      await screen.findByText("Not ready — add rules before enabling"),
    ).toBeInTheDocument();
    const control = screen.getByRole("switch", { name: "Enable Metal Mix" });
    expect(control).toHaveAttribute("aria-disabled", "true");
    expect(control.closest("[title]")).toHaveAttribute(
      "title",
      "Add at least one rule before turning this on.",
    );

    expect(control).not.toBeDisabled();
    const hintId = control.getAttribute("aria-describedby");
    expect(document.getElementById(hintId!)).toHaveTextContent(
      "Add at least one rule before turning this on.",
    );
  });

  it("enables a smart playlist that has rules", async () => {
    mockedSmartApi.update.mockResolvedValue(detail({ is_ready: true, is_enabled: true }));
    renderDetail(detail({ is_ready: true, rules: withRule }));

    await userEvent.click(
      await screen.findByRole("switch", { name: "Enable Metal Mix" }),
    );

    expect(mockedSmartApi.update).toHaveBeenCalledWith(7, { is_enabled: true });
  });

  it("shows the pending state on the switch while the update is in flight", async () => {
    mockedSmartApi.update.mockReturnValue(new Promise(() => {}));
    renderDetail(detail({ is_ready: true, rules: withRule }));

    const control = await screen.findByRole("switch", { name: "Enable Metal Mix" });
    await userEvent.click(control);

    await waitFor(() => expect(control).toBeChecked());
  });

  it("links to the target playlist and each source", async () => {
    renderDetail(detail());

    expect(await screen.findByRole("link", { name: "Metal Mix" })).toHaveAttribute(
      "href",
      "/playlists/3",
    );
    expect(screen.getByRole("link", { name: "Road Trip" })).toHaveAttribute(
      "href",
      "/playlists/4",
    );
  });

  it("saves an edited source list", async () => {
    mockedSmartApi.update.mockResolvedValue(detail());
    renderDetail(detail(), {
      options: [{ id: 9, name: "Doom", track_count: 5, is_liked_songs: false } as Playlist],
    });

    await userEvent.click(await screen.findByRole("button", { name: "Edit" }));
    await userEvent.click(await screen.findByRole("checkbox", { name: /Doom/ }));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(mockedSmartApi.update).toHaveBeenCalledWith(7, {
      source_playlist_ids: [4, 9],
    });
  });

  it("will not save an empty source list", async () => {
    renderDetail(detail());

    await userEvent.click(await screen.findByRole("button", { name: "Edit" }));
    await userEvent.click(await screen.findByRole("checkbox", { name: /Road Trip/ }));

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("surfaces an update failure", async () => {
    mockedSmartApi.update.mockRejectedValue(new Error("Spotify is unavailable."));
    renderDetail(detail({ is_ready: true, rules: withRule }));

    await userEvent.click(
      await screen.findByRole("switch", { name: "Enable Metal Mix" }),
    );

    expect(await screen.findByText("Spotify is unavailable.")).toBeInTheDocument();
  });

  it("renders the saved rules in plain language rather than JSON", async () => {
    renderDetail(detail({ is_ready: true, rules: withRule }));

    expect(await screen.findByText("Match ALL of")).toBeInTheDocument();
    expect(screen.getByText("Genre is “metal”")).toBeInTheDocument();
    expect(document.querySelector("pre")).toBeNull();
  });

  it("links to the rule editor", async () => {
    renderDetail(detail({ is_ready: true, rules: withRule }));

    expect(await screen.findByRole("link", { name: /Edit rules/ })).toHaveAttribute(
      "href",
      "/smart-playlists/7/edit",
    );
  });

  it("sends a draft straight to the builder", async () => {
    renderDetail(detail());

    expect(
      await screen.findByRole("link", { name: /Build the rules/ }),
    ).toHaveAttribute("href", "/smart-playlists/7/edit");
  });

  it("says nothing about match counts before the first evaluation", async () => {
    renderDetail(detail({ is_ready: true, rules: withRule, match_count: 0 }));

    expect(await screen.findByText("Never evaluated yet")).toBeInTheDocument();
  });

  it("reports the match count once evaluated", async () => {
    renderDetail(
      detail({
        is_ready: true,
        rules: withRule,
        match_count: 342,
        last_evaluated_at: "2026-08-01T10:00:00Z",
      }),
    );

    expect(
      await screen.findByText("342 matching tracks at last evaluation"),
    ).toBeInTheDocument();
  });

  it("opens the delete dialog and states the playlist survives", async () => {
    renderDetail(detail());

    await userEvent.click(await screen.findByRole("button", { name: /Delete/ }));

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(/is kept, both in Genre Orb and on Spotify/),
    ).toBeInTheDocument();
  });
});
