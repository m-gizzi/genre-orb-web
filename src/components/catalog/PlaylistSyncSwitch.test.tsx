import { describe, it, expect, vi, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { playlistsApi, type Playlist } from "@/api/client";
import { renderWithProviders } from "@/test/utils";
import { PlaylistSyncSwitch } from "./PlaylistSyncSwitch";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return { ...actual, playlistsApi: { update: vi.fn() } };
});

const mockedApi = vi.mocked(playlistsApi);

afterEach(() => vi.clearAllMocks());

describe("PlaylistSyncSwitch", () => {
  it("toggles sync for a regular playlist", async () => {
    mockedApi.update.mockResolvedValue({ id: 1 } as Playlist);
    renderWithProviders(
      <PlaylistSyncSwitch playlistId={1} name="Metal Mix" syncEnabled={false} />,
      { withQuery: true },
    );

    await userEvent.click(screen.getByRole("switch", { name: "Sync Metal Mix" }));

    expect(mockedApi.update).toHaveBeenCalledWith(1, { sync_enabled: true });
  });

  it("is disabled and explained for a rule-managed playlist", async () => {
    renderWithProviders(
      <PlaylistSyncSwitch playlistId={1} name="Metal Mix" syncEnabled locked />,
      { withQuery: true },
    );

    const control = screen.getByRole("switch", { name: "Sync Metal Mix" });
    expect(control).toHaveAttribute("aria-disabled", "true");
    expect(control.closest("[title]")).toHaveAttribute(
      "title",
      expect.stringContaining("Smart playlists stay synced"),
    );

    await userEvent.click(control);
    expect(mockedApi.update).not.toHaveBeenCalled();
  });

  it("keeps the locked switch reachable and its reason announced", async () => {
    renderWithProviders(
      <PlaylistSyncSwitch playlistId={1} name="Metal Mix" syncEnabled locked />,
      { withQuery: true },
    );

    const control = screen.getByRole("switch", { name: "Sync Metal Mix" });

    expect(control).not.toBeDisabled();
    await userEvent.tab();
    expect(control).toHaveFocus();

    const hintId = control.getAttribute("aria-describedby");
    expect(hintId).toBeTruthy();
    expect(document.getElementById(hintId!)).toHaveTextContent(
      "Smart playlists stay synced so Genre Orb can see what Spotify holds.",
    );
  });
});
