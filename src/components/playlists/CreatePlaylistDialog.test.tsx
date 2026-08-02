import { describe, it, expect, vi, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { playlistsApi, type Playlist } from "@/api/client";
import { renderWithProviders } from "@/test/utils";
import { CreatePlaylistDialog } from "./CreatePlaylistDialog";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return { ...actual, playlistsApi: { create: vi.fn() } };
});

const mockedApi = vi.mocked(playlistsApi);

function renderDialog(onOpenChange = vi.fn()) {
  renderWithProviders(<CreatePlaylistDialog open onOpenChange={onOpenChange} />, {
    withQuery: true,
  });
  return onOpenChange;
}

afterEach(() => vi.clearAllMocks());

describe("CreatePlaylistDialog", () => {
  it("says up front that this reaches Spotify", () => {
    renderDialog();

    expect(
      screen.getByText("Genre Orb creates this on Spotify straight away."),
    ).toBeInTheDocument();
  });

  it("will not create without a name", async () => {
    renderDialog();

    await userEvent.type(screen.getByLabelText("Description"), "Heavy");

    expect(screen.getByRole("button", { name: "Create on Spotify" })).toBeDisabled();
  });

  it("creates the playlist and closes", async () => {
    mockedApi.create.mockResolvedValue({ id: 1 } as Playlist);
    const onOpenChange = renderDialog();

    await userEvent.type(screen.getByLabelText("Name"), "Doom Only");
    await userEvent.type(screen.getByLabelText("Description"), "Heavy");
    await userEvent.click(screen.getByRole("button", { name: "Create on Spotify" }));

    expect(mockedApi.create).toHaveBeenCalledWith({
      name: "Doom Only",
      description: "Heavy",
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("omits an empty description", async () => {
    mockedApi.create.mockResolvedValue({ id: 1 } as Playlist);
    renderDialog();

    await userEvent.type(screen.getByLabelText("Name"), "Doom Only");
    await userEvent.click(screen.getByRole("button", { name: "Create on Spotify" }));

    expect(mockedApi.create).toHaveBeenCalledWith({
      name: "Doom Only",
      description: undefined,
    });
  });

  it("keeps the dialog open and shows the error when the create fails", async () => {
    mockedApi.create.mockRejectedValue(new Error("Spotify not connected"));
    const onOpenChange = renderDialog();

    await userEvent.type(screen.getByLabelText("Name"), "Doom Only");
    await userEvent.click(screen.getByRole("button", { name: "Create on Spotify" }));

    expect(await screen.findByText("Spotify not connected")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
