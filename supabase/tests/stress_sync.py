from __future__ import annotations

import os
import sys
import uuid
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / ".env")

CHW_A_ID = "00000000-0000-0000-0000-0000000000a1"
PATIENT_BASE = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-000000000000")
VISIT_BASE = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-000000000000")


def build_event(index: int) -> dict[str, Any]:
    patient_id = str(uuid.UUID(int=PATIENT_BASE.int + index))
    visit_id = str(uuid.UUID(int=VISIT_BASE.int + index))
    risk_level = ["LOW", "MODERATE", "HIGH"][index % 3]
    return {
        "idempotency_key": f"stress-{index:03d}-{patient_id}",
        "event_type": "visit_create",
        "device_id": "stress-device-a",
        "payload": {
            "chw_id": CHW_A_ID,
            "patient_id": patient_id,
            "visit_id": visit_id,
            "patient": {
                "name": f"Stress Patient {index:03d}",
                "age": 20 + (index % 15),
                "gestational_age_weeks": 12 + (index % 28),
                "last_risk_level": risk_level,
            },
            "bp_systolic": 110 + (index % 50),
            "bp_diastolic": 70 + (index % 25),
            "weight_kg": 48 + (index % 35),
            "hemoglobin": 8.5 + (index % 40) / 10,
            "swelling_present": index % 5 == 0,
            "symptom_flags": {"headache": index % 7 == 0},
            "risk_level": risk_level,
            "visited_at": datetime.now(UTC).isoformat(),
        },
    }


def post_batch(url: str, token: str, events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    response = httpx.post(
        url,
        headers={"Authorization": f"Bearer {token}"},
        json={"events": events},
        timeout=60,
    )
    response.raise_for_status()
    payload = response.json()
    return payload["results"]


def print_summary(label: str, results: list[dict[str, Any]]) -> None:
    counts = Counter(result["status"] for result in results)
    print(f"{label}: {dict(counts)}")
    for result in results:
        suffix = f" error={result.get('error')}" if result.get("error") else ""
        print(f"{label} {result['idempotency_key']} -> {result['status']}{suffix}")


def main() -> int:
    url = os.getenv("FASTAPI_SYNC_URL", "http://127.0.0.1:8000/sync")
    token = os.getenv("CHW_A_AUTH_TOKEN")
    if not token:
        print("FAIL: CHW_A_AUTH_TOKEN is required for live stress sync verification.")
        return 2

    events = [build_event(index) for index in range(50)]

    first = post_batch(url, token, events)
    print_summary("FIRST_PASS", first)
    first_counts = Counter(result["status"] for result in first)
    if first_counts["SYNCED"] != 50:
        print(f"FAIL: expected 50 SYNCED, got {dict(first_counts)}")
        return 1

    second = post_batch(url, token, events)
    print_summary("SECOND_PASS", second)
    second_counts = Counter(result["status"] for result in second)
    if second_counts["DUPLICATE"] != 50:
        print(f"FAIL: expected 50 DUPLICATE, got {dict(second_counts)}")
        return 1

    print("PASS: 50/50 SYNCED first pass and 50/50 DUPLICATE second pass.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
