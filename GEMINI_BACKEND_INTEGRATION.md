# Gemini Backend Integration Guide

## Overview

Google Gemini has been integrated as a **server-side text polishing layer** for the NeuroFit+ backend. It provides natural language enhancement for chatbot responses while maintaining strict constraints on its role.

## Key Constraints

✅ **What Gemini DOES:**
- Rephrase text for better naturalness and clarity
- Improve wording and grammar
- Make responses more conversational

❌ **What Gemini DOES NOT:**
- Change fatigue assessments or predictions
- Modify workout recommendations
- Alter business logic or decision-making
- Add unsolicited advice or information

## Architecture

### Components

1. **`backend/app/gemini_utils.py`** - Utility module
   - Contains `polish_response(text: str) → str` function
   - Handles API communication with Gemini 1.5 Flash
   - Implements graceful fallback to original text on failure

2. **`backend/app/main.py`** - Main application
   - Loads environment variables via `python-dotenv`
   - Imports `polish_response` for use in endpoints

3. **`backend/.env`** - Environment configuration
   - Contains `GEMINI_API_KEY` (not committed to repo)
   - Loaded automatically at startup

4. **`backend/requirements.txt`** - Dependencies
   - `python-dotenv>=1.0.0` - Environment variable loading
   - `google-generativeai>=0.3.0` - Gemini API client

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Set Up API Key

Create or update `backend/.env`:

```env
GEMINI_API_KEY=your_actual_api_key_here
```

**Get your API key:**
- Visit https://aistudio.google.com/app/apikeys
- Create a new API key
- Paste it into `.env`

### 3. Verify Configuration

The environment variables are automatically loaded on startup:

```python
# In main.py
from dotenv import load_dotenv
load_dotenv()  # Loads backend/.env
```

## Usage

### Basic Usage

In any endpoint that returns chatbot messages:

```python
from .gemini_utils import polish_response

@app.post("/chatbot/message")
async def handle_chat_message(req: ChatRequest):
    # Step 1: Generate response using rule-based logic
    response_text = generate_rule_based_response(req)
    
    # Step 2: Polish the text (AFTER all logic is complete)
    polished_text = polish_response(response_text)
    
    # Step 3: Return polished response
    return {"message": polished_text}
```

### Behavior

- **If Gemini succeeds:** Returns naturally rephrased text
- **If Gemini fails:** Returns original text unchanged
- **If API key missing:** Returns original text unchanged
- **If google-generativeai not installed:** Returns original text unchanged

### Constraints

The `polish_response` function automatically:
- Times out after 5 seconds
- Validates output length (must be 50-250% of input)
- Falls back gracefully to original text on any error
- Logs warnings for debugging

## Security

### API Key Protection

✅ **Secure:**
- API key stored in `backend/.env` (not committed)
- Loaded via environment variable only
- Never exposed in code or logs
- Never sent to frontend

❌ **Insecure:**
- API key hardcoded in Python files
- API key exposed in API responses
- API key passed to frontend
- API key logged to stdout

### .gitignore Configuration

The `.gitignore` file is configured to exclude:
```
.env
.env.local
*.env
```

This prevents accidental commit of sensitive data.

## Testing

### Test Locally

1. **Start the backend:**
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. **Test the polish function** (Python console):
   ```python
   from app.gemini_utils import polish_response
   
   text = "Your fatigue level is high. You should rest."
   polished = polish_response(text)
   print(polished)
   ```

### Test Without API Key

If you don't have an API key yet:
- The system works normally
- `polish_response()` returns original text
- Logs show: "GEMINI_API_KEY not set. Text polishing disabled."
- No errors occur

### Monitor Logs

```bash
# Watch for Gemini-related logs
uvicorn app.main:app --reload 2>&1 | grep -i gemini
```

Expected output when enabled:
```
INFO:neurofit.gemini:Gemini API configured successfully
INFO:neurofit.gemini:Text polishing successful
```

## Configuration Reference

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | No | (unset) | Google Gemini API key |

### Model Configuration

- **Model:** `gemini-1.5-flash`
- **Max Output Tokens:** 500
- **Temperature:** 0.7 (balanced creativity)
- **Timeout:** 5 seconds

## Troubleshooting

### "GEMINI_API_KEY not set"

**Cause:** Environment variable not loaded
**Solution:**
1. Create `backend/.env` with your API key
2. Restart the backend server
3. Verify `load_dotenv()` is called in `main.py`

### "google-generativeai not installed"

**Cause:** Package not installed
**Solution:**
```bash
pip install google-generativeai>=0.3.0
```

### Polishing takes too long

**Cause:** API is slow or rate-limited
**Solution:**
- Requests timeout after 5 seconds
- Original text is returned
- Check Gemini API status
- Check rate limits

### Polished text is very different

**Cause:** Polished text length check failed (sanity check)
**Solution:**
- Original text is returned
- Check logs for length ratio
- This prevents hallucination

## Integration Checklist

- [x] `python-dotenv` added to requirements.txt
- [x] `google-generativeai` added to requirements.txt
- [x] `backend/app/gemini_utils.py` created
- [x] `load_dotenv()` added to main.py startup
- [x] `polish_response` imported in main.py
- [x] `.env` excluded in .gitignore
- [x] Usage pattern documented in main.py
- [x] Error handling and fallbacks implemented
- [x] Logging configured
- [x] Security constraints enforced

## Future Enhancements

Possible improvements (not implemented):
- Caching of polished responses
- A/B testing different prompt styles
- Metrics on polishing effectiveness
- Custom model selection per endpoint
- Rate limiting and quota management

## References

- [Google Generative AI Python Client](https://github.com/google-ai-python/google-generativeai-python)
- [Gemini API Documentation](https://ai.google.dev/)
- [python-dotenv Documentation](https://python-dotenv.readthedocs.io/)

## Support

For issues or questions:
1. Check logs for Gemini-related messages
2. Verify `backend/.env` contains valid API key
3. Test with `polish_response("test")` directly
4. Review constraints section to ensure usage pattern is correct
