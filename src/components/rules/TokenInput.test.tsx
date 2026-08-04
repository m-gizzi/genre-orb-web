import { useState } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ApiCollection, Artist } from "@/api/client";
import { artistsApi } from "@/api/client";
import { renderWithProviders } from "@/test/utils";
import { TokenInput } from "./TokenInput";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return {
    ...actual,
    genresApi: { list: vi.fn() },
    artistsApi: { list: vi.fn() },
    albumsApi: { list: vi.fn() },
  };
});

const mockedArtists = vi.mocked(artistsApi);

function page(names: string[]): ApiCollection<Artist> {
  return {
    data: names.map(
      (name, i) =>
        ({ id: i + 1, name, spotify_id: `s${i}`, image_url: null }) as Artist,
    ),
    meta: { page: 1, per_page: 8, total: names.length, total_pages: 1 },
  };
}

afterEach(() => vi.clearAllMocks());

function renderTokens(initial: string[] = []) {
  const onChange = vi.fn();

  function Harness() {
    const [values, setValues] = useState(initial);
    return (
      <TokenInput
        values={values}
        suggest="artists"
        label="Artist"
        onChange={(next) => {
          onChange(next);
          setValues(next);
        }}
      />
    );
  }

  renderWithProviders(<Harness />, { withQuery: true });
  return { onChange, input: screen.getByRole("combobox", { name: "Artist values" }) };
}

describe("TokenInput", () => {
  it("adds free text on Enter, so a value need not be in the library yet", async () => {
    mockedArtists.list.mockResolvedValue(page([]));
    const { onChange } = renderTokens();

    await userEvent.type(screen.getByRole("combobox", { name: "Artist values" }), "Gojira{Enter}");

    expect(onChange).toHaveBeenCalledWith(["Gojira"]);
    expect(screen.getByText("Gojira")).toBeInTheDocument();
  });

  it("adds a suggestion from the library", async () => {
    mockedArtists.list.mockResolvedValue(page(["Meshuggah"]));
    const { onChange } = renderTokens();

    await userEvent.type(screen.getByRole("combobox", { name: "Artist values" }), "mesh");
    await userEvent.click(await screen.findByRole("option", { name: "Meshuggah" }));

    expect(onChange).toHaveBeenCalledWith(["Meshuggah"]);
  });

  it("will not add the same value twice", async () => {
    mockedArtists.list.mockResolvedValue(page([]));
    const { onChange } = renderTokens(["Gojira"]);

    await userEvent.type(screen.getByRole("combobox", { name: "Artist values" }), "Gojira{Enter}");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("removes a chip with its button", async () => {
    mockedArtists.list.mockResolvedValue(page([]));
    const { onChange } = renderTokens(["Gojira", "Opeth"]);

    await userEvent.click(screen.getByRole("button", { name: "Remove Gojira" }));

    expect(onChange).toHaveBeenCalledWith(["Opeth"]);
  });

  it("backspaces the last chip from an empty input", async () => {
    mockedArtists.list.mockResolvedValue(page([]));
    const { onChange, input } = renderTokens(["Gojira", "Opeth"]);

    await userEvent.click(input);
    await userEvent.keyboard("{Backspace}");

    expect(onChange).toHaveBeenCalledWith(["Gojira"]);
  });

  it("does not suggest a value already chosen", async () => {
    mockedArtists.list.mockResolvedValue(page(["Gojira", "Opeth"]));
    renderTokens(["Gojira"]);

    await userEvent.type(screen.getByRole("combobox", { name: "Artist values" }), "o");

    expect(await screen.findByRole("option", { name: "Opeth" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Gojira" })).not.toBeInTheDocument();
  });
});
