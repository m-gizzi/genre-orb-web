import { describe, it, expect, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { RuleGroup } from "@/api/client";
import { renderWithProviders } from "@/test/utils";
import { ruleSchema } from "@/test/ruleSchema";
import { RuleGroupCard, type RuleTreeHandlers } from "./RuleGroupCard";

const cond = { field: "genre", operator: "equals", value: "metal" };

function noopHandlers(): RuleTreeHandlers {
  return {
    onChangeNode: vi.fn(),
    onAddNode: vi.fn(),
    onRemoveNode: vi.fn(),
    onMoveNode: vi.fn(),
    onWrapNode: vi.fn(),
    onDuplicateNode: vi.fn(),
    onUnwrapGroup: vi.fn(),
  };
}

function renderCard(group: RuleGroup, { editable = true } = {}) {
  const handlers = noopHandlers();
  const result = renderWithProviders(
    <RuleGroupCard
      group={group}
      root={group}
      schema={ruleSchema}
      path={[]}
      editable={editable}
      handlers={handlers}
    />,
    { withQuery: true },
  );
  return { handlers, ...result };
}

function nest(levels: number): RuleGroup {
  let group: RuleGroup = { match: "all", rules: [] };
  for (let i = 1; i < levels; i++) group = { match: "all", rules: [group] };
  return group;
}

describe("RuleGroupCard", () => {
  it("prompts for a first condition when the root is empty", () => {
    renderCard({ match: "all", rules: [] });

    expect(
      screen.getByText(/No rules yet. Add a condition/),
    ).toBeInTheDocument();
  });

  it("adds a condition seeded from the first field", async () => {
    const { handlers } = renderCard({ match: "all", rules: [] });

    await userEvent.click(screen.getByRole("button", { name: /Condition/ }));

    expect(handlers.onAddNode).toHaveBeenCalledWith([], {
      field: "genre",
      operator: "equals",
      value: null,
    });
  });

  it("adds a nested group", async () => {
    const { handlers } = renderCard({ match: "all", rules: [] });

    await userEvent.click(screen.getByRole("button", { name: /Group/ }));

    expect(handlers.onAddNode).toHaveBeenCalledWith([], { match: "all", rules: [] });
  });

  it("renders nested groups recursively", () => {
    renderCard({
      match: "all",
      rules: [cond, { match: "any", rules: [cond] }],
    });

    expect(
      screen.getByRole("region", { name: "Nested group at level 2" }),
    ).toBeInTheDocument();
  });

  it("does not offer NOT on the root, where it would exclude everything", () => {
    renderCard({ match: "all", rules: [cond] });

    expect(
      screen.queryByRole("button", { name: "Invert this group" }),
    ).not.toBeInTheDocument();
  });

  it("toggles NOT on a nested group", async () => {
    const { handlers } = renderCard({
      match: "all",
      rules: [{ match: "any", rules: [cond] }],
    });

    await userEvent.click(
      screen.getByRole("button", { name: "Invert this group" }),
    );

    expect(handlers.onChangeNode).toHaveBeenCalledWith([0], {
      match: "any",
      rules: [cond],
      not: true,
    });
  });

  it("explains an inverted group in place", () => {
    renderCard({
      match: "all",
      rules: [{ match: "any", not: true, rules: [cond] }],
    });

    expect(screen.getByRole("button", { name: "Invert this group" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText(/excludes tracks that match this group/)).toBeInTheDocument();
  });

  it("ungroups a nested group", async () => {
    const { handlers } = renderCard({
      match: "all",
      rules: [{ match: "any", rules: [cond] }],
    });

    await userEvent.click(screen.getByRole("button", { name: /Ungroup/ }));

    expect(handlers.onUnwrapGroup).toHaveBeenCalledWith([0]);
  });

  it("stops offering new groups at the nesting limit", () => {
    renderCard(nest(ruleSchema.max_depth));

    const deepest = screen.getByRole("region", {
      name: `Nested group at level ${ruleSchema.max_depth}`,
    });

    expect(within(deepest).getByRole("button", { name: /Group/ })).toBeDisabled();
    expect(within(deepest).getByRole("button", { name: /Condition/ })).toBeEnabled();
  });

  it("still allows groups one level above the limit", () => {
    renderCard(nest(ruleSchema.max_depth - 1));

    const deepest = screen.getByRole("region", {
      name: `Nested group at level ${ruleSchema.max_depth - 1}`,
    });

    expect(within(deepest).getByRole("button", { name: /Group/ })).toBeEnabled();
  });

  it("stops adding anything once the rule cap is reached", () => {
    const rules = Array.from({ length: ruleSchema.max_nodes }, () => cond);
    renderCard({ match: "all", rules });

    expect(screen.getByRole("button", { name: /Condition/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Group/ })).toBeDisabled();
  });

  describe("read-only", () => {
    it("describes the tree in words with no controls", () => {
      renderCard(
        {
          match: "all",
          rules: [
            cond,
            { field: "year", operator: "greater_than", value: 2020 },
            { match: "any", rules: [{ field: "artist", operator: "in", value: ["Gojira", "Opeth"] }] },
          ],
        },
        { editable: false },
      );

      expect(screen.getByText("Match ALL of")).toBeInTheDocument();
      expect(screen.getByText("Genre is “metal”")).toBeInTheDocument();
      expect(screen.getByText("Release year is after 2020")).toBeInTheDocument();
      expect(screen.getByText("Match ANY of")).toBeInTheDocument();
      expect(
        screen.getByText("Artist is any of “Gojira”, “Opeth”"),
      ).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("spells out an inverted group", () => {
      renderCard(
        { match: "all", rules: [{ match: "any", not: true, rules: [cond] }] },
        { editable: false },
      );

      expect(screen.getByText("Exclude tracks matching ANY of")).toBeInTheDocument();
    });
  });
});
