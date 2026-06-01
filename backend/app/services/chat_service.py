from __future__ import annotations

import logging
import re
from dataclasses import dataclass
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
GEMINI_MODELS = ["gemini-2.5-flash", "gemini-1.5-flash"]

RiskLevel = str


@dataclass(frozen=True)
class MaternalTriage:
    risk_level: RiskLevel
    matched_risk: str
    red_flags: list[str]
    recommended_action: str
    answer: str


POSTPARTUM_BLEEDING_RED_FLAGS = [
    "১ ঘন্টায় ১টি বা তার বেশি প্যাড পুরো ভিজে যাওয়া",
    "ডিমের চেয়ে বড় রক্তের দলা বা টিস্যু বের হওয়া",
    "মাথা ঘোরা, অজ্ঞান হওয়া, বা খুব দুর্বল লাগা",
    "জ্বর, দুর্গন্ধযুক্ত স্রাব, বা তীব্র পেট ব্যথা",
    "রক্তপাত কমার বদলে বাড়তে থাকা",
]

POSTPARTUM_BLEEDING_ANSWER = (
    "আপা, প্রসবের পর হালকা রক্তপাত কিছুদিন স্বাভাবিক হতে পারে, কিন্তু বেশি রক্তপাত বিপদের লক্ষণ হতে পারে। "
    "যদি ১ ঘন্টায় ১টি বা তার বেশি প্যাড পুরো ভিজে যায়, বড় রক্তের দলা বা টিস্যু বের হয়, মাথা ঘোরে/অজ্ঞান লাগে, খুব দুর্বল লাগে, জ্বর বা দুর্গন্ধযুক্ত স্রাব থাকে, পেট খুব ব্যথা করে, অথবা রক্তপাত কমার বদলে বাড়ে, তাহলে এখনই হাসপাতালে বা স্বাস্থ্যকেন্দ্রে যান। "
    "এগুলোর কোনোটি না থাকলেও পরিষ্কার প্যাড ব্যবহার করুন, কিছু যোনিপথে ঢোকাবেন না, বিশ্রাম নিন, পানি পান করুন, এবং আজই স্বাস্থ্যকর্মীকে জানান।"
)

PREGNANCY_BLEEDING_ANSWER = (
    "গর্ভাবস্থায় যোনিপথে রক্ত যাওয়া বিপদের লক্ষণ হতে পারে। "
    "পরিষ্কার প্যাড ব্যবহার করুন, যোনিপথে কিছু ঢোকাবেন না, এবং এখনই নিকটস্থ হাসপাতাল বা স্বাস্থ্যকেন্দ্রে যান।"
)

SEVERE_HEADACHE_ANSWER = (
    "তীব্র মাথাব্যথা, চোখে ঝাপসা দেখা, খিঁচুনি, বা মুখ-হাত ফুলে যাওয়া গর্ভাবস্থা বা প্রসবের পরে বিপদের লক্ষণ হতে পারে। "
    "এগুলোর কোনোটি থাকলে দেরি না করে এখনই হাসপাতালে বা স্বাস্থ্যকেন্দ্রে যান।"
)

INFECTION_AFTER_BIRTH_ANSWER = (
    "প্রসবের পরে জ্বরের সঙ্গে দুর্গন্ধযুক্ত স্রাব, তীব্র পেট ব্যথা, বা শরীর কাঁপা সংক্রমণের লক্ষণ হতে পারে। "
    "আজই স্বাস্থ্যকর্মী বা চিকিৎসকের সাথে যোগাযোগ করুন; জ্বর বেশি, দুর্বলতা বেশি, বা ব্যথা বাড়লে এখনই হাসপাতালে যান।"
)


def _contains_any(text: str, terms: tuple[str, ...]) -> bool:
    return any(term in text for term in terms)


def _normalize_question_for_triage(question: str) -> str:
    normalized = question.casefold()
    normalized = re.sub(r"[\u09E6-\u09EF]", lambda match: str(ord(match.group(0)) - ord("০")), normalized)
    normalized = re.sub(r"[^a-z0-9\u0980-\u09FF]+", " ", normalized)
    return f" {' '.join(normalized.split())} "


def _detect_maternal_triage(question: str) -> MaternalTriage | None:
    text = _normalize_question_for_triage(question)

    postpartum_terms = (
        " প্রসব ", " প্রসবের ", " প্রসব পর ", " প্রসবের পর ", " ডেলিভারি ", " বাচ্চা হয়েছে ",
        " proshob ", " proshob er ", " prosob ", " prosab ", " delivery ", " birth ", " after birth ",
        " baccha hoyeche ", " baby hoyeche ", " postpartum ",
    )
    bleeding_terms = (
        " রক্ত ", " রক্তপাত ", " রক্ত যাচ্ছে ", " ব্লিডিং ", " bleeding ", " blood ", " rokto ",
        " rakto ", " rokt ", " bleed ", " jacche ", " jaitese ", " ber hocche ", " ber hochhe ",
    )
    heavy_bleeding_terms = (
        " অনেক রক্ত ", " বেশি রক্ত ", " অতিরিক্ত রক্তপাত ", " heavy bleeding ", " beshi rokto ",
        " onek rokto ", " 2 pad ", " দুই প্যাড ", " প্যাড ভিজে ", " pad vije ", " pad bhije ",
        " clot ", " clots ", " দলা ", " dola ", " tissue ", " টিস্যু ",
    )
    dizziness_terms = (
        " মাথা ঘোরা ", " মাথা ঘুরছে ", " অজ্ঞান ", " দুর্বল ", " dizziness ", " dizzy ",
        " matha ghura ", " matha ghurche ", " ojan ", " durbol ",
    )
    fever_terms = (" জ্বর ", " fever ", " jor ", " jhor ")
    bad_discharge_terms = (
        " দুর্গন্ধ ", " গন্ধ ", " bad smell ", " foul ", " gondho ", " durgondho ", " discharge ",
        " স্রাব ", " srab ",
    )
    headache_terms = (" মাথাব্যথা ", " মাথা ব্যথা ", " headache ", " matha betha ", " mathabetha ")
    vision_terms = (" ঝাপসা ", " চোখে ", " blurred ", " vision ", " chokh ", " jhapsha ")
    seizure_terms = (" খিঁচুনি ", " seizure ", " convulsion ", " khichuni ")
    breathing_terms = (" শ্বাস ", " বুক ব্যথা ", " chest pain ", " breathing ", " shash ", " buk betha ")
    fetal_movement_terms = (" নড়াচড়া বন্ধ ", " নড়াচড়া বন্ধ ", " movement stopped ", " baby moving less ", " baccha norche na ")
    belly_pain_terms = (" তীব্র পেট ব্যথা ", " severe belly pain ", " pet betha ", " pete betha ")

    has_postpartum = _contains_any(text, postpartum_terms)
    has_bleeding = _contains_any(text, bleeding_terms)
    has_heavy_bleeding = _contains_any(text, heavy_bleeding_terms)
    has_dizziness = _contains_any(text, dizziness_terms)
    has_fever_bad_discharge = _contains_any(text, fever_terms) and _contains_any(text, bad_discharge_terms)

    if has_postpartum and has_bleeding:
        risk_level = "emergency_now" if has_heavy_bleeding or has_dizziness or has_fever_bad_discharge else "urgent_today"
        action = "এখনই হাসপাতালে বা স্বাস্থ্যকেন্দ্রে যান।" if risk_level == "emergency_now" else "আজই স্বাস্থ্যকর্মীকে জানান; কোনো বিপদচিহ্ন থাকলে এখনই হাসপাতালে যান।"
        return MaternalTriage(
            risk_level=risk_level,
            matched_risk="postpartum_bleeding",
            red_flags=POSTPARTUM_BLEEDING_RED_FLAGS,
            recommended_action=action,
            answer=POSTPARTUM_BLEEDING_ANSWER,
        )

    if has_bleeding and has_heavy_bleeding:
        return MaternalTriage(
            risk_level="emergency_now",
            matched_risk="heavy_maternal_bleeding",
            red_flags=POSTPARTUM_BLEEDING_RED_FLAGS,
            recommended_action="এখনই হাসপাতালে বা স্বাস্থ্যকেন্দ্রে যান।",
            answer=POSTPARTUM_BLEEDING_ANSWER,
        )

    if has_bleeding and has_dizziness:
        return MaternalTriage(
            risk_level="emergency_now",
            matched_risk="bleeding_with_dizziness",
            red_flags=POSTPARTUM_BLEEDING_RED_FLAGS,
            recommended_action="এখনই হাসপাতালে বা স্বাস্থ্যকেন্দ্রে যান।",
            answer=POSTPARTUM_BLEEDING_ANSWER,
        )

    if has_bleeding and _contains_any(text, (" গর্ভ ", " pregnant ", " pregnancy ", " gorv ", " gorbh ", " garv ")):
        return MaternalTriage(
            risk_level="emergency_now",
            matched_risk="pregnancy_bleeding",
            red_flags=["গর্ভাবস্থায় যোনিপথে রক্তপাত", "ব্যথা, মাথা ঘোরা, বা দুর্বলতা", "পানি ভাঙা বা দুর্গন্ধযুক্ত স্রাব"],
            recommended_action="এখনই হাসপাতালে বা স্বাস্থ্যকেন্দ্রে যান।",
            answer=PREGNANCY_BLEEDING_ANSWER,
        )

    if _contains_any(text, seizure_terms) or _contains_any(text, breathing_terms) or _contains_any(text, fetal_movement_terms):
        return MaternalTriage(
            risk_level="emergency_now",
            matched_risk="maternal_danger_sign",
            red_flags=["খিঁচুনি", "শ্বাসকষ্ট বা বুক ব্যথা", "শিশুর নড়াচড়া কমে যাওয়া বা বন্ধ হওয়া"],
            recommended_action="এখনই হাসপাতালে বা স্বাস্থ্যকেন্দ্রে যান।",
            answer="এই লক্ষণটি বিপদের হতে পারে। দেরি না করে এখনই নিকটস্থ হাসপাতাল বা স্বাস্থ্যকেন্দ্রে যান।",
        )

    if _contains_any(text, headache_terms) and (_contains_any(text, vision_terms) or has_dizziness):
        return MaternalTriage(
            risk_level="emergency_now",
            matched_risk="severe_headache_or_vision",
            red_flags=["তীব্র মাথাব্যথা", "চোখে ঝাপসা দেখা", "মাথা ঘোরা বা অজ্ঞান লাগা"],
            recommended_action="এখনই হাসপাতালে বা স্বাস্থ্যকেন্দ্রে যান।",
            answer=SEVERE_HEADACHE_ANSWER,
        )

    if has_fever_bad_discharge or (_contains_any(text, fever_terms) and _contains_any(text, belly_pain_terms)):
        return MaternalTriage(
            risk_level="urgent_today",
            matched_risk="postpartum_or_maternal_infection",
            red_flags=["জ্বর", "দুর্গন্ধযুক্ত স্রাব", "তীব্র পেট ব্যথা বা কাঁপুনি"],
            recommended_action="আজই স্বাস্থ্যকর্মী বা চিকিৎসকের সাথে যোগাযোগ করুন।",
            answer=INFECTION_AFTER_BIRTH_ANSWER,
        )

    return None


async def get_chat_response(question: str, system_prompt: str | None = None) -> dict[str, Any]:
    settings = get_settings()
    normalized_question = question.strip()
    triage = _detect_maternal_triage(normalized_question)
    if triage:
        return _build_triage_response(triage)

    is_emergency = any(keyword in normalized_question for keyword in EMERGENCY_KEYWORDS)

    # 1. Fetch RAG Context from Supabase pgvector using HuggingFace sentence-transformers
    rag_context = ""
    try:
        embedding = await _get_hf_embedding(normalized_question, settings.hf_api_key)
        if embedding:
            chunks = await _fetch_rag_guidelines(
                embedding, 
                str(settings.supabase_url), 
                settings.supabase_service_role_key
            )
            if chunks:
                rag_context = "\n\nমাতৃস্বাস্থ্য নির্দেশিকা রেফারেন্স (WHO & DGHS Guidelines):\n" + "\n".join(f"- {chunk}" for chunk in chunks)
    except Exception as e:
        logger.warning("RAG pipeline error: %s", e)

    prompt = system_prompt.strip() if system_prompt and system_prompt.strip() else SYSTEM_PROMPT
    if rag_context:
        prompt = f"{prompt}{rag_context}"

    if settings.groq_api_key:
        try:
            response = await _call_groq(normalized_question, settings.groq_api_key, prompt)
            if response and _is_provider_answer_acceptable(response, normalized_question, is_emergency):
                return _build_response(response, is_emergency, "groq")
        except Exception as exc:  # pragma: no cover - provider instability is tested via fallback
            logger.warning("Groq chat failed: %s", exc)

    if settings.gemini_api_key:
        try:
            response = await _call_gemini(normalized_question, settings.gemini_api_key, prompt)
            if response and _is_provider_answer_acceptable(response, normalized_question, is_emergency):
                return _build_response(response, is_emergency, "gemini")
        except Exception as exc:  # pragma: no cover - provider instability is tested via fallback
            logger.warning("Gemini chat failed: %s", exc)

    return {
        "answer": "এই মুহূর্তে সংযোগ সমস্যা হচ্ছে। অফলাইন তথ্য ব্যবহার করুন।",
        "is_emergency": is_emergency,
        "source": "fallback",
        "emergency_text": "এখনই হাসপাতালে যান।" if is_emergency else None,
        "risk_level": "emergency_now" if is_emergency else "self_care_with_warning",
        "matched_risk": "keyword_emergency" if is_emergency else None,
        "red_flags": [],
        "recommended_action": "এখনই হাসপাতালে বা স্বাস্থ্যকেন্দ্রে যান।" if is_emergency else None,
    }


async def _call_groq(question: str, api_key: str, system_prompt: str = SYSTEM_PROMPT) -> str | None:
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "system", "content": system_prompt},
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


async def _call_gemini(question: str, api_key: str, system_prompt: str = SYSTEM_PROMPT) -> str | None:
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
                    "parts": [{"text": system_prompt}]
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
        "risk_level": "emergency_now" if is_emergency else "self_care_with_warning",
        "matched_risk": "keyword_emergency" if is_emergency else None,
        "red_flags": [],
        "recommended_action": "এখনই হাসপাতালে বা স্বাস্থ্যকেন্দ্রে যান।" if is_emergency else None,
    }


def _build_triage_response(triage: MaternalTriage) -> dict[str, Any]:
    return {
        "answer": triage.answer,
        "is_emergency": triage.risk_level in ("emergency_now", "urgent_today"),
        "source": "safety-rules",
        "emergency_text": "এখনই হাসপাতালে যান।" if triage.risk_level == "emergency_now" else None,
        "risk_level": triage.risk_level,
        "matched_risk": triage.matched_risk,
        "red_flags": triage.red_flags,
        "recommended_action": triage.recommended_action,
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
    unsafe_terms = ("iud", "json requested", "রক্ত সংগ্রহ", "blood collect", "collect blood")
    if any(term in lowered for term in unsafe_terms):
        return False
    if "আমি বুঝতে পারলাম না" in normalized or "আপনার প্রশ্ন আমাকে" in normalized:
        return False

    if is_emergency:
        if "চা" in normalized or "কফি" in normalized:
            return False
        if "হাসপাতাল" not in normalized and "এখনই" not in normalized:
            return False

    return True


async def get_voice_chat_response(base64_audio: str, mime_type: str) -> dict[str, Any]:
    import json
    settings = get_settings()
    
    # Gemini API does not natively support audio/m4a or audio/x-m4a.
    # Normalize these to audio/mp4 for API compatibility.
    normalized_mime = mime_type.lower() if mime_type else "audio/mp4"
    if normalized_mime in ("audio/m4a", "audio/x-m4a"):
        normalized_mime = "audio/mp4"
    
    if not settings.gemini_api_key:
        return {
            "transcription": "",
            "symptoms": [],
            "answer": "এই মুহূর্তে এআই সার্ভিসটি কনফিগার করা নেই। অনুগ্রহ করে অ্যাডমিন কি সেট আপ করুন।",
            "is_emergency": False,
            "source": "fallback"
        }

    system_prompt = """তুমি মাশেবা — বাংলাদেশের গ্রামীণ মায়েদের জন্য একটি মাতৃস্বাস্থ্য সহায়তাকারী।

নিয়মাবলী:
১. শুধুমাত্র বাংলায় উত্তর দাও।
২. শুধুমাত্র গর্ভাবস্থা, প্রসব, মাতৃস্বাস্থ্য, নবজাতক যত্ন বিষয়ে প্রশ্নের উত্তর দাও।
৩. ওষুধের ডোজ বা নির্দিষ্ট রোগ নির্ণয় করবে না।
৪. গুরুতর লক্ষণ যেমন অতিরিক্ত রক্তপাত, খিঁচুনি, তীব্র মাথাব্যথা, চোখে ঝাপসা দেখা, শিশুর নড়াচড়া বন্ধ হলে — হাসপাতালে যাওয়ার পরামর্শ দাও এবং is_emergency কে true করো।
৫. সর্বদা উষ্ণ ও সহানুভূতিশীল ভাষা ব্যবহার করো।

আউটপুট অবশ্যই একটি JSON অবজেক্ট হতে হবে যার কীগুলি নিম্নরূপ:
- "transcription": অডিওতে বলা কথার হুবহু প্রতিলিপি (যে ভাষায় কথা বলা হয়েছে - বাংলা বা ইংরেজি)।
- "symptoms": অডিওতে উল্লেখিত গর্ভাবস্থার ঝুঁকির লক্ষণগুলির তালিকা (ইংরেজি enum এ: "headache", "blurred_vision", "convulsions", "severe_bleeding", "severe_abdominal_pain", "decreased_fetal_movement", "swelling", "fever")।
- "answer": মায়েদের জন্য একটি উষ্ণ, সহানুভূতিশীল ও স্পষ্ট ২-৩ বাক্যের বাংলা উত্তর।
- "is_emergency": গুরুতর লক্ষণ থাকলে true, অন্যথায় false।
"""

    generation_config = {
        "temperature": 0.3,
        "responseMimeType": "application/json",
    }

    payload = {
        "system_instruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "inlineData": {
                            "mimeType": normalized_mime,
                            "data": base64_audio
                        }
                    },
                    {
                        "text": "অনুগ্রহ করে এই অডিও ফাইলটি বিশ্লেষণ করে উপরে উল্লেখিত JSON ফরম্যাটে উত্তর দিন।"
                    }
                ]
            }
        ],
        "generationConfig": generation_config,
    }

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(url, params={"key": settings.gemini_api_key}, json=payload)
            response.raise_for_status()
            body = response.json()
            
            candidates = body.get("candidates")
            if not isinstance(candidates, list) or not candidates:
                raise ValueError("No candidates returned from Gemini")

            parts = candidates[0].get("content", {}).get("parts", [])
            if not isinstance(parts, list) or not parts:
                raise ValueError("No parts returned from Gemini")

            text_output = parts[0].get("text")
            if not text_output:
                raise ValueError("Empty text returned from Gemini")

            # Strip markdown formatting wrappers defensively (e.g., ```json ... ```)
            cleaned_json = text_output.strip()
            if cleaned_json.startswith("```"):
                cleaned_json = re.sub(r"^```(?:json)?\n|```$", "", cleaned_json, flags=re.MULTILINE).strip()

            parsed = json.loads(cleaned_json)
            
            # Defensive check & safety suffix if not present
            transcription = parsed.get("transcription", "")
            answer = parsed.get("answer", "")
            is_emergency = bool(parsed.get("is_emergency", False))
            triage = _detect_maternal_triage(transcription)
            if triage:
                triage_response = _build_triage_response(triage)
                return {
                    "transcription": transcription,
                    "symptoms": parsed.get("symptoms", []),
                    "answer": triage_response["answer"],
                    "is_emergency": triage_response["is_emergency"],
                    "source": "gemini-voice+safety-rules",
                    "risk_level": triage_response["risk_level"],
                    "matched_risk": triage_response["matched_risk"],
                    "red_flags": triage_response["red_flags"],
                    "recommended_action": triage_response["recommended_action"],
                }
            
            if is_emergency:
                if "হাসপাতালে" not in answer:
                    answer = f"{answer}\n\n⚠️ এখনই হাসপাতালে যান।"
            elif SAFETY_SUFFIX.strip() not in answer:
                answer = f"{answer}{SAFETY_SUFFIX}"

            return {
                "transcription": transcription,
                "symptoms": parsed.get("symptoms", []),
                "answer": answer,
                "is_emergency": is_emergency,
                "source": "gemini-voice",
                "risk_level": "emergency_now" if is_emergency else "self_care_with_warning",
                "matched_risk": "voice_model_emergency" if is_emergency else None,
                "red_flags": [],
                "recommended_action": "এখনই হাসপাতালে বা স্বাস্থ্যকেন্দ্রে যান।" if is_emergency else None,
            }
    except Exception as exc:
        logger.error("Gemini voice parsing failed: %s", exc)
        return {
            "transcription": "অডিও ফাইলটি বিশ্লেষণ করা সম্ভব হয়নি।",
            "symptoms": [],
            "answer": "দুঃখিত, এই মুহূর্তে ভয়েস এআই এর মাধ্যমে অডিওটি বিশ্লেষণ করতে সমস্যা হচ্ছে। অনুগ্রহ করে লিখে প্রশ্ন করুন।",
            "is_emergency": False,
            "source": "fallback-voice"
        }


async def _get_hf_embedding(text: str, api_key: str | None = None) -> list[float] | None:
    url = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2"
    headers = {}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    
    payload = {"inputs": text}
    
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.post(url, headers=headers, json=payload)
        
        if response.status_code == 200:
            res = response.json()
            if isinstance(res, list) and len(res) > 0 and isinstance(res[0], float):
                return res
            elif isinstance(res, list) and len(res) > 0 and isinstance(res[0], list):
                return res[0]
        elif response.status_code == 503 or "loading" in response.text.lower():
            logger.warning("HuggingFace model is loading. Skipping RAG context.")
            return None
        else:
            logger.warning("HuggingFace embedding failed: %s", response.text)
            return None
    except Exception as exc:
        logger.warning("Failed to call HuggingFace embedding API: %s", exc)
        return None


async def _fetch_rag_guidelines(embedding: list[float], supabase_url: str, supabase_key: str) -> list[str]:
    url = f"{supabase_url.rstrip('/')}/rest/v1/rpc/match_guidelines"
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "query_embedding": embedding,
        "match_threshold": 0.4,
        "match_count": 3
    }
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(url, headers=headers, json=payload)
        if response.status_code == 200:
            results = response.json()
            if isinstance(results, list):
                return [r.get("content") for r in results if isinstance(r, dict) and r.get("content")]
        else:
            logger.warning("Supabase RAG matching failed (HTTP %s): %s", response.status_code, response.text)
    except Exception as exc:
        logger.warning("Failed to fetch pgvector matching guidelines: %s", exc)
    return []
