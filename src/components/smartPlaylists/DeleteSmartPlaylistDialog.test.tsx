import { describe, it, expect, vi, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SmartPlaylist } from "@/api/client";
import { smartPlaylistsApi } from "@/api/client";
import { renderWithProviders } from "@/test/utils";
import { DeleteSmartPlaylistDialog } from "./DeleteSmartPlaylistDialog";

const navigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigate };
});

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return { ...actual, smartPlaylistsApi: { remove: vi.fn() } };
});

const mockedApi = vi.mocked(smartPlaylistsApi);

const smartPlaylist = { id: 7, name: "Metal Mix" } as SmartPlaylist;

function renderDialog(onOpenChange = vi.fn()) {
  renderWithProviders(
    <DeleteSmartPlaylistDialog
      smartPlaylist={smartPlaylist}
      open
      onOpenChange={onOpenChange}
    />,
    { withQuery: true },
  );
  return onOpenChange;
}

afterEach(() => vi.clearAllMocks());

describe("DeleteSmartPlaylistDialog", () => {
  it("states plainly that only the rules go away", () => {
    renderDialog();

    expect(screen.getByText(/The rules and source list are removed/)).toBeInTheDocument();
    expect(
      screen.getByText(/is kept, both in Genre Orb and on Spotify/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete rules" })).toBeInTheDocument();
  });

  it("deletes the rule set and returns to the list", async () => {
    mockedApi.remove.mockResolvedValue(undefined);
    const onOpenChange = renderDialog();

    await userEvent.click(screen.getByRole("button", { name: "Delete rules" }));

    expect(mockedApi.remove).toHaveBeenCalledWith(7);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(navigate).toHaveBeenCalledWith("/smart-playlists");
  });

  it("keeps the dialog open and shows the error when the delete fails", async () => {
    mockedApi.remove.mockRejectedValue(new Error("Something went wrong"));
    renderDialog();

    await userEvent.click(screen.getByRole("button", { name: "Delete rules" }));

    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });
});
