from __future__ import annotations

from pathlib import Path


def test_exported_model_is_not_placeholder_when_present() -> None:
    onnx_path = Path(__file__).resolve().parents[1] / "artifacts" / "model.onnx"
    if not onnx_path.exists():
        return
    assert onnx_path.stat().st_size > 1024
