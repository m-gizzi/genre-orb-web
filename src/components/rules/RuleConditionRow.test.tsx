import { useState } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { RuleCondition } from "@/api/client";
import { genresApi, artistsApi, albumsApi } from "@/api/client";
import { renderWithProviders } from "@/test/utils";
import { ruleSchema } from "@/test/ruleSchema";
import { RuleConditionRow } from "./RuleConditionRow";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return {
    ...actual,
    genresApi: { list: vi.fn() },
    artistsApi: { list: vi.fn() },
    albumsApi: { list: vi.fn() },
  };
});

const emptyPage = { data: [], meta: { page: 1, per_page: 8, total: 0, total_pages: 0 } };
vi.mocked(genresApi).list.mockResolvedValue(emptyPage);
vi.mocked(artistsApi).list.mockResolvedValue(emptyPage);
vi.mocked(albumsApi).list.mockResolvedValue(emptyPage);

afterEach(() => vi.clearAllMocks());

function renderRow(initial: RuleCondition, { editable = true } = {}) {
  const onChange = vi.fn();
  const actions = {
    onMove: vi.fn(),
    onWrap: vi.fn(),
    onDuplicate: vi.fn(),
    onRemove: vi.fn(),
    canMoveUp: true,
    canMoveDown: true,
    canWrap: true,
  };

  function Harness() {
    const [condition, setCondition] = useState(initial);

    return (
      <ul>
        <RuleConditionRow
          condition={condition}
          schema={ruleSchema}
          editable={editable}
          onChange={(next) => {
            onChange(next);
            setCondition(next);
          }}
          actions={actions}
        />
      </ul>
    );
  }

  renderWithProviders(<Harness />, { withQuery: true });

  return { onChange, actions };
}

async function chooseFrom(triggerName: string, optionName: string) {
  await userEvent.click(screen.getByRole("combobox", { name: triggerName }));
  await userEvent.click(await screen.findByRole("option", { name: optionName }));
}

describe("RuleConditionRow", () => {
  it("shows only the operators the field supports", async () => {
    renderRow({ field: "duration", operator: "greater_than", value: 120000 });

    await userEvent.click(screen.getByRole("combobox", { name: "Operator" }));

    expect(await screen.findByRole("option", { name: "is longer than" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "contains" })).not.toBeInTheDocument();
  });

  it("resets the operator and value when the field changes", async () => {
    const { onChange } = renderRow({
      field: "genre",
      operator: "contains",
      value: "metal",
    });

    await chooseFrom("Field", "Release year");

    expect(onChange).toHaveBeenCalledWith({
      field: "year",
      operator: "equals",
      value: null,
    });
  });

  it("lifts a scalar into a list when moving to a list operator", async () => {
    const { onChange } = renderRow({
      field: "genre",
      operator: "equals",
      value: "metal",
    });

    await chooseFrom("Operator", "is any of");

    expect(onChange).toHaveBeenCalledWith({
      field: "genre",
      operator: "in",
      value: ["metal"],
    });
  });

  it("flags a rule with no value and does not pretend it is finished", () => {
    renderRow({ field: "genre", operator: "equals", value: null });

    expect(screen.getByText("Needs a value")).toBeInTheDocument();
  });

  it("does not flag a finished rule", () => {
    renderRow({ field: "genre", operator: "equals", value: "metal" });

    expect(screen.queryByText("Needs a value")).not.toBeInTheDocument();
  });

  it("renders a two-ended range without letting the bounds swap", async () => {
    const { onChange } = renderRow({
      field: "year",
      operator: "between",
      value: [],
    });

    await userEvent.type(
      screen.getByRole("spinbutton", { name: "Release year upper bound" }),
      "2024",
    );

    expect(onChange).toHaveBeenLastCalledWith({
      field: "year",
      operator: "between",
      value: ["", 2024],
    });
  });

  it("renders duration in minutes and stores milliseconds", async () => {
    const { onChange } = renderRow({
      field: "duration",
      operator: "greater_than",
      value: null,
    });

    const input = screen.getByRole("spinbutton", {
      name: "Duration value in minutes",
    });
    await userEvent.type(input, "5");

    expect(onChange).toHaveBeenLastCalledWith({
      field: "duration",
      operator: "greater_than",
      value: 300000,
    });
  });

  it("renders a relative date as a count and a unit", async () => {
    const { onChange } = renderRow({
      field: "date_added",
      operator: "in_the_last",
      value: null,
    });

    await userEvent.type(
      screen.getByRole("spinbutton", { name: "Date added count" }),
      "30",
    );

    expect(onChange).toHaveBeenLastCalledWith({
      field: "date_added",
      operator: "in_the_last",
      value: { count: 30, unit: "days" },
    });
  });

  it("offers a plain choice for a boolean field", async () => {
    const { onChange } = renderRow({
      field: "explicit",
      operator: "equals",
      value: null,
    });

    await chooseFrom("Explicit value", "Clean");

    expect(onChange).toHaveBeenCalledWith({
      field: "explicit",
      operator: "equals",
      value: false,
    });
  });

  it("offers removal for a field the catalog no longer knows", async () => {
    const { actions } = renderRow({
      field: "play_count",
      operator: "greater_than",
      value: 5,
    });

    expect(screen.getByText(/Unknown field “play_count”/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Remove/ }));

    expect(actions.onRemove).toHaveBeenCalled();
  });

  it("reads as a sentence with no controls when read-only", () => {
    renderRow(
      { field: "genre", operator: "contains", value: "metal" },
      { editable: false },
    );

    expect(screen.getByText("Genre contains “metal”")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
