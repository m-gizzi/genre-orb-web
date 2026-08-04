import { useState } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ApiCollection, Artist } from "@/api/client";
import { artistsApi } from "@/api/client";
import { renderWithProviders } from "@/test/utils";
import { ruleSchema } from "@/test/ruleSchema";
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

function renderTokens(initial: string[] = [], maxValues = ruleSchema.max_list_size) {
  const onChange = vi.fn();

  function Harness() {
    const [values, setValues] = useState(initial);
    return (
      <TokenInput
        values={values}
        suggest="artists"
        label="Artist"
        maxValues={maxValues}
        onChange={(next) => {
          onChange(next);
          setValues(next);
        }}
      />
    );
  }

  renderWithProviders(<Harness />, { withQuery: true });
  return { onChange };
}

const tokenInput = () => screen.getByRole("combobox", { name: "Artist values" });

describe("TokenInput", () => {
  it("adds free text on Enter, so a value need not be in the library yet", async () => {
    mockedArtists.list.mockResolvedValue(page([]));
    const { onChange } = renderTokens();

    await userEvent.type(tokenInput(), "Gojira{Enter}");

    expect(onChange).toHaveBeenCalledWith(["Gojira"]);
    expect(screen.getByText("Gojira")).toBeInTheDocument();
  });

  it("adds a suggestion from the library", async () => {
    mockedArtists.list.mockResolvedValue(page(["Meshuggah"]));
    const { onChange } = renderTokens();

    await userEvent.type(tokenInput(), "mesh");
    await userEvent.click(await screen.findByRole("option", { name: "Meshuggah" }));

    expect(onChange).toHaveBeenCalledWith(["Meshuggah"]);
  });

  it("will not add the same value twice", async () => {
    mockedArtists.list.mockResolvedValue(page([]));
    const { onChange } = renderTokens(["Gojira"]);

    await userEvent.type(tokenInput(), "Gojira{Enter}");

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
    const { onChange } = renderTokens(["Gojira", "Opeth"]);

    await userEvent.click(tokenInput());
    await userEvent.keyboard("{Backspace}");

    expect(onChange).toHaveBeenCalledWith(["Gojira"]);
  });

  it("stays quiet when backspace has no chip to remove", async () => {
    mockedArtists.list.mockResolvedValue(page([]));
    const { onChange } = renderTokens([]);

    await userEvent.click(tokenInput());
    await userEvent.keyboard("{Backspace}");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps repeated values distinct, since the server allows them", async () => {
    mockedArtists.list.mockResolvedValue(page([]));
    const { onChange } = renderTokens(["Gojira", "Gojira"]);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);

    await userEvent.click(screen.getAllByRole("button", { name: "Remove Gojira" })[0]!);

    expect(onChange).toHaveBeenCalledWith(["Gojira"]);
  });

  it("does not suggest a value already chosen", async () => {
    mockedArtists.list.mockResolvedValue(page(["Gojira", "Opeth"]));
    renderTokens(["Gojira"]);

    await userEvent.type(tokenInput(), "o");

    expect(await screen.findByRole("option", { name: "Opeth" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Gojira" })).not.toBeInTheDocument();
  });

  it("stops taking values at the cap the server enforces", () => {
    mockedArtists.list.mockResolvedValue(page([]));
    renderTokens(["Gojira", "Opeth"], 2);

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByText("2 values is the most one rule can match.")).toBeInTheDocument();
  });

  it("takes values again once one is removed", async () => {
    mockedArtists.list.mockResolvedValue(page([]));
    renderTokens(["Gojira", "Opeth"], 2);

    await userEvent.click(screen.getByRole("button", { name: "Remove Gojira" }));

    expect(tokenInput()).toBeInTheDocument();
  });
});
