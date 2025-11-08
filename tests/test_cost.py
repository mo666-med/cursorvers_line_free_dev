import json
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1] / 'orchestration'))

import cost  # noqa: E402

PLAN = {
    "title": "Test Plan",
    "steps": [
        {"id": "s1", "action": "line.reply", "payload": {}, "idempotency_key": "a"},
        {"id": "s2", "action": "gmail.send", "payload": {"to": "a@example.com"}, "idempotency_key": "b"},
    ],
}


def test_estimate_plan_cost_counts_weights():
    estimate = cost.estimate_plan_cost(PLAN)
    # base 2 + gmail weight 4
    assert estimate == cost.BASE_COST + cost.WEIGHTS["gmail.send"]


def test_check_budget_flag():
    result = cost.check_budget(PLAN, budget_day=10, budget_week=200)
    assert result["within_budget"] is True


def test_suggest_degrade_replaces_gmail():
    degraded = cost.suggest_degrade(PLAN)
    steps = degraded["steps"]
    assert steps[1]["action"] == "line.reply"
    assert steps[1]["id"].endswith("_degraded")
