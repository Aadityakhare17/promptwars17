import pytest
from fastapi.testclient import TestClient

from main import app, ChatRequest

client = TestClient(app)

def test_chat_endpoint_empty_prompt():
    """Test that empty prompts fail validation."""
    response = client.post("/api/chat", json={"prompt": ""})
    assert response.status_code == 422
    assert "String should have at least 1 character" in response.text

def test_chat_endpoint_too_long_prompt():
    """Test that excessively long prompts fail validation."""
    long_prompt = "a" * 1001
    response = client.post("/api/chat", json={"prompt": long_prompt})
    assert response.status_code == 422
    assert "String should have at most 1000 characters" in response.text

def test_chat_request_model_validation():
    """Unit test for Pydantic model directly."""
    # Valid model
    req = ChatRequest(prompt="Who is the PM of India?")
    assert req.prompt == "Who is the PM of India?"
    
    # Invalid model (should raise ValueError)
    with pytest.raises(ValueError):
        ChatRequest(prompt="")

# Note: We do not test the actual API calls to Gemini/Claude here to avoid 
# hitting quotas in CI/CD environments. A full integration test would mock httpx.AsyncClient.
