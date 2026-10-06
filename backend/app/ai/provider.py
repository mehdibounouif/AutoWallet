import httpx

from app.core.config import settings


async def ask_llm(messages: list[dict]) -> str:
    """Send the conversation to the AI provider and return the answer text."""
    url = f"{settings.ai_base_url}/chat/completions"
    headers = {"Authorization": f"Bearer {settings.ai_api_key}"}
    body = {"model": settings.ai_model, "messages": messages}

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(url, headers=headers, json=body)

    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"]
