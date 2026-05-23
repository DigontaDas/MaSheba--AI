from __future__ import annotations

import json

from _common import (
    COMBINED_BP_ALIASES,
    FEATURE_ALIASES,
    LABEL_ORDER,
    REPORT_DIR,
    ensure_dirs,
    find_column,
    find_label_column,
    extract_bp_series,
    extract_numeric_series,
    map_label,
    iter_source_files,
    read_table,
)


def main() -> int:
    ensure_dirs()
    files = iter_source_files()
    if not files:
        print("No source files found under model/data/raw.")
        return 2

    source_reports = []
    global_coverage: dict[str, list[str]] = {feature: [] for feature in FEATURE_ALIASES}
    lines = ["# Feature Coverage"]

    for path in files:
        df = read_table(path)
        columns = [str(column) for column in df.columns]
        coverage = {}
        combined_bp_column = find_column(columns, COMBINED_BP_ALIASES)
        for feature, aliases in FEATURE_ALIASES.items():
            column = find_column(columns, aliases)
            if feature in {"bp_systolic", "bp_diastolic"} and not column and combined_bp_column:
                systolic_series, diastolic_series = extract_bp_series(df[combined_bp_column])
                series = systolic_series if feature == "bp_systolic" else diastolic_series
                if series.notna().any():
                    coverage[feature] = combined_bp_column
                    global_coverage[feature].append(str(path))
                else:
                    coverage[feature] = None
                continue

            if feature in {"weight_kg", "gestational_age_weeks", "hemoglobin"} and column:
                series = extract_numeric_series(df[column])
                if series.notna().any():
                    coverage[feature] = column
                    global_coverage[feature].append(str(path))
                else:
                    coverage[feature] = None
                continue

            coverage[feature] = column
            if column:
                global_coverage[feature].append(str(path))

        label_column = find_label_column(columns)
        label_distribution: dict[str, int] = {label: 0 for label in LABEL_ORDER}
        if label_column:
            mapped_labels = df[label_column].map(map_label)
            for label in LABEL_ORDER:
                label_distribution[label] = int((mapped_labels == label).sum())
        lines.extend(
            [
                "",
                f"## {path.name}",
                f"- Rows: {len(df)}",
                f"- Columns: {', '.join(columns)}",
                f"- Label column: {label_column or 'None'}",
                f"- Label distribution: {json.dumps(label_distribution, ensure_ascii=False)}",
            ]
        )
        report = {
            "path": str(path),
            "rows": int(len(df)),
            "columns": columns,
            "dtypes": {column: str(dtype) for column, dtype in df.dtypes.items()},
            "label_column": label_column,
            "label_distribution": label_distribution,
            "coverage": coverage,
            "missingness": {
                column: float(df[column].isna().mean()) for column in columns
            },
            "sample_values": {
                column: [str(value) for value in df[column].dropna().head(3).tolist()]
                for column in columns
            },
        }
        source_reports.append(report)

    coverage_rows = []
    for position, feature in enumerate(FEATURE_ALIASES):
        sources = global_coverage[feature]
        verdict = "COVERED" if sources else "NOT COVERED"
        coverage_rows.append(
            {
                "tensor_position": position,
                "feature": feature,
                "sources": sources,
                "verdict": verdict,
            }
        )

    report_json = {
        "sources": source_reports,
        "feature_coverage": coverage_rows,
    }
    (REPORT_DIR / "feature_coverage.json").write_text(
        json.dumps(report_json, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    lines.extend(
        [
            "",
            "## Tensor Coverage",
            "",
            "| Tensor Position | Feature | Sources | Verdict |",
            "|---:|---|---|---|",
        ]
    )
    for row in coverage_rows:
        sources = ", ".join(row["sources"]) if row["sources"] else "None"
        lines.append(
            f"| {row['tensor_position']} | `{row['feature']}` | {sources} | {row['verdict']} |"
        )
    (REPORT_DIR / "feature_coverage.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    not_covered = [row["feature"] for row in coverage_rows if row["verdict"] == "NOT COVERED"]
    print((REPORT_DIR / "feature_coverage.md").read_text(encoding="utf-8"))
    if not_covered:
        print("Uncovered features:", ", ".join(not_covered))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
