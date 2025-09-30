from fastapi import APIRouter, HTTPException, Query
import httpx
import os

router = APIRouter()

SPOONACULAR_API_KEY = os.getenv("SPOONACULAR_API_KEY")
SPOONACULAR_BASE_URL = "https://api.spoonacular.com"

@router.get("/search")
async def search_recipes(
    query: str = Query(..., description="Search query for recipes"),
    number: int = Query(10, ge=1, le=100, description="Number of results")
):
    """
    Search for recipes using Spoonacular API
    """
    if not SPOONACULAR_API_KEY:
        raise HTTPException(status_code=500, detail="API key not configured")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SPOONACULAR_BASE_URL}/recipes/complexSearch",
                params={
                    "apiKey": SPOONACULAR_API_KEY,
                    "query": query,
                    "number": number,
                    "addRecipeInformation": True,
                    "fillIngredients": True
                },
                timeout=10.0
            )
            response.raise_for_status()
            data = response.json()
            
            return {
                "results": data.get("results", []),
                "total": data.get("totalResults", 0)
            }
    
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail="External API error")
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Unable to connect to recipe API")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{recipe_id}")
async def get_recipe_details(recipe_id: int):
    """
    Get detailed information about a specific recipe
    """
    if not SPOONACULAR_API_KEY:
        raise HTTPException(status_code=500, detail="API key not configured")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SPOONACULAR_BASE_URL}/recipes/{recipe_id}/information",
                params={
                    "apiKey": SPOONACULAR_API_KEY,
                    "includeNutrition": True
                },
                timeout=10.0
            )
            response.raise_for_status()
            return response.json()
    
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(status_code=404, detail="Recipe not found")
        raise HTTPException(status_code=e.response.status_code, detail="External API error")
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Unable to connect to recipe API")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))