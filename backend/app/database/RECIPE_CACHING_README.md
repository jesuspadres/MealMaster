# Recipe Caching System

## Overview

This caching layer reduces Spoonacular API calls by storing recipe data locally in the database.

## How It Works

### Search Results (24-hour cache)
1. When a user searches for recipes (e.g., "pasta"), the system first checks if we have cached results for that query
2. If cached results exist AND are less than 24 hours old → return cached data (no API call)
3. If no cache OR cache expired → call Spoonacular API, store results, return data

### Recipe Details (persistent cache)
1. When a user clicks on a recipe to view details, check if we have the full recipe cached
2. If cached with nutrition data → return cached data (no API call)
3. If not cached OR missing nutrition → call Spoonacular API, update cache, return data

## Database Tables

### `cached_recipes`
Stores full recipe data from Spoonacular.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| external_id | INTEGER | Spoonacular recipe ID (unique) |
| title | VARCHAR(500) | Recipe title |
| image | VARCHAR(1000) | Image URL |
| data | JSONB | Full Spoonacular API response |
| created_at | TIMESTAMP | When first cached |
| updated_at | TIMESTAMP | When last updated |

### `cached_search_queries`
Stores search query results with expiration.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| query | VARCHAR(500) | Original search term |
| query_hash | VARCHAR(64) | SHA256 hash of normalized query |
| result_ids | JSONB | Array of external_ids from results |
| total_results | INTEGER | Total results from Spoonacular |
| created_at | TIMESTAMP | When cached |
| expires_at | TIMESTAMP | When cache expires (24 hours) |

## Setup

1. Run the migration script:
```bash
cd backend
python add_recipe_cache_tables.py
```

2. The recipes API will automatically use caching - no code changes needed in the frontend.

## API Response Changes

The search endpoint now includes a `cached` field:

```json
{
  "results": [...],
  "total": 100,
  "cached": true  // true if served from cache, false if from Spoonacular
}
```

## Cache Management

### Clean up expired cache entries
```
DELETE /api/recipes/cache/expired
```

This removes expired search query entries. Recipe details are never automatically deleted.

## Configuration

In `recipes.py`:
```python
CACHE_DURATION_HOURS = 24  # Change this to adjust cache expiration
```

## Benefits

1. **Reduced API costs** - Spoonacular has rate limits and costs per call
2. **Faster responses** - Database queries are faster than external API calls
3. **Offline resilience** - If Spoonacular is down, cached recipes still work
4. **Fresh enough data** - 24-hour expiration ensures recipes stay relatively current