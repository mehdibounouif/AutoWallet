import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class AIError(Exception):
    """The AI provider failed. `message` is safe to show to the user."""

    def __init__(self, code: str, message: str, status: int):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status = status


async def ask_llm(messages: list[dict]) -> str:
    """Send the conversation to the AI provider and return the answer text."""
    if not settings.ai_api_key:
        raise AIError("not_configured", "The AI assistant is not configured on this server.", 503)

    url = f"{settings.ai_base_url}/chat/completions"
    headers = {"Authorization": f"Bearer {settings.ai_api_key}"}
    body = {"model": settings.ai_model, "messages": messages}

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(url, headers=headers, json=body)
    except httpx.TimeoutException:
        raise AIError("timeout", "The AI took too long to answer. Please try again.", 504)
    except httpx.RequestError:
        raise AIError("unreachable", "The AI service can't be reached right now.", 503)

    if response.status_code != 200:
        logger.warning("AI provider answered %s: %s", response.status_code, response.text[:300])
    if response.status_code in (400, 401, 403):
        raise AIError("rejected", "The AI service refused our request. Check the API key and the model.", 502)
    if response.status_code == 429 or response.status_code >= 500:
        raise AIError("busy", "The AI service is busy right now. Please try again in a minute.", 503)
    if response.status_code != 200:
        raise AIError("error", f"The AI service answered with an error ({response.status_code}).", 502)

    try:
        return response.json()["choices"][0]["message"]["content"]
    except (ValueError, KeyError, IndexError, TypeError):
        raise AIError("bad_answer", "The AI service sent an answer we couldn't read.", 502)
