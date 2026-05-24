from __future__ import annotations

import logging
import re
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """তুমি মাশেবা — বাংলাদেশের গ্রামীণ মায়েদের জন্য একটি মাতৃস্বাস্থ্য সহায়তাকারী।

নিয়মাবলী:
১. শুধুমাত্র বাংলায় উত্তর দাও।
২. শুধুমাত্র গর্ভাবস্থা, প্রসব, মাতৃস্বাস্থ্য, নবজাতক যত্ন বিষয়ে প্রশ্নের উত্তর দাও।
৩. অন্য বিষয়ে প্রশ্ন করলে বলো: "আমি শুধু মাতৃস্বাস্থ্য বিষয়ে সাহায্য করতে পারি।"
৪. কোনো ওষুধের ডোজ বা নির্দিষ্ট রোগ নির্ণয় করবে না।
৫. গুরুতর লক্ষণ যেমন অতিরিক্ত রক্তপাত, খিঁচুনি, তীব্র মাথাব্যথা, চোখে ঝাপসা দেখা,
   শিশুর নড়াচড়া বন্ধ হলে — সবসময় বলো: "এখনই হাসপাতালে যান।"
৬. উত্তর সংক্ষিপ্ত রাখো — ২-৩ বাক্য। গ্রামীণ মহিলারা যেন সহজে বুঝতে পারেন।
৭. সর্বদা উষ্ণ ও সহানুভূতিশীল ভাষা ব্যবহার করো।"""

EMERGENCY_KEYWORDS = [
    "রক্তপাত",
    "খিঁচুনি",
    "মাথাব্যথা",
    "ঝাপসা",
    "নড়াচড়া বন্ধ",
    "জ্ঞান হারা",
    "শ্বাস",
    "বুকে ব্যথা",
]

SAFETY_SUFFIX = "\n\n⚠️ মনে রাখবেন: এটি শুধু তথ্য। গুরুতর সমস্যায় সবসময় স্বাস্থ্যকর্মী বা হাসপাতালে যান।"
BANGLA_CHAR_PATTERN = re.compile(r"[\u0980-\u09FF]")
SENTENCE_SPLIT_PATTERN = re.compile(r"(?<=[।!?])\s+")
GEMINI_MODELS = ["gemini-1.5-flash", "gemini-2.5-flash"]


async def get_chat_response(question: str) -> dict[str, Any]:
    settings = get_settings()
    normalized_question = question.strip()
    is_emergency = any(keyword in normalized_question for keyword in EMERGENCY_KEYWORDS)

    if settings.groq_api_key:
        try:
            response = await _call_groq(normalized_question, settings.groq_api_key)
            if response and _is_provider_answer_acceptable(response, normalized_question, is_emergency):
                return _build_response(response, is_emergency, "groq")
        except Exception as exc:  # pragma: no cover - provider instability is tested via fallback
            logger.warning("Groq chat failed: %s", exc)

    if settings.gemini_api_key:
        try:
            response = await _call_gemini(normalized_question, settings.gemini_api_key)
            if response and _is_provider_answer_acceptable(response, normalized_question, is_emergency):
                return _build_response(response, is_emergency, "gemini")
        except Exception as exc:  # pragma: no cover - provider instability is tested via fallback
            logger.warning("Gemini chat failed: %s", exc)

    return {
        "answer": "এই মুহূর্তে সংযোগ সমস্যা হচ্ছে। অফলাইন তথ্য ব্যবহার করুন।",
        "is_emergency": is_emergency,
        "source": "fallback",
        "emergency_text": "এখনই হাসপাতালে যান।" if is_emergency else None,
    }


async def _call_groq(question: str, api_key: str) -> str | None:
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": question},
        ],
        "max_tokens": 300,
        "temperature": 0.3,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
        )
    response.raise_for_status()
    body = response.json()
    choices = body.get("choices")
    if not isinstance(choices, list) or not choices:
        return None
    message = choices[0].get("message", {})
    content = message.get("content")
    return content if isinstance(content, str) else None


async def _call_gemini(question: str, api_key: str) -> str | None:
    async with httpx.AsyncClient(timeout=30.0) as client:
        for model_name in GEMINI_MODELS:
            generation_config: dict[str, Any] = {
                "temperature": 0.3,
                "maxOutputTokens": 300,
            }
            if model_name.startswith("gemini-2.5-"):
                generation_config["thinkingConfig"] = {"thinkingBudget": 0}

            payload = {
                "system_instruction": {
                    "parts": [{"text": SYSTEM_PROMPT}]
                },
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": question}]
                    }
                ],
                "generationConfig": generation_config,
            }
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
            response = await client.post(url, params={"key": api_key}, json=payload)
            if response.status_code == 404:
                continue
            response.raise_for_status()
            body = response.json()
            candidates = body.get("candidates")
            if not isinstance(candidates, list) or not candidates:
                return None

            parts = candidates[0].get("content", {}).get("parts", [])
            if not isinstance(parts, list) or not parts:
                return None

            text = parts[0].get("text")
            if not isinstance(text, str) or not text.strip():
                return None
            return text

    return None


def _build_response(answer: str, is_emergency: bool, source: str) -> dict[str, Any]:
    final_answer = _normalize_answer(answer)
    if not final_answer or not BANGLA_CHAR_PATTERN.search(final_answer):
        raise ValueError(f"{source} returned a non-Bangla or empty response")

    if is_emergency:
        if "হাসপাতালে" not in final_answer:
            final_answer = f"{final_answer}\n\n⚠️ এখনই হাসপাতালে যান।"
    elif SAFETY_SUFFIX.strip() not in final_answer:
        final_answer = f"{final_answer}{SAFETY_SUFFIX}"

    return {
        "answer": final_answer,
        "is_emergency": is_emergency,
        "source": source,
        "emergency_text": "এখনই হাসপাতালে যান।" if is_emergency else None,
    }


def _normalize_answer(answer: str) -> str:
    compact = " ".join(answer.strip().split())
    if not compact:
        return ""

    sentences = [segment.strip() for segment in SENTENCE_SPLIT_PATTERN.split(compact) if segment.strip()]
    if len(sentences) > 3:
        compact = " ".join(sentences[:3])

    return compact


def _is_provider_answer_acceptable(answer: str, question: str, is_emergency: bool) -> bool:
    normalized = _normalize_answer(answer)
    if not normalized or not BANGLA_CHAR_PATTERN.search(normalized):
        return False

    lowered = normalized.casefold()
    if "iud" in lowered or "json requested" in lowered:
        return False
    if "আমি বুঝতে পারলাম না" in normalized or "আপনার প্রশ্ন আমাকে" in normalized:
        return False

    if is_emergency:
        if "চা" in normalized or "কফি" in normalized:
            return False
        if "হাসপাতাল" not in normalized and "এখনই" not in normalized:
            return False

    return True
