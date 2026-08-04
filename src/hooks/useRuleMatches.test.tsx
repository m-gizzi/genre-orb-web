import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { RuleGroup, RuleMatches, SmartPlaylistDetail } from "@/api/client";
import { smartPlaylistsApi } from "@/api/client";
import { makeQueryWrapper } from "@/test/utils";
import { useRuleMatches } from "./useRuleMatches";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return { ...actual, smartPlaylistsApi: { evaluate: vi.fn() } };
});

const mockedApi = vi.mocked(smartPlaylistsApi);

function response(total: number): RuleMatches {
  return {
    data: [],
    meta: {
      page: 1,
      per_page: 25,
      total,
      total_pages: 1,
      source_track_count: 100,
      evaluated_at: null,
    },
  };
}

const metal: RuleGroup = {
  match: "all",
  rules: [{ field: "genre", operator: "equals", value: "metal" }],
};

afterEach(() => vi.clearAllMocks());

describe("useRuleMatches", () => {
  it("previews the saved rules when no draft is given", async () => {
    mockedApi.evaluate.mockResolvedValue(response(7));
    const { wrapper } = makeQueryWrapper();

    const { result } = renderHook(() => useRuleMatches(7), { wrapper });

    await waitFor(() => expect(result.current.meta?.total).toBe(7));
    expect(mockedApi.evaluate).toHaveBeenCalledWith(7, {
      rules: undefined,
      page: 1,
      per_page: 25,
    });
  });

  it("asks nothing while disabled" , async () => {
    mockedApi.evaluate.mockResolvedValue(response(1));
    const { wrapper } = makeQueryWrapper();

    renderHook(() => useRuleMatches(7, { rules: metal, enabled: false }), { wrapper });

    await waitFor(() => expect(mockedApi.evaluate).not.toHaveBeenCalled());
  });

  it("asks nothing for an unusable id" , async () => {
    mockedApi.evaluate.mockResolvedValue(response(1));
    const { wrapper } = makeQueryWrapper();

    renderHook(() => useRuleMatches(Number("nope"), { rules: metal }), { wrapper });

    await waitFor(() => expect(mockedApi.evaluate).not.toHaveBeenCalled());
  });

  // The edit page rebuilds its rules object every render, so a new object with
  // the same content must not trigger another request.
  it("does not refetch when the rules are rebuilt with identical content", async () => {
    mockedApi.evaluate.mockResolvedValue(response(3));
    const { wrapper } = makeQueryWrapper();

    const { result, rerender } = renderHook(
      ({ rules }: { rules: RuleGroup }) => useRuleMatches(7, { rules }),
      { wrapper, initialProps: { rules: structuredClone(metal) } },
    );

    await waitFor(() => expect(result.current.meta?.total).toBe(3));
    rerender({ rules: structuredClone(metal) });

    await waitFor(() => expect(mockedApi.evaluate).toHaveBeenCalledTimes(1));
  });

  it("reports pending while the debounce window is open", async () => {
    mockedApi.evaluate.mockResolvedValue(response(3));
    const { wrapper } = makeQueryWrapper();

    const { result, rerender } = renderHook(
      ({ rules }: { rules: RuleGroup }) => useRuleMatches(7, { rules }),
      { wrapper, initialProps: { rules: metal } },
    );

    await waitFor(() => expect(result.current.isPending).toBe(false));

    rerender({
      rules: { match: "all", rules: [{ field: "genre", operator: "equals", value: "rock" }] },
    });

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(mockedApi.evaluate).toHaveBeenCalledTimes(2));
  });

  it("surfaces a failure", async () => {
    mockedApi.evaluate.mockRejectedValue(new Error("nope"));
    const { wrapper } = makeQueryWrapper();

    const { result } = renderHook(() => useRuleMatches(7), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.tracks).toEqual([]);
  });

  describe("reconciling the recorded evaluation", () => {
    function cached(queryClient: ReturnType<typeof makeQueryWrapper>["queryClient"]) {
      queryClient.setQueryData(["smartPlaylist", 7], {
        id: 7,
        match_count: 0,
        last_evaluated_at: null,
      } as SmartPlaylistDetail);
      return () => queryClient.getQueryData<SmartPlaylistDetail>(["smartPlaylist", 7]);
    }

    it("patches the cached record when the server recorded the run", async () => {
      mockedApi.evaluate.mockResolvedValue({
        ...response(9),
        meta: { ...response(9).meta, total: 9, evaluated_at: "2026-08-04T10:00:00Z" },
      });
      const { wrapper, queryClient } = makeQueryWrapper();
      const read = cached(queryClient);

      const { result } = renderHook(() => useRuleMatches(7), { wrapper });
      await waitFor(() => expect(result.current.meta?.total).toBe(9));

      await waitFor(() => expect(read()?.last_evaluated_at).toBe("2026-08-04T10:00:00Z"));
      expect(read()?.match_count).toBe(9);
    });

    it("leaves the cached record alone when the run was not recorded", async () => {
      mockedApi.evaluate.mockResolvedValue(response(9));
      const { wrapper, queryClient } = makeQueryWrapper();
      const read = cached(queryClient);

      const { result } = renderHook(() => useRuleMatches(7, { rules: metal }), { wrapper });
      await waitFor(() => expect(result.current.meta?.total).toBe(9));

      expect(read()?.last_evaluated_at).toBeNull();
      expect(read()?.match_count).toBe(0);
    });
  });
});
