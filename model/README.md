# MaaSheba Risk Model

This directory owns the offline maternal risk classifier pipeline. It is intentionally
outside `mobile`, `backend`, `admin`, and `supabase`.

## Data Policy

- `csafrit2/maternal-health-risk-data` is a BP-centered numeric source. It has
  `Age`, `SystolicBP`, `DiastolicBP`, `BS`, `BodyTemp`, `HeartRate`, and `RiskLevel`.
  It does not cover MaaSheba's full app input surface.
- `ankurray00/maternal-health-and-high-risk-pregnancy-dataset` is the only v1
  candidate for weight, gestational age, anemia/hemoglobin, and other pregnancy
  indicators. Exact columns must be profiled after download.
- `nashrah18/maternalcareeng` is vocabulary reference only, not XGBoost training data.
- Mendeley `p5w98dvbbk/1` is optional manual external validation only.

No clinical feature may be silently zero-filled. If the datasets do not contain a
clinical feature, either keep it in deterministic mobile rules or stop the full learned
model path.

## Expected Commands

```powershell
kaggle datasets download -d csafrit2/maternal-health-risk-data -p model\data\raw\csafrit2 --unzip
kaggle datasets download -d ankurray00/maternal-health-and-high-risk-pregnancy-dataset -p model\data\raw\ankurray00 --unzip

python model\scripts\profile_sources.py
python model\scripts\prepare_dataset.py --allow-partial
python model\scripts\train_xgboost.py
python model\scripts\export_onnx.py
python model\scripts\validate_model.py
python model\scripts\benchmark_onnx.py
```

Use `--allow-partial` only when uncovered app inputs are intentionally handled by
deterministic rules in `mobile/src/model/riskModel.ts`.
