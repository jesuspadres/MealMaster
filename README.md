# 🍳 MealMaster

A modern, full-stack meal planning and recipe discovery application built with React, FastAPI, and SQLite.

[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)](https://www.python.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

## ✨ Features

### 🔍 Recipe Discovery
- **Smart Search**: Search thousands of recipes from the Spoonacular API
- **Detailed Information**: View cooking time, servings, ingredients, and dish types
- **Beautiful UI**: Brutalist design aesthetic with bold typography and asymmetric layouts

### 🔐 User Authentication
- **Secure JWT-based authentication** with bcrypt password hashing
- **User registration and login** with email validation
- **Protected routes** for personalized features

### ❤️ Save Recipes
- **Personal collection**: Save your favorite recipes to your account
- **Quick access**: View all saved recipes in one place
- **Mark favorites**: Star your most-loved recipes
- **Easy management**: Remove recipes from your collection anytime

### 📅 Meal Planning
- **Weekly planner**: Organize meals across a 7-day calendar
- **Meal types**: Plan breakfast, lunch, dinner, and snacks
- **Drag & drop**: Assign saved recipes to specific days and meal slots
- **Flexible scheduling**: Navigate between weeks to plan ahead
- **Servings adjustment**: Customize serving sizes per meal

### 🛒 Grocery Lists *(Planned)*
- Auto-generate shopping lists from meal plans
- Combine ingredients intelligently
- Check off items as you shop

## 🏗️ Technical Architecture

### Frontend Stack
- **React 18** with TypeScript for type safety
- **TanStack Router** for client-side routing
- **Tailwind CSS** for utility-first styling
- **Axios** for HTTP requests
- **React Context API** for state management

### Backend Stack
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - SQL toolkit and ORM
- **SQLite** - Lightweight database (easily migrates to PostgreSQL)
- **Pydantic** - Data validation using Python type annotations
- **Python-JOSE** - JWT token creation and validation
- **Passlib** - Password hashing with bcrypt

### External APIs
- **Spoonacular API** - Recipe search and nutritional data

## 📦 Installation

### Prerequisites
- Python 3.11+
- Node.js 16+
- npm or yarn

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
DATABASE_URL=sqlite:///./mealmaster.db
SPOONACULAR_API_KEY=your_api_key_here
SECRET_KEY=your-secret-key-here
EOF

# Initialize database
python init_db.py

# Run server
python main.py
```

Backend will be available at `http://localhost:8000`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
VITE_API_URL=http://localhost:8000
EOF

# Run development server
npm run dev
```

Frontend will be available at `http://localhost:3000`

## 🚀 Usage

1. **Register an account** at `/auth`
2. **Search for recipes** on the home page
3. **Save recipes** by clicking the heart button (requires login)
4. **View saved recipes** in the "Saved" section
5. **Plan meals** using the weekly calendar in "Planner"
6. **Assign recipes** to specific days and meal times

## 📁 Project Structure

```
MealMaster/
├── backend/
│   ├── app/
│   │   ├── api/              # API route handlers
│   │   │   ├── auth.py       # Authentication endpoints
│   │   │   ├── recipes.py    # Recipe search endpoints
│   │   │   ├── saved_recipes.py  # Saved recipes CRUD
│   │   │   └── meal_plans.py     # Meal planning endpoints
│   │   ├── models/           # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── recipe.py
│   │   │   └── meal_plan.py
│   │   ├── services/         # Business logic
│   │   │   └── auth.py       # JWT and password utilities
│   │   └── database/         # Database configuration
│   │       └── config.py
│   ├── main.py              # FastAPI application entry point
│   ├── init_db.py           # Database initialization script
│   └── requirements.txt     # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   │   └── RecipeSearch.tsx
│   │   ├── pages/           # Page components
│   │   │   ├── AuthPage.tsx
│   │   │   ├── SavedRecipesPage.tsx
│   │   │   └── MealPlannerPage.tsx
│   │   ├── context/         # React Context providers
│   │   │   └── AuthContext.tsx
│   │   ├── App.tsx          # Main application component
│   │   └── main.tsx         # Application entry point
│   ├── package.json         # Node dependencies
│   └── tailwind.config.js   # Tailwind configuration
│
└── README.md
```

## 🔒 Security Features

- **JWT-based authentication** with 7-day token expiration
- **Bcrypt password hashing** (72-byte limit enforcement)
- **CORS protection** with configurable origins
- **Input validation** using Pydantic models
- **SQL injection prevention** via SQLAlchemy ORM
- **Environment variable management** for sensitive data

## 🎨 Design Philosophy

MealMaster features a **brutalist web design** aesthetic:
- Bold 4px black borders
- Monospace typography (Courier New)
- Bright, contrasting colors (yellow, cyan, pink, green)
- Asymmetric, broken grid layouts
- Raw, unapologetic UI elements
- Uppercase system-style text

## 🧪 API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for interactive API documentation powered by FastAPI's automatic OpenAPI/Swagger UI.

### Key Endpoints

**Authentication**
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Authenticate and receive JWT token
- `GET /api/auth/me` - Get current user info (requires auth)

**Recipes**
- `GET /api/recipes/search` - Search recipes (public)
- `GET /api/recipes/{id}` - Get recipe details (public)

**Saved Recipes**
- `POST /api/saved-recipes/` - Save a recipe (requires auth)
- `GET /api/saved-recipes/` - Get user's saved recipes (requires auth)
- `DELETE /api/saved-recipes/{id}` - Remove saved recipe (requires auth)
- `POST /api/saved-recipes/{id}/favorite` - Toggle favorite status (requires auth)

**Meal Plans**
- `POST /api/meal-plans/` - Create meal plan entry (requires auth)
- `GET /api/meal-plans/` - Get meal plans for date range (requires auth)
- `PUT /api/meal-plans/{id}` - Update meal plan (requires auth)
- `DELETE /api/meal-plans/{id}` - Delete meal plan (requires auth)
- `GET /api/meal-plans/week` - Get current week's meal plans (requires auth)

## 🛣️ Roadmap

- [ ] Recipe detail pages with full instructions
- [ ] Automatic grocery list generation
- [ ] Nutrition tracking and analysis
- [ ] Recipe rating and reviews
- [ ] Social features (share recipes, follow users)
- [ ] Recipe collections and tags
- [ ] Export meal plans to PDF
- [ ] Mobile app (React Native)
- [ ] Dark mode support
- [ ] Recipe import from URLs

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**Jesus Padres**
- Portfolio: [JesusPadres.com](https://jesuspadres.com)
- LinkedIn: [linkedin.com/in/jesus-padres](https://linkedin.com/in/jesus-padres)
- Email: jesuspadres@gmail.com

## 🙏 Acknowledgments

- [Spoonacular API](https://spoonacular.com/food-api) for recipe data
- [FastAPI](https://fastapi.tiangolo.com/) for the excellent Python framework
- [React](https://reactjs.org/) for the frontend library
- [Tailwind CSS](https://tailwindcss.com/) for styling utilities

---

Built with ❤️ as a portfolio project demonstrating full-stack development skills