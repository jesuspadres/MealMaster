# MealMaster AI Assistant Setup

## Overview
The AI Assistant uses Claude API to provide intelligent meal planning help, recipe suggestions, and cooking advice.

## Backend Setup

### 1. Install dependencies
```bash
pip install httpx --break-system-packages
```

### 2. Add to your main.py

Add the AI routes to your FastAPI application:

```python
# In main.py, add this import
from app.api.ai_assistant import init_ai_routes, router as ai_router

# After your existing route setup, add:
ai_routes = init_ai_routes(get_db, get_current_user)
app.include_router(ai_routes)
```

### 3. Set Environment Variable

Add your Anthropic API key to your environment:

```bash
# Linux/Mac
export ANTHROPIC_API_KEY="your-api-key-here"

# Windows
set ANTHROPIC_API_KEY=your-api-key-here

# Or add to .env file
ANTHROPIC_API_KEY=your-api-key-here
```

## API Endpoints

### POST /api/ai/chat
Main chat endpoint for conversational AI.

**Request:**
```json
{
  "message": "Plan me a week of healthy dinners",
  "conversation_history": []
}
```

**Response:**
```json
{
  "response": "Here's a week of healthy dinner ideas...",
  "conversation_id": null
}
```

### POST /api/ai/suggest-meals
Get structured meal plan suggestions.

**Query Parameters:**
- `preferences` (optional): User preferences like "quick meals" or "Italian food"
- `dietary_restrictions` (optional): Array like ["vegetarian", "gluten-free"]
- `num_days` (default: 7): Number of days to plan

### GET /api/ai/health
Check if AI service is configured.

## Frontend

The AI Chat component is available at:
- `src/components/AIChat.tsx`

It's integrated into App.tsx with a floating button (🤖) in the bottom-right corner.

## Features

1. **Conversational AI** - Natural chat interface for meal planning help
2. **Context Awareness** - AI knows about user's saved recipes
3. **Quick Prompts** - Pre-built suggestions to get started
4. **Conversation History** - Maintains context within a session
5. **Markdown Formatting** - Bold text and bullet points in responses

## Customization

### System Prompt
Edit the `SYSTEM_PROMPT` in `ai_assistant.py` to change the AI's personality and capabilities.

### Model
Currently uses `claude-sonnet-4-20250514`. Can be changed to other Claude models.

### Response Length
`max_tokens` is set to 1024. Increase for longer responses.
