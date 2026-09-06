# backend/services/translation_service.py

from __future__ import annotations

from typing import Any

import requests


GOOGLE_TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single"

SUPPORTED_LANGUAGES = {
    "en": "English",
    "hi": "Hindi",
    "or": "Odia",
    "bn": "Bengali",
    "as": "Assamese",
    "gu": "Gujarati",
    "kn": "Kannada",
    "ml": "Malayalam",
    "mr": "Marathi",
    "ne": "Nepali",
    "pa": "Punjabi",
    "ta": "Tamil",
    "te": "Telugu",
    "ur": "Urdu",
    "sa": "Sanskrit",
}


def get_supported_languages() -> list[dict[str, str]]:
    return [
        {
            "code": code,
            "name": name,
        }
        for code, name in SUPPORTED_LANGUAGES.items()
    ]


def translate_text(
    text: str,
    target_language: str = "en",
    source_language: str = "auto",
) -> dict[str, Any]:
    """
    Translate text using Google's public translation endpoint.

    Translation is treated as a presentation layer only. It does not
    generate or modify factual marine observations.
    """

    text = str(text or "").strip()
    target_language = str(target_language or "en").strip().lower()
    source_language = str(source_language or "auto").strip().lower()

    if not text:
        return {
            "status": "unavailable",
            "translated_text": "",
            "source_language": source_language,
            "target_language": target_language,
            "message": "No text was provided.",
        }

    if target_language not in SUPPORTED_LANGUAGES:
        return {
            "status": "unavailable",
            "translated_text": text,
            "source_language": source_language,
            "target_language": target_language,
            "message": "Target language is not supported.",
        }

    if source_language != "auto" and source_language not in SUPPORTED_LANGUAGES:
        source_language = "auto"

    if source_language == target_language:
        return {
            "status": "available",
            "translated_text": text,
            "source_language": source_language,
            "target_language": target_language,
            "message": "Translation was not required.",
        }

    try:
        response = requests.get(
            GOOGLE_TRANSLATE_URL,
            params={
                "client": "gtx",
                "sl": source_language,
                "tl": target_language,
                "dt": "t",
                "q": text,
            },
            timeout=10,
        )

        response.raise_for_status()

        payload = response.json()

        translated_parts = []

        if isinstance(payload, list) and payload:
            segments = payload[0]

            if isinstance(segments, list):
                for segment in segments:
                    if (
                        isinstance(segment, list)
                        and segment
                        and segment[0]
                    ):
                        translated_parts.append(
                            str(segment[0])
                        )

        translated_text = "".join(
            translated_parts
        ).strip()

        if not translated_text:
            return {
                "status": "unavailable",
                "translated_text": text,
                "source_language": source_language,
                "target_language": target_language,
                "message": "Translation service returned no text.",
            }

        detected_language = source_language

        if (
            isinstance(payload, list)
            and len(payload) > 2
            and payload[2]
        ):
            detected_language = str(
                payload[2]
            )

        return {
            "status": "available",
            "translated_text": translated_text,
            "source_language": detected_language,
            "target_language": target_language,
            "message": "Translation completed.",
        }

    except requests.RequestException as error:
        return {
            "status": "unavailable",
            "translated_text": text,
            "source_language": source_language,
            "target_language": target_language,
            "message": f"Translation service unavailable: {error}",
        }

    except (ValueError, TypeError, IndexError):
        return {
            "status": "unavailable",
            "translated_text": text,
            "source_language": source_language,
            "target_language": target_language,
            "message": "Translation response could not be processed.",
        }


def translate_fields(
    data: dict[str, Any],
    fields: list[str],
    target_language: str,
    source_language: str = "auto",
) -> dict[str, Any]:
    """
    Translate selected text fields while leaving all numerical and
    structured marine data unchanged.
    """

    result = dict(data)

    for field in fields:
        value = result.get(field)

        if not isinstance(value, str):
            continue

        translation = translate_text(
            text=value,
            target_language=target_language,
            source_language=source_language,
        )

        if translation.get("status") == "available":
            result[field] = translation.get(
                "translated_text",
                value,
            )

    return result