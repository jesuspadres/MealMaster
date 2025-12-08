"""
Cached Recipe models for storing Spoonacular API responses
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Index
from sqlalchemy.sql import func
from app.database.config import Base


class CachedRecipe(Base):
    """
    Stores full recipe details from Spoonacular API
    """
    __tablename__ = "cached_recipes"

    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(Integer, unique=True, index=True, nullable=False)  # Spoonacular recipe ID
    title = Column(String(500), nullable=False)
    image = Column(String(1000))
    data = Column(JSON, nullable=False)  # Full Spoonacular response
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class CachedSearchQuery(Base):
    """
    Stores search query results with expiration
    """
    __tablename__ = "cached_search_queries"

    id = Column(Integer, primary_key=True, index=True)
    query = Column(String(500), nullable=False, index=True)  # Search term (lowercase, trimmed)
    query_hash = Column(String(64), unique=True, index=True, nullable=False)  # Hash of normalized query
    result_ids = Column(JSON, nullable=False)  # List of external_ids from search results
    total_results = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)  # When this cache entry expires

    __table_args__ = (
        Index('ix_cached_search_expires', 'expires_at'),
    )