from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional, List
import os
import json
import httpx
import re

from app.database.config import get_db
from app.services.auth import get_current_user
from app.models.user import User

router = APIRouter()

SPOONACULAR_API_KEY = os.getenv("SPOONACULAR_API_KEY")


class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatMessage]] = []


class RecipeCard(BaseModel):
    id: int
    title: str
    image: str
    readyInMinutes: Optional[int] = None
    servings: Optional[int] = None


class ChatResponse(BaseModel):
    response: str
    recipes: Optional[List[RecipeCard]] = None
    conversation_id: Optional[str] = None


SYSTEM_PROMPT = """You are MealMaster AI, a friendly and knowledgeable culinary assistant. You help users with:

1. **Meal Planning**: Suggest meals for the week based on dietary preferences, time constraints, and nutritional goals
2. **Recipe Ideas**: Recommend recipes based on available ingredients, cuisine preferences, or dietary restrictions
3. **Cooking Tips**: Provide cooking techniques, substitutions, and kitchen hacks
4. **Nutritional Guidance**: Offer general nutritional information about meals and ingredients
5. **Meal Prep Advice**: Help with batch cooking and meal preparation strategies

Your personality:
- Enthusiastic about food and cooking
- Practical and helpful
- Encouraging to beginners
- Knowledgeable but not preachy

Guidelines:
- Keep text responses concise (2-4 sentences max when suggesting recipes)
- The system will automatically show recipe cards below your message, so don't list specific recipes
- Instead, give a brief, friendly intro like "Here are some great options for you!" or "These should be perfect for a quick weeknight dinner!"
- Use emojis sparingly to add personality (🍳, 🥗, 🍝, etc.)
- If asked about medical/allergy advice, recommend consulting a healthcare professional
- For general cooking questions (not recipe requests), give helpful detailed answers"""


# Keywords that indicate user wants recipe suggestions
RECIPE_KEYWORDS = [
    'recipe', 'recipes', 'make', 'cook', 'dinner', 'lunch', 'breakfast', 
    'meal', 'meals', 'dish', 'dishes', 'food', 'eat', 'eating', 'hungry',
    'suggest', 'suggestion', 'idea', 'ideas', 'recommend', 'what can i',
    'what should i', 'give me', 'show me', 'find me', 'healthy', 'quick',
    'easy', 'vegetarian', 'vegan', 'chicken', 'beef', 'pasta', 'salad',
    'soup', 'dessert', 'snack', 'protein', 'low carb', 'keto', 'diet'
]


def should_search_recipes(message: str) -> bool:
    """Determine if the user's message is asking for recipes"""
    message_lower = message.lower()
    return any(keyword in message_lower for keyword in RECIPE_KEYWORDS)


def extract_search_query(message: str) -> str:
    """Extract a good search query from the user's message"""
    # Remove common filler words
    filler_words = ['can', 'you', 'please', 'i', 'me', 'some', 'a', 'the', 'for', 
                   'what', 'give', 'show', 'find', 'suggest', 'recommend', 'want',
                   'need', 'looking', 'searching', 'any', 'good', 'best', 'make',
                   'cook', 'recipe', 'recipes', 'ideas', 'idea', 'should', 'could',
                   'would', 'like', 'love', 'really', 'something', 'anything']
    
    words = message.lower().split()
    filtered = [w for w in words if w not in filler_words and len(w) > 2]
    
    # Take first 4 meaningful words as search query
    query = ' '.join(filtered[:4])
    
    # If query is too short, use original message
    if len(query) < 3:
        query = message[:50]
    
    return query


async def search_recipes(query: str, number: int = 6) -> List[dict]:
    """Search for recipes using Spoonacular API"""
    if not SPOONACULAR_API_KEY:
        print("WARNING: SPOONACULAR_API_KEY not set!")
        return []
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "https://api.spoonacular.com/recipes/complexSearch",
                params={
                    "apiKey": SPOONACULAR_API_KEY,
                    "query": query,
                    "number": number,
                    "addRecipeInformation": True,
                    "fillIngredients": False
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                recipes = []
                for r in data.get("results", []):
                    recipes.append({
                        "id": r.get("id"),
                        "title": r.get("title"),
                        "image": r.get("image"),
                        "readyInMinutes": r.get("readyInMinutes"),
                        "servings": r.get("servings")
                    })
                return recipes
            else:
                print(f"Spoonacular API error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Recipe search error: {e}")
    
    return []


@router.post("/api/ai/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Chat with the AI meal planning assistant.
    Returns both text response and recipe cards when relevant.
    """
    
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503, 
            detail="AI service not configured. Please add ANTHROPIC_API_KEY to environment."
        )
    
    # Check if user is asking for recipes
    wants_recipes = should_search_recipes(request.message)
    
    # Build conversation messages
    messages = []
    
    # Add conversation history
    for msg in request.conversation_history[-10:]:
        messages.append({
            "role": msg.role,
            "content": msg.content
        })
    
    # Add current message
    messages.append({
        "role": "user",
        "content": request.message
    })
    
    # Get user's saved recipes for context
    saved_recipes_context = ""
    try:
        result = db.execute(
            text("SELECT title FROM saved_recipes WHERE user_id = :user_id AND (is_hidden IS NULL OR is_hidden = 0) LIMIT 20"),
            {"user_id": current_user.id}
        )
        recipes = [row.title for row in result.fetchall()]
        if recipes:
            saved_recipes_context = f"\n\nThe user has these recipes saved: {', '.join(recipes[:10])}"
    except Exception:
        pass
    
    # Search for recipes if user wants them (do this first, in parallel with AI call)
    all_recipes = []
    if wants_recipes:
        search_query = extract_search_query(request.message)
        all_recipes = await search_recipes(search_query, number=6)
    
    # Call Claude API
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            # Adjust system prompt if we're showing recipes
            system = SYSTEM_PROMPT + saved_recipes_context
            if wants_recipes and all_recipes:
                system += "\n\nNOTE: Recipe cards will be shown below your message automatically. Keep your response brief and friendly!"
            
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01"
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 1024,
                    "system": system,
                    "messages": messages
                }
            )
            
            if response.status_code != 200:
                error_detail = response.text
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"AI service error: {error_detail}"
                )
            
            result = response.json()
            assistant_message = result["content"][0]["text"]
            
            return ChatResponse(
                response=assistant_message,
                recipes=all_recipes if all_recipes else None,
                conversation_id=None
            )
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="AI service timeout. Please try again.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


@router.get("/api/ai/health")
async def ai_health_check():
    """Check if AI service is configured"""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    spoonacular_key = os.getenv("SPOONACULAR_API_KEY")
    return {
        "ai_configured": bool(api_key),
        "recipes_configured": bool(spoonacular_key),
        "service": "Claude AI + Spoonacular"
    }