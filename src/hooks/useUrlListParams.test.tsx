import { describe, it, expect } from "vitest";
import type { ReactNode } from "react";
import { renderHook, act } from "@testing-library/react";
import {
  MemoryRouter,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import {
  parseArtistFilters,
  artistFiltersToParams,
} from "@/lib/catalogFilterParams";
import { useUrlListParams } from "./useUrlListParams";

function renderAt(route: string) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
  );
  return renderHook(
    () => ({
      list: useUrlListParams(parseArtistFilters, artistFiltersToParams),
      location: useLocation(),
      navigationType: useNavigationType(),
    }),
    { wrapper }
  );
}

describe("useUrlListParams", () => {
  it("reads filters out of the query string", () => {
    const { result } = renderAt("/artists?search=muse&sort=popularity&page=3");
    expect(result.current.list.filters).toMatchObject({
      search: "muse",
      sort: "popularity",
      page: 3,
    });
  });

  it("writes a patch back to the URL, omitting defaults", () => {
    const { result } = renderAt("/artists");

    act(() => result.current.list.applyPatch({ search: "muse" }));

    expect(result.current.location.search).toBe("?search=muse");
    expect(result.current.list.filters.search).toBe("muse");
  });

  it("returns to page 1 when a patch doesn't set the page itself", () => {
    const { result } = renderAt("/artists?page=4&search=old");

    act(() => result.current.list.applyPatch({ search: "new" }));

    expect(result.current.list.filters.page).toBe(1);
    expect(result.current.location.search).toBe("?search=new");
  });

  it("keeps the requested page when the patch sets it", () => {
    const { result } = renderAt("/artists?search=muse");

    act(() => result.current.list.applyPatch({ page: 4 }));

    expect(result.current.list.filters.page).toBe(4);
    expect(result.current.location.search).toContain("page=4");
  });

  it("merges a patch over existing filters rather than replacing them", () => {
    const { result } = renderAt("/artists?search=muse&order=desc");

    act(() => result.current.list.applyPatch({ genre: "5" }));

    expect(result.current.list.filters).toMatchObject({
      search: "muse",
      order: "desc",
      genre: "5",
    });
  });

  it("drops a filter when patched with undefined", () => {
    const { result } = renderAt("/artists?search=muse&genre=5");

    act(() => result.current.list.applyPatch({ search: undefined }));

    expect(result.current.list.filters.search).toBeUndefined();
    expect(result.current.location.search).toBe("?genre=5");
  });

  it("clears every filter", () => {
    const { result } = renderAt("/artists?search=muse&genre=5&page=2");

    act(() => result.current.list.clear());

    expect(result.current.location.search).toBe("");
    expect(result.current.list.filters.search).toBeUndefined();
  });

  it("replaces history rather than pushing, so back leaves the list", () => {
    const { result } = renderAt("/artists");

    act(() => result.current.list.applyPatch({ search: "muse" }));
    expect(result.current.navigationType).toBe("REPLACE");

    act(() => result.current.list.clear());
    expect(result.current.navigationType).toBe("REPLACE");
  });
});
