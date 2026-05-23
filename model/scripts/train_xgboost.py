from __future__ import annotations

import json

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.pipeline import Pipeline
from xgboost import XGBClassifier

from _common import ARTIFACT_DIR, LABEL_ORDER, PROCESSED_DIR, REPORT_DIR, ensure_dirs


def main() -> int:
    ensure_dirs()
    dataset_path = PROCESSED_DIR / "maternal_risk.parquet"
    schema_path = ARTIFACT_DIR / "trained_feature_schema.json"
    if not dataset_path.exists() or not schema_path.exists():
        print("Prepared dataset/schema missing. Run prepare_dataset.py first.")
        return 2

    df = pd.read_parquet(dataset_path)
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    input_features = schema["learned_features"]
    model_features = schema.get("model_features", input_features)
    if not input_features or not model_features:
        print("No learned features available.")
        return 3

    label_encoder = LabelEncoder()
    label_encoder.fit(LABEL_ORDER)
    y = label_encoder.transform(df["risk_level"])
    x = df[input_features].astype("float32")
    model_feature_indices = [input_features.index(feature) for feature in model_features]

    selector = ColumnTransformer(
        [("selected", "passthrough", model_feature_indices)],
        remainder="drop",
    )
    classifier = XGBClassifier(
        objective="multi:softprob",
        num_class=len(LABEL_ORDER),
        n_estimators=400,
        max_depth=6,
        learning_rate=0.03,
        subsample=0.9,
        colsample_bytree=0.9,
        min_child_weight=1,
        reg_alpha=0.0,
        reg_lambda=1.0,
        eval_metric="mlogloss",
        random_state=42,
        tree_method="hist",
    )
    model = Pipeline([("selector", selector), ("classifier", classifier)])

    stratify = y if min(np.bincount(y)) >= 2 else None
    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.2,
        random_state=42,
        stratify=stratify,
    )

    class_counts = np.bincount(y_train)
    base_weights = len(y_train) / (len(class_counts) * class_counts)
    sample_weight = np.array([
        base_weights[int(label)] * (1.25 if int(label) == 2 else 1.0) for label in y_train
    ])
    model.fit(x_train, y_train, classifier__sample_weight=sample_weight)

    probabilities = model.predict_proba(x_test)
    predictions = probabilities.argmax(axis=1)
    report_dict = classification_report(
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
        "classification_report": report_dict,
    }
    if len(set(y_test)) > 1:
        metrics["auc_ovr_macro"] = float(
            roc_auc_score(y_test, probabilities, multi_class="ovr", average="macro")
        )

    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {"model": model, "label_encoder": label_encoder, "schema": schema},
        ARTIFACT_DIR / "risk_model.joblib",
    )
    (REPORT_DIR / "validation_metrics.json").write_text(
        json.dumps(metrics, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    (REPORT_DIR / "validation_report.md").write_text(
        "# Validation Report\n\n"
        f"Input features: {', '.join(input_features)}\n\n"
        f"Model features: {', '.join(model_features)}\n\n"
        f"AUC OVR macro: {metrics['auc_ovr_macro']}\n\n"
        f"HIGH-risk recall: {report_dict['HIGH']['recall']}\n\n"
        f"Confusion matrix: {metrics['confusion_matrix']}\n",
        encoding="utf-8",
    )

    print(classification_report(
        y_test,
        predictions,
        labels=list(range(len(LABEL_ORDER))),
        target_names=LABEL_ORDER,
        zero_division=0,
    ))
    print(f"HIGH-risk recall: {report_dict['HIGH']['recall']:.3f}")
    print((REPORT_DIR / "validation_report.md").read_text(encoding="utf-8"))
    if metrics["auc_ovr_macro"] is not None and metrics["auc_ovr_macro"] < 0.82:
        print("AUC gate failed: expected > 0.82.")
        return 6
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
