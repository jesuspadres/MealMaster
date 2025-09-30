from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.config import Base

class SavedRecipe(Base):
    __tablename__ = "saved_recipes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    external_id = Column(Integer, nullable=False)  # Spoonacular recipe ID
    title = Column(String, nullable=False)
    image_url = Column(String)
    ready_in_minutes = Column(Integer)
    servings = Column(Integer)
    source_url = Column(String)
    summary = Column(Text)
    ingredients = Column(JSON)  # Store as JSON
    instructions = Column(JSON)  # Store as JSON
    nutrition = Column(JSON)  # Store as JSON
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    user = relationship("User", backref="saved_recipes")

    def __repr__(self):
        return f"<SavedRecipe(id={self.id}, title={self.title}, user_id={self.user_id})>"