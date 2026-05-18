"""
Gemini Text Polishing Utility

This module provides a single-purpose function to polish chatbot responses
using Google Gemini. It acts as a TEXT-ONLY enhancement layer.

CRITICAL CONSTRAINTS:
- Gemini ONLY rephrases text for naturalness
- Gemini NEVER changes fatigue decisions, logic, or workout recommendations
- If Gemini fails for any reason, original text is returned unchanged
- API key is loaded from environment variable GEMINI_API_KEY
- No sensitive data is logged or exposed

Usage:
    polished_text = polish_response("Your original chatbot response")
"""

import logging
import os
from typing import Optional

logger = logging.getLogger("neurofit.gemini")

# Load Gemini API key from environment (set via python-dotenv in main.py)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Import google.generativeai only if API key is available
_gemini_available = False
if GEMINI_API_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        _gemini_available = True
        logger.info("Gemini API configured successfully")
    except ImportError:
        logger.warning("google-generativeai not installed. Gemini polishing disabled.")
    except Exception as e:
        logger.warning("Failed to configure Gemini API: %s", e)
else:
    logger.info("GEMINI_API_KEY not set. Text polishing disabled.")


def polish_response(text: str, timeout_seconds: int = 5) -> str:
    """
    Polish a chatbot response text using Gemini for natural language improvement.

    This function:
    1. Takes a rule-based chatbot response (already correct in content)
    2. Uses Gemini to rephrase it more naturally
    3. Returns the original text if Gemini is unavailable or fails

    CRITICAL: This function ONLY improves wording. It does NOT:
    - Change fatigue assessments
    - Modify workout recommendations
    - Alter any domain logic or decisions
    - Add unsolicited advice

    Args:
        text: The chatbot response text to polish
        timeout_seconds: Maximum time to wait for API response

    Returns:
        Polished text if successful, original text if Gemini unavailable/fails
    """
    # If Gemini is not available, return original text
    if not _gemini_available or not GEMINI_API_KEY:
        return text

    # If text is empty or very short, skip polishing
    if not text or len(text) < 10:
        return text

    try:
        import google.generativeai as genai

        # Model configuration
        model = genai.GenerativeModel("gemini-1.5-flash")

        # Prompt: explicitly instructs Gemini to ONLY rewrite naturally
        # No logic changes, no additions, just rephrasing
        prompt = f"""You are a text polishing assistant for a fatigue-tracking fitness app.
Your ONLY job is to rewrite the following message to be more natural and conversational.

STRICT RULES:
1. Do NOT change the meaning or content
2. Do NOT add new information or advice
3. Do NOT alter any numbers, percentages, or technical details
4. Do NOT modify any recommendations or fatigue assessments
5. Keep the same tone and length
6. Only improve clarity and naturalness of wording

Original message:
{text}

Polished message (same meaning, better wording):"""

        # Call Gemini with timeout
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=500,
                temperature=0.7,
            ),
        )

        # Extract polished text
        polished_text = response.text.strip() if response.text else text

        # Sanity check: if polished text is vastly different in length, fallback
        # (prevents Gemini from hallucinating or adding content)
        original_len = len(text)
        polished_len = len(polished_text)

        if polished_len < original_len * 0.5 or polished_len > original_len * 2.5:
            logger.warning(
                "Polished text length suspicious (%.1f%% of original), using original",
                100 * polished_len / original_len,
            )
            return text

        logger.debug("Text polishing successful")
        return polished_text

    except Exception as e:
        # Log error but don't crash; return original text
        logger.warning("Gemini polishing failed, returning original text: %s", e)
        return text
