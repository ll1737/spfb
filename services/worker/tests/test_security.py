import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.core.security import decrypt_session, encrypt_session
from main import app, verify_token


def test_session_encryption_round_trip_uses_python312_safe_crypto():
    payload = {"cookies": [{"name": "sid", "value": "real-session"}]}

    encrypted = encrypt_session(payload)

    assert encrypted.count(":") == 2
    assert decrypt_session(encrypted) == payload


def test_worker_rejects_missing_authorization_header():
    with pytest.raises(HTTPException) as error:
        verify_token(None)

    assert error.value.status_code == 401


def test_worker_http_routes_reject_missing_authorization_header():
    response = TestClient(app).post('/worker/accounts/login', json={'platform': 'douyin'})

    assert response.status_code == 401


def test_invalid_session_ciphertext_is_rejected_without_exposing_raw_data():
    assert decrypt_session('invalid:ciphertext') is None
