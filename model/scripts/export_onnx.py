from __future__ import annotations

import joblib
import numpy as np
import onnx
import onnxruntime as ort
import pandas as pd
from onnxmltools import convert_xgboost
from onnxmltools.convert.common.data_types import FloatTensorType
from onnx import TensorProto, compose, helper

from _common import ARTIFACT_DIR, PROCESSED_DIR, ensure_dirs


def main() -> int:
    ensure_dirs()
    artifact_path = ARTIFACT_DIR / "risk_model.joblib"
    if not artifact_path.exists():
        print("Missing risk_model.joblib. Run train_xgboost.py first.")
        return 2

    bundle = joblib.load(artifact_path)
    pipeline = bundle["model"]
    schema = bundle["schema"]
    input_features = schema["learned_features"]
    model_features = schema.get("model_features", input_features)
    feature_indices = [input_features.index(feature) for feature in model_features]

    classifier = pipeline.named_steps["classifier"]
    try:
        xgb_model = convert_xgboost(
            classifier,
            initial_types=[("model_input", FloatTensorType([None, len(model_features)]))],
            target_opset=15,
        )
    except Exception as exc:
        print("onnxmltools conversion failed.")
        print(str(exc))
        return 3

    gather_input = helper.make_tensor_value_info("risk_input", TensorProto.FLOAT, [None, len(input_features)])
    gather_output = helper.make_tensor_value_info("selected_input", TensorProto.FLOAT, [None, len(model_features)])
    gather_indices = helper.make_tensor(
        "selected_indices",
        TensorProto.INT64,
        [len(feature_indices)],
        np.asarray(feature_indices, dtype=np.int64),
    )
    gather_node = helper.make_node("Gather", ["risk_input", "selected_indices"], ["selected_input"], axis=1)
    gather_graph = helper.make_graph(
        [gather_node],
        "feature_selector",
        [gather_input],
        [gather_output],
        [gather_indices],
    )
    # Ensure the converted XGBoost model contains a default-domain opset import
    # because the Gather node we add lives in the default domain (''). If the
    # converted model lacks a '' opset entry add a conservative opset (13).
    has_default_domain = any(getattr(o, "domain", "") == "" for o in xgb_model.opset_import)
    if not has_default_domain:
        xgb_model.opset_import.extend([helper.make_operatorsetid("", 13)])

    # Create gather model using the same opset imports as the converted XGBoost
    # model and align the IR version so compose.merge_models can operate.
    gather_model = helper.make_model(
        gather_graph,
        producer_name="maasheba-feature-selector",
        opset_imports=list(xgb_model.opset_import),
    )
    gather_model.ir_version = xgb_model.ir_version

    classifier_input_name = xgb_model.graph.input[0].name
    onnx_model = compose.merge_models(gather_model, xgb_model, io_map=[("selected_input", classifier_input_name)])
    onnx.checker.check_model(onnx_model)

    output_path = ARTIFACT_DIR / "model.onnx"
    output_path.write_bytes(onnx_model.SerializeToString())
    size_mb = output_path.stat().st_size / (1024 * 1024)
    print(f"Exported {output_path} ({size_mb:.2f} MB)")

    data_path = PROCESSED_DIR / "maternal_risk.parquet"
    if not data_path.exists():
        print("Missing processed data for parity check.")
        return 4

    sample = pd.read_parquet(data_path).head(1)
    sample_input = sample[input_features].astype("float32").to_numpy()
    pipeline_probs = pipeline.predict_proba(sample[input_features].astype("float32"))
    session = ort.InferenceSession(str(output_path), providers=["CPUExecutionProvider"])
    ort_outputs = session.run(None, {"risk_input": sample_input})
    ort_probs = None
    for output in ort_outputs:
        array = np.asarray(output)
        if array.ndim == 2 and array.shape[1] == pipeline_probs.shape[1]:
            ort_probs = array
            break
    if ort_probs is None:
        print("Parity check failed: probability tensor not found.")
        return 5

    max_delta = float(np.max(np.abs(pipeline_probs - ort_probs)))
    print(f"Parity max delta: {max_delta:.8f}")
    if max_delta > 1e-5:
        print("Parity check failed: sklearn and ONNX outputs diverge.")
        return 6
    if size_mb >= 5:
        print("Size gate failed: model must be under 5 MB.")
        return 7
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
