import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SortControl } from "./SortControl";

const OPTIONS = { title: "Title", year: "Year" };

describe("SortControl", () => {
  it("toggles ascending to descending", () => {
    const onOrderChange = vi.fn();
    render(
      <SortControl
        sort="title"
        order="asc"
        options={OPTIONS}
        onSortChange={vi.fn()}
        onOrderChange={onOrderChange}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Sort ascending" }));
    expect(onOrderChange).toHaveBeenCalledWith("desc");
  });

  it("toggles descending back to ascending", () => {
    const onOrderChange = vi.fn();
    render(
      <SortControl
        sort="title"
        order="desc"
        options={OPTIONS}
        onSortChange={vi.fn()}
        onOrderChange={onOrderChange}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Sort descending" }));
    expect(onOrderChange).toHaveBeenCalledWith("asc");
  });

  it("hides the sort dropdown when there is only one option", () => {
    render(
      <SortControl
        sort="title"
        order="asc"
        options={{ title: "Title" }}
        onSortChange={vi.fn()}
        onOrderChange={vi.fn()}
      />
    );
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});
