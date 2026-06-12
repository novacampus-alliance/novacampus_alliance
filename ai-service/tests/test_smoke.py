from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["agent"] == "resolution-conflits-edt"


def test_llm_status():
    response = client.get("/api/v1/conflicts/llm/status")
    assert response.status_code == 200
    body = response.json()
    assert body["agent"] == "resolution-conflits-edt"
    assert "provider" in body
