from __future__ import annotations

import json
import time

import numpy as np
import onnxruntime as ort
import pandas as pd

from _common import ARTIFACT_DIR, PROCESSED_DIR, ensure_dirs


def main() -> int:
    ensure_dirs()
    onnx_path = ARTIFACT_DIR / "model.onnx"
    schema_path = ARTIFACT_DIR / "trained_feature_schema.json"
    if not onnx_path.exists() or not schema_path.exists():
        print("Missing ONNX or schema.")
        return 2

    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    input_features = schema["learned_features"]
    feature_count = len(input_features)
    session = ort.InferenceSession(str(onnx_path), providers=["CPUExecutionProvider"])
    data_path = PROCESSED_DIR / "maternal_risk.parquet"
    if data_path.exists():
        sample = pd.read_parquet(data_path).head(1)[input_features].astype("float32").to_numpy()
    else:
        sample = np.zeros((1, feature_count), dtype=np.float32)

    timings = []
    for _ in range(100):
        start = time.perf_counter()
        session.run(None, {"risk_input": sample})
        timings.append((time.perf_counter() - start) * 1000)

    p50 = float(np.percentile(timings, 50))
    p95 = float(np.percentile(timings, 95))
    size_mb = onnx_path.stat().st_size / (1024 * 1024)
    print(f"Desktop CPU p50: {p50:.2f} ms")
    print(f"Desktop CPU p95: {p95:.2f} ms")
    print(f"ONNX size: {size_mb:.2f} MB")
    if size_mb >= 5:
        return 3
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
