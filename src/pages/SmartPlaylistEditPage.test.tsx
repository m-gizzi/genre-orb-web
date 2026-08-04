import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Playlist, RuleGroup, SmartPlaylistDetail } from "@/api/client";
import {
  smartPlaylistsApi,
  genresApi,
  artistsApi,
  albumsApi,
  withApiErrorMessages,
} from "@/api/client";
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

  return renderWithProviders(<SmartPlaylistEditPage />, {
    route: "/smart-playlists/7/edit",
    routePath: "/smart-playlists/:id/edit",
    extraRoutes: [
      { path: "/smart-playlists/:id", element: <p>Detail page</p> },
      { path: "/tracks", element: <p>Tracks page</p> },
    ],
    withDataRouter: true,
    withQuery: true,
  });
}

const complete: RuleGroup = {
  match: "all",
  rules: [{ field: "genre", operator: "equals", value: "metal" }],
};

async function addGenreRule(value = "metal") {
  await userEvent.click(await screen.findByRole("button", { name: /Condition/ }));
  await userEvent.type(
    screen.getByRole("combobox", { name: "Genre value" }),
    `${value}{Enter}`,
  );
}

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
    renderWithProviders(<SmartPlaylistEditPage />, {
      route: "/smart-playlists/nope/edit",
      routePath: "/smart-playlists/:id/edit",
      withDataRouter: true,
      withQuery: true,
    });

    expect(screen.getByText("Smart playlist not found")).toBeInTheDocument();
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it("cannot save until something has changed", async () => {
    renderEditor(complete);

    expect(await screen.findByRole("button", { name: /Save rules/ })).toBeDisabled();
  });

  it("does not think a saved rule set is dirty just from key ordering", async () => {
    renderEditor({
      rules: [{ value: "metal", field: "genre", operator: "equals" }],
      match: "all",
    } as RuleGroup);

    await screen.findByRole("button", { name: /Save rules/ });
    expect(screen.queryByText(/unsaved changes/)).not.toBeInTheDocument();
  });

  it("refuses to save while a rule is missing its value", async () => {
    renderEditor({ match: "all", rules: [] });

    await userEvent.click(await screen.findByRole("button", { name: /Condition/ }));

    expect(screen.getByText(/1 rule needs finishing/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save rules/ })).toBeDisabled();
  });

  it("refuses to save a rule set that arrived nested past the limit", async () => {
    let rules: RuleGroup = { match: "all", rules: [complete.rules[0]!] };
    for (let level = 0; level <= ruleSchema.max_depth; level += 1) {
      rules = { match: "all", rules: [rules] };
    }
    renderEditor(rules);

    expect(
      await screen.findByText(
        new RegExp(`nest ${ruleSchema.max_depth} levels deep`),
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save rules/ })).toBeDisabled();
  });

  it("refuses to save a rule set that arrived over the rule cap", async () => {
    const rules = Array.from(
      { length: ruleSchema.max_nodes },
      () => complete.rules[0]!,
    );
    renderEditor({ match: "all", rules });

    expect(
      await screen.findByText(
        new RegExp(`at most ${ruleSchema.max_nodes} rules`),
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save rules/ })).toBeDisabled();
  });

  it("refuses to save while a nested group is empty", async () => {
    renderEditor(complete);

    await userEvent.click(await screen.findByRole("button", { name: /Group/ }));

    expect(screen.getByText(/1 rule needs finishing/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save rules/ })).toBeDisabled();
  });

  it("saves a finished rule set and returns to the detail page", async () => {
    mockedApi.update.mockResolvedValue(detail(complete));
    renderEditor({ match: "all", rules: [] });

    await addGenreRule();
    await userEvent.click(screen.getByRole("button", { name: /Save rules/ }));

    await waitFor(() =>
      expect(mockedApi.update).toHaveBeenCalledWith(7, { rules: complete }),
    );
    expect(await screen.findByText("Detail page")).toBeInTheDocument();
  });

  it("sends no client-only identity to the server", async () => {
    mockedApi.update.mockResolvedValue(detail(complete));
    renderEditor({ match: "all", rules: [] });

    await addGenreRule();
    await userEvent.click(screen.getByRole("button", { name: /Save rules/ }));

    await waitFor(() => expect(mockedApi.update).toHaveBeenCalled());
    expect(JSON.stringify(mockedApi.update.mock.calls[0])).not.toContain("uid");
  });

  it("counts the rules it is about to save", async () => {
    renderEditor(complete);

    expect(await screen.findByText(/^1 rule$/)).toBeInTheDocument();
  });

  it("leaves without asking when nothing has changed", async () => {
    renderEditor(complete);

    await userEvent.click(await screen.findByRole("button", { name: "Cancel" }));

    expect(await screen.findByText("Detail page")).toBeInTheDocument();
  });

  describe("with unsaved changes", () => {
    it("blocks leaving and offers to keep editing", async () => {
      renderEditor(complete);

      await addGenreRule("jazz");
      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

      expect(
        await screen.findByText("Discard your unsaved rule changes?"),
      ).toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "Keep editing" }));

      expect(screen.queryByText("Detail page")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Save rules/ })).toBeInTheDocument();
    });

    it("leaves once the changes are explicitly discarded", async () => {
      renderEditor(complete);

      await addGenreRule("jazz");
      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
      await userEvent.click(
        await screen.findByRole("button", { name: "Discard changes" }),
      );

      expect(await screen.findByText("Detail page")).toBeInTheDocument();
    });
  });

  it("surfaces a rejected save without leaving the editor", async () => {
    mockedApi.update.mockRejectedValue(new Error("Rules are invalid."));
    renderEditor({ match: "all", rules: [] });

    await addGenreRule();
    await userEvent.click(screen.getByRole("button", { name: /Save rules/ }));

    expect(await screen.findByText("Rules are invalid.")).toBeInTheDocument();
    expect(screen.queryByText("Detail page")).not.toBeInTheDocument();
  });

  it("shows every rule the server rejected, not just the first", async () => {
    const error = withApiErrorMessages(
      new Error("Rules must be a whole number at rule 1"),
      [
        "Rules must be a whole number at rule 1",
        "Rules must be between 0 and 100 at rule 2",
      ],
    );
    mockedApi.update.mockRejectedValue(error);
    renderEditor({ match: "all", rules: [] });

    await addGenreRule();
    await userEvent.click(screen.getByRole("button", { name: /Save rules/ }));

    expect(
      await screen.findByText("Rules must be a whole number at rule 1"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Rules must be between 0 and 100 at rule 2"),
    ).toBeInTheDocument();
  });
});
