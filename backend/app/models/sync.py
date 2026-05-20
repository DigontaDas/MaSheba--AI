from datetime import datetime
from enum import StrEnum
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


RISK_LEVELS = {"LOW", "MODERATE", "HIGH"}
TOKEN_PATTERN = r"^[A-Za-z0-9._:-]+$"


class EventType(StrEnum):
    patient_upsert = "patient_upsert"
    visit_create = "visit_create"


class SyncStatus(StrEnum):
    synced = "SYNCED"
    duplicate = "DUPLICATE"
    failed = "FAILED"


class OutboxEvent(BaseModel):
    idempotency_key: str = Field(min_length=1, max_length=200, pattern=TOKEN_PATTERN)
    event_type: EventType
    device_id: str = Field(min_length=1, max_length=120, pattern=TOKEN_PATTERN)
    payload: dict[str, Any]

    @field_validator("payload")
    @classmethod
    def payload_requires_chw_id(cls, payload: dict[str, Any]) -> dict[str, Any]:
        if not payload.get("chw_id"):
            raise ValueError("payload.chw_id is required")
        _require_uuid(payload["chw_id"], "payload.chw_id")
        return payload

    @model_validator(mode="after")
    def validate_payload_shape(self) -> "OutboxEvent":
        if self.event_type == EventType.patient_upsert:
            _validate_patient_payload(self.payload, "payload")
        elif self.event_type == EventType.visit_create:
            _validate_visit_payload(self.payload)
        return self


class SyncRequest(BaseModel):
    events: list[OutboxEvent] = Field(min_length=1, max_length=100)


class SyncResult(BaseModel):
    idempotency_key: str
    status: Literal["SYNCED", "DUPLICATE", "FAILED"]
    error: str | None = None


class SyncResponse(BaseModel):
    results: list[SyncResult]
    synced_at: datetime


class HealthResponse(BaseModel):
    status: Literal["ok"]
    timestamp: datetime
    supabase_reachable: bool


class ErrorBody(BaseModel):
    code: str
    message: str
    details: dict[str, Any] | None = None


class ErrorResponse(BaseModel):
    error: ErrorBody

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid sync payload",
            }
        }
    })


def _require_uuid(value: Any, field_name: str) -> None:
    if not isinstance(value, str):
        raise ValueError(f"{field_name} must be a UUID string")
    try:
        UUID(value)
    except ValueError as exc:
        raise ValueError(f"{field_name} must be a valid UUID") from exc


def _require_string(value: Any, field_name: str, *, max_length: int) -> None:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field_name} is required")
    if len(value) > max_length:
        raise ValueError(f"{field_name} is too long")


def _require_int_range(value: Any, field_name: str, *, minimum: int, maximum: int) -> None:
    if not isinstance(value, int) or isinstance(value, bool):
        raise ValueError(f"{field_name} must be an integer")
    if value < minimum or value > maximum:
        raise ValueError(f"{field_name} is outside the allowed range")


def _require_number_range(value: Any, field_name: str, *, minimum: float, maximum: float) -> None:
    if not isinstance(value, int | float) or isinstance(value, bool):
        raise ValueError(f"{field_name} must be a number")
    if value < minimum or value > maximum:
        raise ValueError(f"{field_name} is outside the allowed range")


def _require_risk_level(value: Any, field_name: str) -> None:
    if value not in RISK_LEVELS:
        raise ValueError(f"{field_name} must be LOW, MODERATE, or HIGH")


def _validate_patient_payload(payload: dict[str, Any], prefix: str) -> None:
    _require_uuid(payload.get("patient_id"), f"{prefix}.patient_id")
    _require_string(payload.get("name"), f"{prefix}.name", max_length=120)
    _require_int_range(payload.get("age"), f"{prefix}.age", minimum=10, maximum=60)
    _require_int_range(
        payload.get("gestational_age_weeks"),
        f"{prefix}.gestational_age_weeks",
        minimum=1,
        maximum=45,
    )
    _require_risk_level(payload.get("last_risk_level"), f"{prefix}.last_risk_level")


def _validate_visit_payload(payload: dict[str, Any]) -> None:
    _require_uuid(payload.get("patient_id"), "payload.patient_id")
    if payload.get("visit_id") is not None:
        _require_uuid(payload["visit_id"], "payload.visit_id")
    _require_int_range(payload.get("bp_systolic"), "payload.bp_systolic", minimum=60, maximum=260)
    _require_int_range(payload.get("bp_diastolic"), "payload.bp_diastolic", minimum=30, maximum=180)
    _require_number_range(payload.get("weight_kg"), "payload.weight_kg", minimum=25, maximum=200)
    _require_number_range(payload.get("hemoglobin"), "payload.hemoglobin", minimum=3, maximum=20)
    if "swelling_present" in payload and not isinstance(payload["swelling_present"], bool):
        raise ValueError("payload.swelling_present must be a boolean")
    if "symptom_flags" in payload and not isinstance(payload["symptom_flags"], dict):
        raise ValueError("payload.symptom_flags must be an object")
    _require_risk_level(payload.get("risk_level"), "payload.risk_level")
    _require_string(payload.get("visited_at"), "payload.visited_at", max_length=40)
    try:
        datetime.fromisoformat(str(payload["visited_at"]).replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError("payload.visited_at must be an ISO8601 timestamp") from exc
    patient = payload.get("patient")
    if patient is not None:
        if not isinstance(patient, dict):
            raise ValueError("payload.patient must be an object")
        _validate_patient_payload(
            {
                **patient,
                "patient_id": payload["patient_id"],
            },
            "payload.patient",
        )
