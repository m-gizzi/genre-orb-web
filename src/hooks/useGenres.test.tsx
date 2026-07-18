import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { genresApi, type ApiCollection, type Genre } from "@/api/client";
import { makeQueryWrapper } from "@/test/utils";
import { useGenres, useGenre } from "./useGenres";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return {
    ...actual,
    genresApi: { list: vi.fn(), get: vi.fn() },
  };
});

const mockedGenresApi = vi.mocked(genresApi);

const collection: ApiCollection<Genre> = {
  data: [],
  meta: { page: 1, per_page: 60, total: 0, total_pages: 0 },
};

describe("useGenres", () => {
  afterEach(() => vi.clearAllMocks());

  it("lists genres with the given params", async () => {
    mockedGenresApi.list.mockResolvedValue(collection);
    const { wrapper } = makeQueryWrapper();

    const { result } = renderHook(() => useGenres({ search: "rock" }), { wrapper });

    await waitFor(() => expect(result.current.data).toBe(collection));
    expect(mockedGenresApi.list).toHaveBeenCalledWith({ search: "rock" });
  });
});

describe("useGenre", () => {
  afterEach(() => vi.clearAllMocks());

  it("fetches a genre by id", async () => {
    const genre: Genre = { id: 4, name: "Jazz" };
    mockedGenresApi.get.mockResolvedValue(genre);
    const { wrapper } = makeQueryWrapper();

    const { result } = renderHook(() => useGenre(4), { wrapper });

    await waitFor(() => expect(result.current.data).toBe(genre));
    expect(mockedGenresApi.get).toHaveBeenCalledWith(4);
  });

  it("stays disabled for a non-finite id", () => {
    const { wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useGenre(NaN), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockedGenresApi.get).not.toHaveBeenCalled();
  });
});
