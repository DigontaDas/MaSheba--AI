from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw"
PROCESSED_DIR = ROOT / "data" / "processed"
ARTIFACT_DIR = ROOT / "artifacts"
REPORT_DIR = ROOT / "reports"
CONFIG_DIR = ROOT / "config"

LABEL_ORDER = ["LOW", "MODERATE", "HIGH"]

FEATURE_ALIASES: dict[str, list[str]] = {
    "bp_systolic": ["systolicbp", "systolic_bp", "systolic blood pressure", "systolic"],
    "bp_diastolic": ["diastolicbp", "diastolic_bp", "diastolic blood pressure", "diastolic"],
    "weight_kg": ["weight", "weight_kg", "maternal weight", "mother weight", "ওজন"],
    "hemoglobin": ["hemoglobin", "haemoglobin", "hb", "hgb"],
    "gestational_age_weeks": [
        "gestational age",
        "gestational_age",
        "gestational_age_weeks",
        "gestational age weeks",
        "ga_weeks",
        "গর্ভকাল",
    ],
    "swelling_present": ["swelling", "edema", "oedema", "swelling_present"],
    "symptom_headache": ["headache"],
    "symptom_severe_headache": ["severe_headache", "severe headache"],
    "symptom_blurred_vision": ["blurred_vision", "blurred vision", "vision"],
    "symptom_dizziness": ["dizziness", "dizzy"],
    "symptom_fatigue": ["fatigue", "tired", "weakness"],
    "symptom_abdominal_pain": ["abdominal_pain", "abdominal pain", "stomach pain"],
}

LABEL_ALIASES = [
    "risklevel",
    "risk_level",
    "risk level",
    "high_risk",
    "high risk",
    "risk",
    "ঝুঁকিপূর্ণ গর্ভ",
    "ঝুকিপূর্ণ গর্ভ",
]

COMBINED_BP_ALIASES = ["blood pressure", "bp", "রক্ত চাপ"]


def ensure_dirs() -> None:
    for path in (PROCESSED_DIR, ARTIFACT_DIR, REPORT_DIR):
        path.mkdir(parents=True, exist_ok=True)


def normalize_name(name: str) -> str:
    return " ".join(name.strip().lower().replace("-", " ").replace("_", " ").split())


def compact_name(name: str) -> str:
    return normalize_name(name).replace(" ", "")


def find_column(columns: list[str], aliases: list[str]) -> str | None:
    normalized = {normalize_name(column): column for column in columns}
    compacted = {compact_name(column): column for column in columns}
    for alias in aliases:
        normalized_alias = normalize_name(alias)
        if normalized_alias in normalized:
            return normalized[normalized_alias]
        compacted_alias = compact_name(alias)
        if compacted_alias in compacted:
            return compacted[compacted_alias]
    return None


def find_label_column(columns: list[str]) -> str | None:
    return find_column(columns, LABEL_ALIASES)


def parse_number(value: Any) -> float | None:
    if value is None or pd.isna(value):
        return None
    match = re.search(r"(-?\d+(?:\.\d+)?)", str(value).strip())
    if not match:
        return None
    return float(match.group(1))


def parse_bp_pair(value: Any) -> tuple[float | None, float | None]:
    if value is None or pd.isna(value):
        return None, None
    match = re.search(r"(\d+(?:\.\d+)?)\s*/\s*(\d+(?:\.\d+)?)", str(value).strip())
    if match:
        return float(match.group(1)), float(match.group(2))
    single = parse_number(value)
    if single is None:
        return None, None
    return single, None


def extract_numeric_series(series: pd.Series) -> pd.Series:
    return series.map(parse_number)


def extract_bp_series(series: pd.Series) -> tuple[pd.Series, pd.Series]:
    parsed = series.map(parse_bp_pair)
    systolic = parsed.map(lambda value: value[0])
    diastolic = parsed.map(lambda value: value[1])
    return systolic, diastolic


def iter_source_files() -> list[Path]:
    if not RAW_DIR.exists():
        return []
    patterns = ["*.csv", "*.xlsx", "*.xls", "*.json"]
    files: list[Path] = []
    for pattern in patterns:
        files.extend(RAW_DIR.rglob(pattern))
    return sorted(files)


def read_table(path: Path) -> pd.DataFrame:
    suffix = path.suffix.lower()
    if suffix == ".csv":
        return pd.read_csv(path)
    if suffix in {".xlsx", ".xls"}:
        return pd.read_excel(path, header=1)
    if suffix == ".json":
        return pd.read_json(path)
    raise ValueError(f"Unsupported file type: {path}")


def map_label(value: Any) -> str | None:
    text = str(value).strip().lower()
    if not text or text == "nan":
        return None
    if text in {"0", "low", "low risk", "normal", "non high risk", "non-high-risk"}:
        return "LOW"
    if text in {"1", "mid", "mid risk", "medium", "moderate", "moderate risk"}:
        return "MODERATE"
    if text in {"2", "high", "high risk", "high-risk", "yes", "true"}:
        return "HIGH"
    return None


def to_numeric(series: pd.Series) -> pd.Series:
    return pd.to_numeric(series, errors="coerce")
