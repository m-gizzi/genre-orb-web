import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Routes, Route } from "react-router-dom";
import type { Playlist, RuleGroup, SmartPlaylistDetail } from "@/api/client";
import { smartPlaylistsApi, genresApi, artistsApi, albumsApi } from "@/api/client";
import { renderWithProviders } from "@/test/utils";
import { ruleSchema } from "@/test/ruleSchema";
import { SmartPlaylistEditPage } from "./SmartPlaylistEditPage";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return {
    ...actual,
    smartPlaylistsApi: { get: vi.fn(), update: vi.fn(), schema: vi.fn() },
    genresApi: { list: vi.fn() },
    artistsApi: { list: vi.fn() },
    albumsApi: { list: vi.fn() },
  };
});

const mockedApi = vi.mocked(smartPlaylistsApi);
const emptyPage = { data: [], meta: { page: 1, per_page: 8, total: 0, total_pages: 0 } };

function detail(rules: RuleGroup): SmartPlaylistDetail {
  return {
    id: 7,
    name: "Metal Mix",
    is_enabled: false,
    is_ready: rules.rules.length > 0,
    rules,
    match_count: 0,
    source_count: 1,
    last_evaluated_at: null,
    last_pushed_at: null,
    target_playlist: { id: 3, name: "Metal Mix" } as Playlist,
    source_playlists: [],
  } as SmartPlaylistDetail;
}

function renderEditor(rules: RuleGroup) {
  mockedApi.get.mockResolvedValue(detail(rules));
  mockedApi.schema.mockResolvedValue(ruleSchema);

  return renderWithProviders(
    <Routes>
      <Route path="/smart-playlists/:id/edit" element={<SmartPlaylistEditPage />} />
      <Route path="/smart-playlists/:id" element={<p>Detail page</p>} />
    </Routes>,
    { route: "/smart-playlists/7/edit", withQuery: true },
  );
}

const complete: RuleGroup = {
  match: "all",
  rules: [{ field: "genre", operator: "equals", value: "metal" }],
};

beforeEach(() => {
  vi.mocked(genresApi).list.mockResolvedValue(emptyPage);
  vi.mocked(artistsApi).list.mockResolvedValue(emptyPage);
  vi.mocked(albumsApi).list.mockResolvedValue(emptyPage);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("SmartPlaylistEditPage", () => {
  it("reports not found for a non-numeric id instead of loading forever", () => {
    renderWithProviders(
      <Routes>
        <Route path="/smart-playlists/:id/edit" element={<SmartPlaylistEditPage />} />
      </Routes>,
      { route: "/smart-playlists/nope/edit", withQuery: true },
    );

    expect(screen.getByText("Smart playlist not found")).toBeInTheDocument();
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it("cannot save until something has changed", async () => {
    renderEditor(complete);

    expect(await screen.findByRole("button", { name: /Save rules/ })).toBeDisabled();
  });

  it("refuses to save while a rule is missing its value", async () => {
    renderEditor({ match: "all", rules: [] });

    await userEvent.click(await screen.findByRole("button", { name: /Condition/ }));

    expect(screen.getByText(/1 rule needs a value/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save rules/ })).toBeDisabled();
  });

  it("saves a finished rule set and returns to the detail page", async () => {
    mockedApi.update.mockResolvedValue(detail(complete));
    renderEditor({ match: "all", rules: [] });

    await userEvent.click(await screen.findByRole("button", { name: /Condition/ }));
    await userEvent.type(
      screen.getByRole("combobox", { name: "Genre value" }),
      "metal{Enter}",
    );
    await userEvent.click(screen.getByRole("button", { name: /Save rules/ }));

    await waitFor(() =>
      expect(mockedApi.update).toHaveBeenCalledWith(7, { rules: complete }),
    );
    expect(await screen.findByText("Detail page")).toBeInTheDocument();
  });

  it("counts the rules it is about to save", async () => {
    renderEditor(complete);

    expect(await screen.findByText(/^1 rule$/)).toBeInTheDocument();
  });

  it("leaves without confirming when nothing has changed", async () => {
    const confirm = vi.fn(() => true);
    vi.stubGlobal("confirm", confirm);
    renderEditor(complete);

    await userEvent.click(await screen.findByRole("button", { name: "Cancel" }));

    expect(confirm).not.toHaveBeenCalled();
    expect(await screen.findByText("Detail page")).toBeInTheDocument();
  });

  it("asks before discarding unsaved changes", async () => {
    const confirm = vi.fn(() => false);
    vi.stubGlobal("confirm", confirm);
    renderEditor(complete);

    await userEvent.click(await screen.findByRole("button", { name: /Condition/ }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(confirm).toHaveBeenCalled();
    expect(screen.queryByText("Detail page")).not.toBeInTheDocument();
  });

  it("surfaces a rejected save without leaving the editor", async () => {
    mockedApi.update.mockRejectedValue(new Error("Rules are invalid."));
    renderEditor({ match: "all", rules: [] });

    await userEvent.click(await screen.findByRole("button", { name: /Condition/ }));
    await userEvent.type(
      screen.getByRole("combobox", { name: "Genre value" }),
      "metal{Enter}",
    );
    await userEvent.click(screen.getByRole("button", { name: /Save rules/ }));

    expect(await screen.findByText("Rules are invalid.")).toBeInTheDocument();
    expect(screen.queryByText("Detail page")).not.toBeInTheDocument();
  });
});
