import logging
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# Hardcoded API keys as requested
# Note: In a real production environment, use a secret manager or env vars.
# #nosec B105
GEMINI_API_KEY = "AIzaSyCw6nmc1uMYJYaUpg2SdhHFM2jKplzQFRo"
CLAUDE_API_KEY = "YOUR_CLAUDE_API_KEY"
OPENAI_API_KEY = "YOUR_OPENAI_API_KEY"
PERPLEXITY_API_KEY = "YOUR_PERPLEXITY_API_KEY"
DEEPSEEK_API_KEY = "YOUR_DEEPSEEK_API_KEY"

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Reusable AsyncClient to pool connections efficiently
client = httpx.AsyncClient(timeout=10.0)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown
    await client.aclose()

app = FastAPI(title="DemocracyGuide AI Backend", lifespan=lifespan)

# Security: CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    """Pydantic model for incoming chat requests."""
    prompt: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="The user's prompt"
    )


class ChatResponse(BaseModel):
    """Pydantic model for chat responses."""
    response: str


async def call_gemini(prompt: str) -> str:
    """Call Google Gemini API asynchronously."""
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
    )
    system_prompt = (
        "You are an Indian Election Expert AI Assistant for "
        "'DemocracyGuide'. The user is asking: '{}'. Answer concisely, "
        "accurately, and politely in 2-3 sentences max."
    ).format(prompt)

    payload = {
        "contents": [{"parts": [{"text": system_prompt}]}]
    }
    response = await client.post(url, json=payload)
    response.raise_for_status()
    data = response.json()
    return data["candidates"][0]["content"]["parts"][0]["text"]


async def call_claude(prompt: str) -> str:
    """Call Anthropic Claude API asynchronously."""
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
    }
    system_prompt = (
        "You are an Indian Election Expert AI Assistant for "
        "'DemocracyGuide'. Answer concisely, accurately, and politely "
        "in 2-3 sentences max."
    )
    payload = {
        "model": "claude-3-haiku-20240307",
        "max_tokens": 1024,
        "system": system_prompt,
        "messages": [{"role": "user", "content": prompt}]
    }
    response = await client.post(url, json=payload, headers=headers)
    response.raise_for_status()
    return response.json()["content"][0]["text"]


async def call_openai(prompt: str) -> str:
    """Call OpenAI API asynchronously."""
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    system_prompt = (
        "You are an Indian Election Expert AI Assistant for "
        "'DemocracyGuide'. Answer concisely, accurately, and politely "
        "in 2-3 sentences max."
    )
    payload = {
        "model": "gpt-3.5-turbo",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
    }
    response = await client.post(url, json=payload, headers=headers)
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]


async def call_perplexity(prompt: str) -> str:
    """Call Perplexity API asynchronously."""
    url = "https://api.perplexity.ai/chat/completions"
    headers = {
        "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
        "Content-Type": "application/json"
    }
    system_prompt = (
        "You are an Indian Election Expert AI Assistant for "
        "'DemocracyGuide'. Answer concisely, accurately, and politely "
        "in 2-3 sentences max."
    )
    payload = {
        "model": "llama-3-sonar-small-32k-chat",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
    }
    response = await client.post(url, json=payload, headers=headers)
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]


async def call_deepseek(prompt: str) -> str:
    """Call DeepSeek API asynchronously."""
    url = "https://api.deepseek.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    system_prompt = (
        "You are an Indian Election Expert AI Assistant for "
        "'DemocracyGuide'. Answer concisely, accurately, and politely "
        "in 2-3 sentences max."
    )
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
    }
    response = await client.post(url, json=payload, headers=headers)
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]


@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Handle chat requests and implement a fallback cascade strategy.
    Tries Gemini -> Claude -> OpenAI -> Perplexity -> DeepSeek.
    """
    providers = [
        call_gemini,
        call_claude,
        call_openai,
        call_perplexity,
        call_deepseek
    ]

    for provider in providers:
        try:
            # We await the async provider functions
            response_text = await provider(request.prompt)
            logger.info("Successfully fetched response from %s",
                        provider.__name__)
            return ChatResponse(response=response_text)
        except httpx.HTTPStatusError as e:
            logger.warning("Provider %s HTTP error: %s", provider.__name__, e)
            continue
        except httpx.RequestError as e:
            logger.warning("Provider %s network error: %s",
                           provider.__name__, e)
            continue
        except Exception as e:
            logger.warning("Provider %s unexpected error: %s",
                           provider.__name__, e)
            continue

    # If all providers fail
    logger.error("All AI providers failed.")
    raise HTTPException(
        status_code=503,
        detail="Service Unavailable: All AI providers failed."
    )

@app.get("/")
async def serve_frontend():
    """Serve the main HTML file."""
    return FileResponse("index.html")

# Mount current directory to serve style.css and script.js
app.mount("/", StaticFiles(directory="."), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
