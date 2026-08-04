import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Routes, Route } from "react-router-dom";
import type {
  ApiCollection,
  Playlist,
  RuleGroup,
  RuleMatches,
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
    smartPlaylistsApi: {
      get: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      schema: vi.fn(),
      evaluate: vi.fn(),
    },
    playlistsApi: { paginated: vi.fn(), liked: vi.fn() },
  };
});

const mockedSmartApi = vi.mocked(smartPlaylistsApi);
const mockedPlaylistsApi = vi.mocked(playlistsApi);

const withRule: RuleGroup = {
  match: "all",
  rules: [{ field: "genre", operator: "equals", value: "metal" }],
};

function withMatches(overrides: Partial<RuleMatches["meta"]> = {}): RuleMatches {
  return { ...noMatches, meta: { ...noMatches.meta, ...overrides } };
}

const noMatches: RuleMatches = {
  data: [],
  meta: {
    page: 1,
    per_page: 25,
    total: 0,
    total_pages: 0,
    source_track_count: 0,
    evaluated_at: null,
  },
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

beforeEach(() => {
  mockedSmartApi.evaluate.mockResolvedValue(noMatches);
});

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

  it("opens the delete dialog and states the playlist survives", async () => {
    renderDetail(detail());

    await userEvent.click(await screen.findByRole("button", { name: /Delete/ }));

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByText(/is kept, both in Genre Orb and on Spotify/),
    ).toBeInTheDocument();
  });

  describe("evaluating", () => {
    it("counts a visit as an evaluation, without a second request" , async () => {
      mockedSmartApi.evaluate.mockResolvedValue(
        withMatches({ total: 12, source_track_count: 40, evaluated_at: "2026-08-04T10:00:00Z" }),
      );

      renderDetail(detail({ is_ready: true, rules: withRule }));

      expect(await screen.findByText(/12 matching tracks/, { selector: "p" })).toBeInTheDocument();
      expect(mockedSmartApi.evaluate).toHaveBeenCalledTimes(1);
    });

    it("stops the header saying 'never' once the visit has been recorded", async () => {
      mockedSmartApi.evaluate.mockResolvedValue(
        withMatches({ total: 12, source_track_count: 40, evaluated_at: "2026-08-04T10:00:00Z" }),
      );

      renderDetail(detail({ is_ready: true, rules: withRule, last_evaluated_at: null }));

      expect(await screen.findByText(/last evaluated Aug 4, 2026/)).toBeInTheDocument();
      expect(screen.queryByText(/last evaluated never/)).not.toBeInTheDocument();
    });

    it("leaves the header alone when the run was not recorded", async () => {
      mockedSmartApi.evaluate.mockResolvedValue(withMatches({ total: 2, evaluated_at: null }));

      renderDetail(detail({ is_ready: true, rules: withRule, last_evaluated_at: null }));

      expect(await screen.findByText(/last evaluated never/)).toBeInTheDocument();
    });

    it("re-evaluates by re-running the same request", async () => {
      mockedSmartApi.evaluate.mockResolvedValue(withMatches({ total: 3 }));
      renderDetail(detail({ is_ready: true, rules: withRule }));
      await screen.findByText(/3 matching tracks/, { selector: "p" });

      await userEvent.click(screen.getByRole("button", { name: /Re-evaluate/ }));

      await waitFor(() => expect(mockedSmartApi.evaluate).toHaveBeenCalledTimes(2));
    });

    it("surfaces an evaluation failure" , async () => {
      mockedSmartApi.evaluate.mockRejectedValue(
        new Error("These rules took too long to evaluate."),
      );

      renderDetail(detail({ is_ready: true, rules: withRule }));

      expect(
        await screen.findByText("These rules took too long to evaluate."),
      ).toBeInTheDocument();
    });

    it("cannot be re-evaluated while it is still a draft", async () => {
      renderDetail(detail({ is_ready: false }));

      expect(await screen.findByRole("button", { name: /Re-evaluate/ })).toBeDisabled();
    });
  });

  describe("the matching tracks card", () => {
    it("lists what the saved rules currently match", async () => {
      mockedSmartApi.evaluate.mockResolvedValue({
        data: [
          {
            id: 1,
            title: "Flying Whales",
            spotify_id: "t1",
            duration_ms: 460_000,
            track_number: 4,
            explicit: false,
            popularity: 60,
            preview_url: null,
            album: null,
            artists: [],
            genres: [],
          },
        ],
        meta: {
          page: 1,
          per_page: 25,
          total: 1,
          total_pages: 1,
          source_track_count: 9,
          evaluated_at: "2026-08-04T10:00:00Z",
        },
      });

      renderDetail(detail({ is_ready: true, rules: withRule }));

      expect(await screen.findByText("Flying Whales")).toBeInTheDocument();
      expect(await screen.findByText(/1 of 9 source tracks/)).toBeInTheDocument();
    });

    it("is present but empty while the smart playlist is still a draft", async () => {
      renderDetail(detail({ is_ready: false }));

      expect(await screen.findByText("Matching tracks")).toBeInTheDocument();
      expect(await screen.findByText(/no rules yet, so there is nothing to match/)).toBeInTheDocument();
      expect(mockedSmartApi.evaluate).not.toHaveBeenCalled();
    });

    it("says so when no source playlist has been synced", async () => {
      mockedSmartApi.evaluate.mockResolvedValue(withMatches({ total: 0, source_track_count: 0 }));

      renderDetail(detail({ is_ready: true, rules: withRule }));

      expect(
        await screen.findByText(/None of the source playlists have been synced/),
      ).toBeInTheDocument();
    });

    it("distinguishes narrow rules from an unsynced pool", async () => {
      mockedSmartApi.evaluate.mockResolvedValue(withMatches({ total: 0, source_track_count: 40 }));

      renderDetail(detail({ is_ready: true, rules: withRule }));

      expect(
        await screen.findByText(/No tracks in the source playlists match these rules/),
      ).toBeInTheDocument();
    });

    it("offers a page size selector and re-evaluates at the new size", async () => {
      mockedSmartApi.evaluate.mockResolvedValue(
        withMatches({ total: 60, total_pages: 3, source_track_count: 100 }),
      );
      renderDetail(detail({ is_ready: true, rules: withRule }));
      await screen.findByText(/60 of 100 source tracks/);

      await userEvent.click(screen.getByRole("combobox"));
      await userEvent.click(await screen.findByRole("option", { name: "50" }));

      await waitFor(() =>
        expect(mockedSmartApi.evaluate).toHaveBeenCalledWith(7, {
          rules: undefined,
          page: 1,
          per_page: 50,
        }),
      );
    });
  });
});
