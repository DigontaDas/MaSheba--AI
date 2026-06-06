from __future__ import annotations

import argparse
import json

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

from _common import (
    ARTIFACT_DIR,
    COMBINED_BP_ALIASES,
    FEATURE_ALIASES,
    LABEL_ORDER,
    PROCESSED_DIR,
    REPORT_DIR,
    ensure_dirs,
    find_column,
    find_label_column,
    extract_bp_series,
    extract_numeric_series,
    iter_source_files,
    map_label,
    read_table,
)

DETERMINISTIC_ONLY = {
    "swelling_present",
    "symptom_headache",
    "symptom_severe_headache",
    "symptom_blurred_vision",
    "symptom_dizziness",
    "symptom_fatigue",
    "symptom_abdominal_pain",
}

INPUT_FEATURES = [
    "bp_systolic",
    "bp_diastolic",
    "weight_kg",
    "hemoglobin",
    "gestational_age_weeks",
]

MODEL_FEATURES = [
    "bp_systolic",
    "bp_diastolic",
    "weight_kg",
    "gestational_age_weeks",
]


def prepare_source(path) -> pd.DataFrame:
    raw = read_table(path)
    columns = [str(column) for column in raw.columns]
    label_column = find_label_column(columns)
    if not label_column:
        return pd.DataFrame()

    mapped = pd.DataFrame()
    combined_bp_column = find_column(columns, COMBINED_BP_ALIASES)

    systolic_column = find_column(columns, FEATURE_ALIASES["bp_systolic"])
    diastolic_column = find_column(columns, FEATURE_ALIASES["bp_diastolic"])
    if systolic_column and diastolic_column:
        mapped["bp_systolic"] = extract_numeric_series(raw[systolic_column])
        mapped["bp_diastolic"] = extract_numeric_series(raw[diastolic_column])
    elif combined_bp_column:
        systolic_series, diastolic_series = extract_bp_series(raw[combined_bp_column])
        mapped["bp_systolic"] = systolic_series
        mapped["bp_diastolic"] = diastolic_series

    for feature, aliases in FEATURE_ALIASES.items():
        if feature in DETERMINISTIC_ONLY or feature in {"bp_systolic", "bp_diastolic"}:
            continue
        column = find_column(columns, aliases)
        if column:
            mapped[feature] = extract_numeric_series(raw[column])

    for feature in INPUT_FEATURES:
        if feature not in mapped.columns:
            mapped[feature] = np.nan

    mapped["risk_level"] = raw[label_column].map(map_label)
    mapped["source_file"] = str(path)
    return mapped.dropna(subset=["risk_level"])


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--allow-partial",
        action="store_true",
        help="Train on covered numeric features only; uncovered app inputs remain deterministic rules.",
    )
    parser.parse_args()

    ensure_dirs()
    frames = [prepare_source(path) for path in iter_source_files()]
    frames = [frame for frame in frames if not frame.empty]
    if not frames:
        print("No labeled source rows found. Download/profile datasets first.")
        return 2

    combined = pd.concat(frames, ignore_index=True, sort=False)

    for feature in INPUT_FEATURES:
        if feature not in combined.columns:
            combined[feature] = np.nan

    training_basis = combined.dropna(subset=MODEL_FEATURES).copy()
    if training_basis.empty:
        print("No rows contain the model feature set.")
        return 3

    weight_regressor = LinearRegression().fit(
        training_basis[["bp_systolic", "bp_diastolic"]],
        training_basis["weight_kg"],
    )
    gestation_regressor = LinearRegression().fit(
        training_basis[["bp_systolic", "bp_diastolic"]],
        training_basis["gestational_age_weeks"],
    )

    weight_missing = combined["weight_kg"].isna()
    gestation_missing = combined["gestational_age_weeks"].isna()
    if weight_missing.any():
        combined.loc[weight_missing, "weight_kg"] = weight_regressor.predict(
            combined.loc[weight_missing, ["bp_systolic", "bp_diastolic"]]
        )
    if gestation_missing.any():
        combined.loc[gestation_missing, "gestational_age_weeks"] = gestation_regressor.predict(
            combined.loc[gestation_missing, ["bp_systolic", "bp_diastolic"]]
        )

    combined["hemoglobin"] = np.nan

    prepared = combined.dropna(subset=["risk_level", *MODEL_FEATURES]).copy()
    prepared = prepared[prepared["risk_level"].isin(LABEL_ORDER)]
    if prepared.empty:
        print("No rows remain after dropping missing model features.")
        return 4

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    prepared.to_parquet(PROCESSED_DIR / "maternal_risk.parquet", index=False)

    schema = {
        "model_input_name": "risk_input",
        "label_order": LABEL_ORDER,
        "learned_features": INPUT_FEATURES,
        "model_features": MODEL_FEATURES,
        "uncovered_candidate_features": ["hemoglobin", *sorted(DETERMINISTIC_ONLY)],
        "deterministic_rule_features": sorted(DETERMINISTIC_ONLY),
        "no_silent_zero_fill": True,
    }
    (ARTIFACT_DIR / "trained_feature_schema.json").write_text(
        json.dumps(schema, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    report = [
        "# Prepared Dataset",
        "",
        f"Rows: {len(prepared)}",
        f"Mobile input features: {', '.join(INPUT_FEATURES)}",
        f"Model features: {', '.join(MODEL_FEATURES)}",
        "Hemoglobin handled by deterministic rules: True",
        f"Imputed weight rows: {int(weight_missing.sum())}",
        f"Imputed gestational age rows: {int(gestation_missing.sum())}",
        "",
        "Label distribution:",
        prepared["risk_level"].value_counts().to_string(),
    ]
    (REPORT_DIR / "prepared_dataset.md").write_text("\n".join(report) + "\n", encoding="utf-8")
    print("\n".join(report))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
