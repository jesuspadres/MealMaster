from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date, timedelta
from typing import List, Optional
from app.database.config import get_db
from app.models.meal_plan import MealPlan
from app.models.user import User
from app.services.auth import get_current_user

router = APIRouter()

class MealPlanCreate(BaseModel):
    saved_recipe_id: int
    date: date
    meal_type: str  # breakfast, lunch, dinner, snack
    servings: int = 1
    notes: Optional[str] = None

class MealPlanUpdate(BaseModel):
    servings: Optional[int] = None
    notes: Optional[str] = None

class MealPlanResponse(BaseModel):
    id: int
    saved_recipe_id: int
    date: date
    meal_type: str
    servings: int
    notes: Optional[str]
    recipe_title: str
    recipe_image: str
    
    class Config:
        from_attributes = True

@router.post("/", response_model=MealPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_meal_plan(
    meal_plan: MealPlanCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a recipe to meal plan"""
    # Validate meal type
    valid_meal_types = ["breakfast", "lunch", "dinner", "snack"]
    if meal_plan.meal_type not in valid_meal_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid meal type. Must be one of: {valid_meal_types}"
        )
    
    # Create meal plan entry
    new_meal_plan = MealPlan(
        user_id=current_user.id,
        saved_recipe_id=meal_plan.saved_recipe_id,
        date=meal_plan.date,
        meal_type=meal_plan.meal_type,
        servings=meal_plan.servings,
        notes=meal_plan.notes
    )
    
    db.add(new_meal_plan)
    db.commit()
    db.refresh(new_meal_plan)
    
    # Get recipe details for response
    response = MealPlanResponse(
        id=new_meal_plan.id,
        saved_recipe_id=new_meal_plan.saved_recipe_id,
        date=new_meal_plan.date,
        meal_type=new_meal_plan.meal_type,
        servings=new_meal_plan.servings,
        notes=new_meal_plan.notes,
        recipe_title=new_meal_plan.saved_recipe.title,
        recipe_image=new_meal_plan.saved_recipe.image_url or ""
    )
    
    return response

@router.get("/", response_model=List[MealPlanResponse])
async def get_meal_plans(
    start_date: date = Query(..., description="Start date for meal plans"),
    end_date: date = Query(..., description="End date for meal plans"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get meal plans for a date range"""
    meal_plans = db.query(MealPlan).filter(
        MealPlan.user_id == current_user.id,
        MealPlan.date >= start_date,
        MealPlan.date <= end_date
    ).all()
    
    response = []
    for mp in meal_plans:
        response.append(MealPlanResponse(
            id=mp.id,
            saved_recipe_id=mp.saved_recipe_id,
            date=mp.date,
            meal_type=mp.meal_type,
            servings=mp.servings,
            notes=mp.notes,
            recipe_title=mp.saved_recipe.title,
            recipe_image=mp.saved_recipe.image_url or ""
        ))
    
    return response

@router.put("/{meal_plan_id}", response_model=MealPlanResponse)
async def update_meal_plan(
    meal_plan_id: int,
    update_data: MealPlanUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a meal plan entry"""
    meal_plan = db.query(MealPlan).filter(
        MealPlan.id == meal_plan_id,
        MealPlan.user_id == current_user.id
    ).first()
    
    if not meal_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal plan not found"
        )
    
    if update_data.servings is not None:
        meal_plan.servings = update_data.servings
    if update_data.notes is not None:
        meal_plan.notes = update_data.notes
    
    db.commit()
    db.refresh(meal_plan)
    
    response = MealPlanResponse(
        id=meal_plan.id,
        saved_recipe_id=meal_plan.saved_recipe_id,
        date=meal_plan.date,
        meal_type=meal_plan.meal_type,
        servings=meal_plan.servings,
        notes=meal_plan.notes,
        recipe_title=meal_plan.saved_recipe.title,
        recipe_image=meal_plan.saved_recipe.image_url or ""
    )
    
    return response

@router.delete("/{meal_plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_meal_plan(
    meal_plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a recipe from meal plan"""
    meal_plan = db.query(MealPlan).filter(
        MealPlan.id == meal_plan_id,
        MealPlan.user_id == current_user.id
    ).first()
    
    if not meal_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal plan not found"
        )
    
    db.delete(meal_plan)
    db.commit()
    
    return None

@router.get("/week", response_model=List[MealPlanResponse])
async def get_current_week_meal_plans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get meal plans for current week (Monday-Sunday)"""
    today = date.today()
    # Get Monday of current week
    start_of_week = today - timedelta(days=today.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    
    meal_plans = db.query(MealPlan).filter(
        MealPlan.user_id == current_user.id,
        MealPlan.date >= start_of_week,
        MealPlan.date <= end_of_week
    ).all()
    
    response = []
    for mp in meal_plans:
        response.append(MealPlanResponse(
            id=mp.id,
            saved_recipe_id=mp.saved_recipe_id,
            date=mp.date,
            meal_type=mp.meal_type,
            servings=mp.servings,
            notes=mp.notes,
            recipe_title=mp.saved_recipe.title,
            recipe_image=mp.saved_recipe.image_url or ""
        ))
    
    return response