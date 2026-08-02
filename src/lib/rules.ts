import type { RuleCondition, RuleGroup } from "@/api/client";

function isRuleGroup(node: RuleCondition | RuleGroup): node is RuleGroup {
  return "match" in node && "rules" in node;
}

export function countRules(group: RuleGroup): number {
  return group.rules.reduce(
    (total, node) => total + 1 + (isRuleGroup(node) ? countRules(node) : 0),
    0,
  );
}
