from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from app.database.config import get_db
from app.models.recipe import SavedRecipe
from app.models.meal_plan import MealPlan
from app.models.user import User
from app.services.auth import get_current_user

router = APIRouter()

# Pydantic models
class SaveRecipeRequest(BaseModel):
    external_id: int
    title: str
    image_url: Optional[str] = None
    ready_in_minutes: Optional[int] = None
    servings: Optional[int] = None
    source_url: Optional[str] = None
    summary: Optional[str] = None
    ingredients: Optional[dict] = None
    instructions: Optional[dict] = None
    nutrition: Optional[dict] = None

class SavedRecipeResponse(BaseModel):
    id: int
    external_id: int
    title: str
    image_url: Optional[str]
    ready_in_minutes: Optional[int]
    servings: Optional[int]
    is_favorite: bool
    is_hidden: bool = False
    
    class Config:
        from_attributes = True

@router.post("/", response_model=SavedRecipeResponse, status_code=status.HTTP_201_CREATED)
async def save_recipe(
    recipe_data: SaveRecipeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save a recipe to user's collection"""
    # Check if already saved (including hidden ones)
    existing = db.query(SavedRecipe).filter(
        SavedRecipe.user_id == current_user.id,
        SavedRecipe.external_id == recipe_data.external_id
    ).first()
    
    if existing:
        # If it was hidden, unhide it
        if existing.is_hidden:
            existing.is_hidden = False
            db.commit()
            db.refresh(existing)
            return existing
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recipe already saved"
        )
    
    # Create new saved recipe
    new_saved_recipe = SavedRecipe(
        user_id=current_user.id,
        external_id=recipe_data.external_id,
        title=recipe_data.title,
        image_url=recipe_data.image_url,
        ready_in_minutes=recipe_data.ready_in_minutes,
        servings=recipe_data.servings,
        source_url=recipe_data.source_url,
        summary=recipe_data.summary,
        ingredients=recipe_data.ingredients,
        instructions=recipe_data.instructions,
        nutrition=recipe_data.nutrition
    )
    
    db.add(new_saved_recipe)
    db.commit()
    db.refresh(new_saved_recipe)
    
    return new_saved_recipe

@router.get("/", response_model=List[SavedRecipeResponse])
async def get_saved_recipes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all saved recipes for current user (excluding hidden ones)"""
    saved_recipes = db.query(SavedRecipe).filter(
        SavedRecipe.user_id == current_user.id,
        SavedRecipe.is_hidden == False
    ).order_by(SavedRecipe.created_at.desc()).all()
    
    return saved_recipes

@router.get("/all", response_model=List[SavedRecipeResponse])
async def get_all_saved_recipes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all saved recipes including hidden ones (for meal planner selection)"""
    saved_recipes = db.query(SavedRecipe).filter(
        SavedRecipe.user_id == current_user.id
    ).order_by(SavedRecipe.created_at.desc()).all()
    
    return saved_recipes

@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_saved_recipe(
    recipe_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a saved recipe (soft delete if used in past meal plans)"""
    saved_recipe = db.query(SavedRecipe).filter(
        SavedRecipe.id == recipe_id,
        SavedRecipe.user_id == current_user.id
    ).first()
    
    if not saved_recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found"
        )
    
    today = date.today()
    
    # Check if recipe is used in any FUTURE meal plans (today or later)
    future_meal_plan_count = db.query(MealPlan).filter(
        MealPlan.saved_recipe_id == recipe_id,
        MealPlan.date >= today
    ).count()
    
    if future_meal_plan_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete recipe - it is scheduled in {future_meal_plan_count} upcoming meal plan(s). Remove it from your future meal plans first."
        )
    
    # Check if recipe is used in any PAST meal plans
    past_meal_plan_count = db.query(MealPlan).filter(
        MealPlan.saved_recipe_id == recipe_id,
        MealPlan.date < today
    ).count()
    
    if past_meal_plan_count > 0:
        # Soft delete - just hide it
        saved_recipe.is_hidden = True
        db.commit()
    else:
        # No meal plans at all - hard delete
        db.delete(saved_recipe)
        db.commit()
    
    return None

@router.post("/{recipe_id}/favorite", response_model=SavedRecipeResponse)
async def toggle_favorite(
    recipe_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle favorite status of a saved recipe"""
    saved_recipe = db.query(SavedRecipe).filter(
        SavedRecipe.id == recipe_id,
        SavedRecipe.user_id == current_user.id
    ).first()
    
    if not saved_recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found"
        )
    
    saved_recipe.is_favorite = not saved_recipe.is_favorite
    db.commit()
    db.refresh(saved_recipe)
    
    return saved_recipe