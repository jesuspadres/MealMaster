from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.config import Base

class MealPlan(Base):
    __tablename__ = "meal_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    saved_recipe_id = Column(Integer, ForeignKey("saved_recipes.id"), nullable=False)
    date = Column(Date, nullable=False)
    meal_type = Column(String, nullable=False)  # breakfast, lunch, dinner, snack
    servings = Column(Integer, default=1)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", backref="meal_plans")
    saved_recipe = relationship("SavedRecipe", backref="meal_plans")

    def __repr__(self):
        return f"<MealPlan(id={self.id}, date={self.date}, meal_type={self.meal_type})>"