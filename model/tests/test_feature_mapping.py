from __future__ import annotations

from scripts._common import find_column, map_label, parse_bp_pair, parse_number


def test_finds_bp_aliases() -> None:
    columns = ["Age", "SystolicBP", "DiastolicBP", "RiskLevel"]
    assert find_column(columns, ["systolicbp"]) == "SystolicBP"
    assert find_column(columns, ["diastolic bp", "diastolicbp"]) == "DiastolicBP"


def test_maps_risk_labels() -> None:
    assert map_label("low risk") == "LOW"
    assert map_label("mid risk") == "MODERATE"
    assert map_label("high risk") == "HIGH"


def test_parses_numeric_strings_and_bp_pairs() -> None:
    assert parse_number("38 week") == 38.0
    assert parse_number("50 kg") == 50.0
    assert parse_bp_pair("100/60") == (100.0, 60.0)
