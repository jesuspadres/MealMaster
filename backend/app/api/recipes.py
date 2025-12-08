"""
Recipes API with caching layer
- Search results cached for 24 hours per query
- Recipe details cached indefinitely (updated when fetched again)
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime, timedelta, timezone
import httpx
import hashlib
import os

from app.database.config import get_db
from app.models.cached_recipe import CachedRecipe, CachedSearchQuery

router = APIRouter()

SPOONACULAR_API_KEY = os.getenv("SPOONACULAR_API_KEY")
SPOONACULAR_BASE_URL = "https://api.spoonacular.com"
CACHE_DURATION_HOURS = 24  # Search results expire after 24 hours


def get_query_hash(query: str) -> str:
    """Generate a consistent hash for a search query"""
    normalized = query.lower().strip()
    return hashlib.sha256(normalized.encode()).hexdigest()


def is_cache_valid(expires_at: datetime) -> bool:
    """Check if cache entry is still valid"""
    now = datetime.now(timezone.utc)
    # Make expires_at timezone-aware if it isn't
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return now < expires_at


@router.get("/search")
async def search_recipes(
    query: str = Query(..., description="Search query for recipes"),
    number: int = Query(10, ge=1, le=100, description="Number of results"),
    db: Session = Depends(get_db)
):
    """
    Search for recipes - checks cache first, then Spoonacular API
    Cache expires after 24 hours
    """
    if not SPOONACULAR_API_KEY:
        raise HTTPException(status_code=500, detail="API key not configured")
    
    query_hash = get_query_hash(query)
    
    # Check if we have a valid cached search
    cached_search = db.query(CachedSearchQuery).filter(
        CachedSearchQuery.query_hash == query_hash
    ).first()
    
    if cached_search and is_cache_valid(cached_search.expires_at):
        # Cache hit! Get recipes from cached_recipes table
        result_ids = cached_search.result_ids[:number]  # Limit to requested number
        
        cached_recipes = db.query(CachedRecipe).filter(
            CachedRecipe.external_id.in_(result_ids)
        ).all()
        
        # Build results in the same order as result_ids
        recipe_map = {r.external_id: r for r in cached_recipes}
        results = []
        for ext_id in result_ids:
            if ext_id in recipe_map:
                r = recipe_map[ext_id]
                # Return simplified data for search results
                results.append({
                    "id": r.external_id,
                    "title": r.data.get("title", r.title),
                    "image": r.data.get("image", r.image),
                    "readyInMinutes": r.data.get("readyInMinutes"),
                    "servings": r.data.get("servings"),
                    "dishTypes": r.data.get("dishTypes", [])
                })
        
        return {
            "results": results,
            "total": cached_search.total_results,
            "cached": True
        }
    
    # Cache miss or expired - call Spoonacular API
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SPOONACULAR_BASE_URL}/recipes/complexSearch",
                params={
                    "apiKey": SPOONACULAR_API_KEY,
                    "query": query,
                    "number": min(number, 50),  # Fetch more to cache
                    "addRecipeInformation": True,
                    "fillIngredients": True
                },
                timeout=15.0
            )
            response.raise_for_status()
            data = response.json()
            
            results = data.get("results", [])
            total_results = data.get("totalResults", 0)
            
            # Cache the results
            result_ids = []
            for recipe_data in results:
                ext_id = recipe_data.get("id")
                if not ext_id:
                    continue
                    
                result_ids.append(ext_id)
                
                # Upsert cached recipe
                existing = db.query(CachedRecipe).filter(
                    CachedRecipe.external_id == ext_id
                ).first()
                
                if existing:
                    existing.title = recipe_data.get("title", "")
                    existing.image = recipe_data.get("image", "")
                    existing.data = recipe_data
                    existing.updated_at = datetime.now(timezone.utc)
                else:
                    new_cached = CachedRecipe(
                        external_id=ext_id,
                        title=recipe_data.get("title", ""),
                        image=recipe_data.get("image", ""),
                        data=recipe_data
                    )
                    db.add(new_cached)
            
            # Upsert search query cache
            expires_at = datetime.now(timezone.utc) + timedelta(hours=CACHE_DURATION_HOURS)
            
            if cached_search:
                cached_search.result_ids = result_ids
                cached_search.total_results = total_results
                cached_search.expires_at = expires_at
                cached_search.created_at = datetime.now(timezone.utc)
            else:
                new_search_cache = CachedSearchQuery(
                    query=query.lower().strip(),
                    query_hash=query_hash,
                    result_ids=result_ids,
                    total_results=total_results,
                    expires_at=expires_at
                )
                db.add(new_search_cache)
            
            db.commit()
            
            # Return formatted results
            formatted_results = []
            for r in results[:number]:
                formatted_results.append({
                    "id": r.get("id"),
                    "title": r.get("title"),
                    "image": r.get("image"),
                    "readyInMinutes": r.get("readyInMinutes"),
                    "servings": r.get("servings"),
                    "dishTypes": r.get("dishTypes", [])
                })
            
            return {
                "results": formatted_results,
                "total": total_results,
                "cached": False
            }
    
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail="External API error")
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Unable to connect to recipe API")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{recipe_id}")
async def get_recipe_details(
    recipe_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed recipe information - checks cache first, then Spoonacular API
    Recipe details are cached indefinitely but updated when fetched from API
    """
    if not SPOONACULAR_API_KEY:
        raise HTTPException(status_code=500, detail="API key not configured")
    
    # Check cache first
    cached = db.query(CachedRecipe).filter(
        CachedRecipe.external_id == recipe_id
    ).first()
    
    # If we have cached data with full details (has nutrition), return it
    if cached and cached.data.get("nutrition"):
        return cached.data
    
    # Fetch from Spoonacular API (either not cached or missing full details)
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SPOONACULAR_BASE_URL}/recipes/{recipe_id}/information",
                params={
                    "apiKey": SPOONACULAR_API_KEY,
                    "includeNutrition": True
                },
                timeout=15.0
            )
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="Recipe not found")
            
            response.raise_for_status()
            data = response.json()
            
            # Cache the full recipe data
            if cached:
                cached.title = data.get("title", "")
                cached.image = data.get("image", "")
                cached.data = data
                cached.updated_at = datetime.now(timezone.utc)
            else:
                new_cached = CachedRecipe(
                    external_id=recipe_id,
                    title=data.get("title", ""),
                    image=data.get("image", ""),
                    data=data
                )
                db.add(new_cached)
            
            db.commit()
            
            return data
    
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(status_code=404, detail="Recipe not found")
        raise HTTPException(status_code=e.response.status_code, detail="External API error")
    except httpx.RequestError:
        # If API fails but we have cached data, return it anyway
        if cached:
            return cached.data
        raise HTTPException(status_code=503, detail="Unable to connect to recipe API")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/cache/expired")
async def cleanup_expired_cache(db: Session = Depends(get_db)):
    """
    Admin endpoint to clean up expired search cache entries
    """
    now = datetime.now(timezone.utc)
    deleted = db.query(CachedSearchQuery).filter(
        CachedSearchQuery.expires_at < now
    ).delete()
    db.commit()
    
    return {"deleted_entries": deleted}