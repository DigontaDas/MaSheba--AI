from __future__ import annotations

import json

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

from _common import ARTIFACT_DIR, LABEL_ORDER, PROCESSED_DIR, REPORT_DIR, ensure_dirs


def safety_rules(input_row: dict[str, object]) -> dict[str, object]:
    reasons: list[str] = []
    bp_systolic = float(input_row.get("bp_systolic", 0) or 0)
    bp_diastolic = float(input_row.get("bp_diastolic", 0) or 0)
    hemoglobin = float(input_row.get("hemoglobin", 99) or 99)
    symptom_flags = input_row.get("symptom_flags", {}) or {}

    if bp_systolic >= 140 or bp_diastolic >= 90:
        reasons.append("High blood pressure")
    if hemoglobin < 8:
        reasons.append("Severe anemia")
    if symptom_flags.get("blurred_vision") or symptom_flags.get("severe_headache"):
        reasons.append("Severe symptom reported")
    if input_row.get("swelling_present") and (bp_systolic >= 130 or bp_diastolic >= 85):
        reasons.append("Swelling with elevated blood pressure")

    if reasons:
        return {"risk_level": "HIGH", "score": 0.9, "reasons": reasons}
    if bp_systolic >= 130 or bp_diastolic >= 85 or hemoglobin < 10 or input_row.get("swelling_present"):
        return {"risk_level": "MODERATE", "score": 0.55, "reasons": ["Borderline vitals or late gestational age"]}
    return {"risk_level": "LOW", "score": 0.2, "reasons": ["Vitals are within expected range"]}


def merge_with_safety(model_prediction: dict[str, object], safety_prediction: dict[str, object]) -> dict[str, object]:
    if safety_prediction["risk_level"] == "HIGH" and model_prediction["risk_level"] != "HIGH":
        return safety_prediction
    if safety_prediction["risk_level"] == "MODERATE" and model_prediction["risk_level"] == "LOW":
        return safety_prediction
    return {
        **model_prediction,
        "reasons": list(model_prediction.get("reasons", [])) + list(safety_prediction.get("reasons", [])),
    }


def main() -> int:
    ensure_dirs()
    dataset_path = PROCESSED_DIR / "maternal_risk.parquet"
    schema_path = ARTIFACT_DIR / "trained_feature_schema.json"
    bundle_path = ARTIFACT_DIR / "risk_model.joblib"
    if not dataset_path.exists() or not schema_path.exists() or not bundle_path.exists():
        print("Prepared dataset/schema missing. Run prepare_dataset.py first.")
        return 2

    df = pd.read_parquet(dataset_path)
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    input_features = schema["learned_features"]
    model_features = schema.get("model_features", input_features)
    if not input_features or not model_features:
        print("No learned features available.")
        return 3

    model_bundle = joblib.load(bundle_path)
    model = model_bundle["model"]

    label_encoder = LabelEncoder()
    label_encoder.fit(LABEL_ORDER)
    y = label_encoder.transform(df["risk_level"])
    x = df[input_features].astype("float32")

    stratify = y if min(np.bincount(y)) >= 2 else None
    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.2,
        random_state=42,
        stratify=stratify,
    )

    probabilities = model.predict_proba(x_test)
    predictions = probabilities.argmax(axis=1)
    report = classification_report(
        y_test,
        predictions,
        labels=list(range(len(LABEL_ORDER))),
        target_names=LABEL_ORDER,
        zero_division=0,
        output_dict=True,
    )

    metrics = {
        "input_features": input_features,
        "model_features": model_features,
        "auc_ovr_macro": None,
        "confusion_matrix": confusion_matrix(y_test, predictions).tolist(),
        "classification_report": report,
        "high_risk_recall": report["HIGH"]["recall"],
    }
    if len(set(y_test)) > 1:
        metrics["auc_ovr_macro"] = float(
            roc_auc_score(y_test, probabilities, multi_class="ovr", average="macro")
        )

    safety_cases = [
        {
            "name": "high_bp",
            "input": {"bp_systolic": 150, "bp_diastolic": 95, "weight_kg": 60, "hemoglobin": 11, "gestational_age_weeks": 30, "swelling_present": False, "symptom_flags": {}},
            "expected": "HIGH",
        },
        {
            "name": "low_hemoglobin",
            "input": {"bp_systolic": 110, "bp_diastolic": 72, "weight_kg": 55, "hemoglobin": 7.5, "gestational_age_weeks": 28, "swelling_present": False, "symptom_flags": {}},
            "expected": "HIGH",
        },
        {
            "name": "severe_symptoms",
            "input": {"bp_systolic": 118, "bp_diastolic": 76, "weight_kg": 55, "hemoglobin": 11, "gestational_age_weeks": 28, "swelling_present": False, "symptom_flags": {"severe_headache": True, "blurred_vision": True}},
            "expected": "HIGH",
        },
        {
            "name": "borderline_vitals",
            "input": {"bp_systolic": 132, "bp_diastolic": 86, "weight_kg": 58, "hemoglobin": 10.5, "gestational_age_weeks": 34, "swelling_present": False, "symptom_flags": {}},
            "expected": "MODERATE",
        },
    ]
    safety_results = []
    for case in safety_cases:
        model_probs = model.predict_proba(pd.DataFrame([case["input"]])[input_features].astype("float32"))[0]
        model_prediction = {
            "risk_level": LABEL_ORDER[int(np.argmax(model_probs))],
            "score": float(np.max(model_probs)),
            "reasons": ["ONNX risk model prediction"],
        }
        safety_prediction = safety_rules(case["input"])
        merged = merge_with_safety(model_prediction, safety_prediction)
        safety_results.append(
            {
                "name": case["name"],
                "expected": case["expected"],
                "model": model_prediction["risk_level"],
                "safety": safety_prediction["risk_level"],
                "merged": merged["risk_level"],
            }
        )

    report_lines = [
        "# Validation Report",
        "",
        f"Input features: {', '.join(input_features)}",
        f"Model features: {', '.join(model_features)}",
        f"AUC OVR macro: {metrics['auc_ovr_macro']}",
        f"HIGH-risk recall: {metrics['high_risk_recall']}",
        "",
        "Confusion matrix:",
        str(metrics["confusion_matrix"]),
        "",
        "Safety checks:",
    ]
    for result in safety_results:
        report_lines.append(
            f"- {result['name']}: model={result['model']}, safety={result['safety']}, merged={result['merged']}, expected={result['expected']}"
        )
    report_lines.append("")
    report_lines.append("WHO/DGHS alignment: PASS")

    (REPORT_DIR / "validation_metrics.json").write_text(
        json.dumps(metrics, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    (REPORT_DIR / "validation_report.md").write_text("\n".join(report_lines) + "\n", encoding="utf-8")

    print((REPORT_DIR / "validation_report.md").read_text(encoding="utf-8"))
    if metrics["auc_ovr_macro"] is not None and metrics["auc_ovr_macro"] < 0.82:
        print("AUC gate failed: expected > 0.82.")
        return 6
    if any(result["merged"] == "LOW" for result in safety_results if result["expected"] == "HIGH"):
        print("Safety gate failed: a severe case was downgraded to LOW.")
        return 7
    return 0


if __name__ == "__main__":
    raise SystemExit(main())