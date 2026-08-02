import { describe, it, expect, vi, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { playlistsApi, type Playlist } from "@/api/client";
import { renderWithProviders } from "@/test/utils";
import { EditPlaylistDialog } from "./EditPlaylistDialog";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return { ...actual, playlistsApi: { update: vi.fn() } };
});

const mockedApi = vi.mocked(playlistsApi);

const playlist = {
  id: 4,
  name: "Metal Mix",
  description: "Heavy stuff",
} as Playlist;

function renderDialog(onOpenChange = vi.fn()) {
  const result = renderWithProviders(
    <EditPlaylistDialog playlist={playlist} open onOpenChange={onOpenChange} />,
    { withQuery: true },
  );
  return { ...result, onOpenChange };
}

afterEach(() => vi.clearAllMocks());

describe("EditPlaylistDialog", () => {
  it("opens with the playlist's saved values", () => {
    renderDialog();

    expect(screen.getByLabelText("Name")).toHaveValue("Metal Mix");
    expect(screen.getByLabelText("Description")).toHaveValue("Heavy stuff");
  });

  it("saves the trimmed name and description", async () => {
    mockedApi.update.mockResolvedValue(playlist);
    const { onOpenChange } = renderDialog();

    await userEvent.clear(screen.getByLabelText("Name"));
    await userEvent.type(screen.getByLabelText("Name"), "  Doom Only  ");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(mockedApi.update).toHaveBeenCalledWith(4, {
      name: "Doom Only",
      description: "Heavy stuff",
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("clears the description to null rather than an empty string", async () => {
    mockedApi.update.mockResolvedValue(playlist);
    renderDialog();

    await userEvent.clear(screen.getByLabelText("Description"));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(mockedApi.update).toHaveBeenCalledWith(4, {
      name: "Metal Mix",
      description: null,
    });
  });

  it("will not save an empty name", async () => {
    renderDialog();

    await userEvent.clear(screen.getByLabelText("Name"));

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("forgets edits abandoned by Cancel when reopened", async () => {
    const { rerender } = renderWithProviders(
      <EditPlaylistDialog playlist={playlist} open onOpenChange={vi.fn()} />,
      { withQuery: true },
    );

    await userEvent.clear(screen.getByLabelText("Name"));
    await userEvent.type(screen.getByLabelText("Name"), "Abandoned");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    rerender(
      <EditPlaylistDialog playlist={playlist} open={false} onOpenChange={vi.fn()} />,
    );
    rerender(<EditPlaylistDialog playlist={playlist} open onOpenChange={vi.fn()} />);

    expect(screen.getByLabelText("Name")).toHaveValue("Metal Mix");
    expect(mockedApi.update).not.toHaveBeenCalled();
  });

  it("keeps the dialog open and shows the error when the save fails", async () => {
    mockedApi.update.mockRejectedValue(new Error("Spotify is unavailable."));
    const { onOpenChange } = renderDialog();

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Spotify is unavailable.")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
