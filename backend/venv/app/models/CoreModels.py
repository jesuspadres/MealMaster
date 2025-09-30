# User Model
import datetime
from datetime import date
from sqlalchemy import JSON, Date


class User:
    id: int #(Primary Key)
    email: str #(Unique)
    name: str
    password_hash: str
    created_at: datetime

# Recipe Model  
class Recipe:
    id: int #(Primary Key)
    user_id: int #(Foreign Key)
    external_id: str #(Spoonacular ID, nullable)
    title: str
    description: str
    ingredients: JSON
    instructions: JSON
    prep_time: int #(minutes)
    cook_time: int #(minutes)
    servings: int
    nutrition: JSON
    image_url: str
    is_favorite: bool
    created_at: datetime

# Meal Plan Model
class MealPlan:
    id: int #(Primary Key)
    user_id: int #(Foreign Key)
    date: date
    meal_type: str #(breakfast, lunch, dinner, snack)
    recipe_id: int #(Foreign Key)
    servings: int
    created_at: datetime

# Grocery List Model
class GroceryList:
    id: int #(Primary Key)
    user_id: int #(Foreign Key)
    name: str
    created_at: datetime

class GroceryItem:
    id: int #(Primary Key)
    list_id: int #(Foreign Key)
    ingredient_name: str
    quantity: str
    unit: str
    is_completed: bool
    recipe_id: int #(Foreign Key, nullable)