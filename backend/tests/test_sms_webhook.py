from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import Settings


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_sms_alert_success(client: TestClient) -> None:
    payload = {
        "visit_id": "956b1219-aff5-42d4-bcca-75c4251b601d",
        "phone_number": "01712345678",
        "message": "সতর্কতা: উচ্চ রক্তচাপ রোগীর যত্ন নিন।"
    }
    
    # Under test default settings, Dispatch mock token will act as success
    response = client.post("/api/v1/alerts/sms", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["attempts"] == 1


@pytest.mark.asyncio
@patch("app.routers.sms_webhook._dispatch_to_telecom_gateway")
@patch("app.routers.sms_webhook._log_failure_to_supabase")
@patch("asyncio.sleep")
async def test_sms_alert_retries_and_fails(
    mock_sleep: AsyncMock,
    mock_log: AsyncMock,
    mock_dispatch: AsyncMock,
    client: TestClient
) -> None:
    # Set mock dispatch to always fail
    mock_dispatch.side_effect = Exception("Connection Timeout")
    
    payload = {
        "visit_id": "956b1219-aff5-42d4-bcca-75c4251b601d",
        "phone_number": "01712345678",
        "message": "সতর্কতা: উচ্চ রক্তচাপ"
    }
    
    # We call standard HTTP post (we bypass asyncio mocks if we run synchronously, so we run via async direct handler or client)
    # To test the async handler directly:
    from app.routers.sms_webhook import process_sms_webhook, SmsAlertPayload
    from fastapi import HTTPException
    
    fake_settings = Settings(
        SUPABASE_URL="https://example.supabase.co",
        SUPABASE_ANON_KEY="anon",
        SUPABASE_SERVICE_ROLE_KEY="service"
    )
    
    alert_payload = SmsAlertPayload(**payload)
    
    with pytest.raises(HTTPException) as excinfo:
        await process_sms_webhook(alert_payload, settings=fake_settings)
        
    assert excinfo.value.status_code == 502
    assert "SMS gateway failed after 3 attempts" in excinfo.value.detail
    
    # Check that dispatch was attempted exactly 3 times
    assert mock_dispatch.call_count == 3
    
    # Check that sleep was called 2 times (after attempt 1 and 2)
    assert mock_sleep.call_count == 2
    mock_sleep.assert_any_call(2.0) # 2.0^1
    mock_sleep.assert_any_call(4.0) # 2.0^2
    
    # Check that it was logged to Supabase
    mock_log.assert_called_once_with(alert_payload, "Connection Timeout", 3, fake_settings)
