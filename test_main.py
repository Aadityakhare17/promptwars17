import pytest
from fastapi.testclient import TestClient
from main import app, ChatRequest, RESPONSE_CACHE

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
    req = ChatRequest(prompt="Who is the PM of India?")
    assert req.prompt == "Who is the PM of India?"
    with pytest.raises(ValueError):
        ChatRequest(prompt="")

def test_security_headers():
    """Test that Security headers are applied to responses."""
    response = client.get("/")
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("X-Content-Type-Options") == "nosniff"

def test_caching_mechanism():
    """Test that the response cache stores and retrieves identical prompts."""
    # Inject a fake response into the cache
    RESPONSE_CACHE["What is EVM?"] = "Electronic Voting Machine test response."
    
    response = client.post("/api/chat", json={"prompt": "What is EVM?"})
    assert response.status_code == 200
    assert response.json()["response"] == "Electronic Voting Machine test response."
    
    # Clean up
    RESPONSE_CACHE.clear()

def test_serve_frontend():
    """Test that the frontend HTML is served at the root URL."""
    response = client.get("/")
    assert response.status_code == 200
    assert "<title>Democracy Guide | Election Assistant</title>" in response.text
