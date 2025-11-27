"""
Database initialization script
Run this once to create all database tables
"""
from app.database.config import engine, Base
from app.models.user import User
from app.models.recipe import SavedRecipe
from app.models.meal_plan import MealPlan

def init_db():
    """Create all database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created successfully!")

if __name__ == "__main__":
    init_db()