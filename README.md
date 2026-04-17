# AI Prompt Library

A full-stack web application for managing AI Image Generation Prompts — with JWT authentication, Redis-backed view counters, tag-based filtering, and full Docker orchestration.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Local Setup (Docker)](#local-setup-docker)
4. [Local Setup (Manual Dev)](#local-setup-manual-dev)
5. [API Reference](#api-reference)
6. [Architectural Decisions](#architectural-decisions)
7. [Bonus Features](#bonus-features)
8. [Default Credentials](#default-credentials)

---

## Tech Stack

| Layer     | Technology                                    |
|-----------|-----------------------------------------------|
| Frontend  | React 18 + Vite + React Router v6             |
| Backend   | Python 3.11, Django 4.2 (no DRF)             |
| Database  | PostgreSQL 15                                  |
| Cache     | Redis 7                                        |
| Auth      | JWT (PyJWT — no third-party auth framework)   |
| Container | Docker + Docker Compose                        |
| Proxy     | nginx (serves React + reverse-proxies API)    |

---

## Project Structure

```
AI-Prompt-Library/
├── backend/
│   ├── Dockerfile
│   ├── entrypoint.sh          # Waits for DB, runs migrations, seeds admin
│   ├── requirements.txt
│   ├── manage.py
│   ├── config/
│   │   ├── settings.py        # All environment-driven config
│   │   ├── urls.py            # Root URL conf
│   │   └── wsgi.py
│   ├── prompts/
│   │   ├── models.py          # Prompt + Tag models
│   │   ├── views.py           # PromptListView, PromptDetailView, TagListView
│   │   ├── urls.py
│   │   └── admin.py
│   └── auth_app/
│       ├── utils.py           # generate_token(), get_user_from_token()
│       ├── views.py           # LoginView, RegisterView
│       └── urls.py
│
├── frontend/
│   ├── Dockerfile             # Multi-stage: node build → nginx serve
│   ├── nginx.conf             # SPA routing + /api/ reverse proxy
│   ├── vite.config.js
│   ├── package.json
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css          # Full dark design system
│       ├── api/client.js      # Axios with JWT interceptors
│       ├── contexts/AuthContext.jsx
│       ├── components/Navbar.jsx
│       └── pages/
│           ├── PromptList.jsx
│           ├── PromptDetail.jsx
│           ├── AddPrompt.jsx
│           └── Login.jsx
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## Local Setup (Docker)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd AI-Prompt-Library
```

### 2. Start all services

```bash
docker-compose up --build
```

This single command will:
1. Pull `postgres:15-alpine` and `redis:7-alpine` images
2. Build the Django backend image and install all Python dependencies
3. Build the React frontend (Vite production build) and package it into an nginx container
4. Run Django database migrations automatically
5. Seed a default `admin` superuser (`admin / admin123`)
6. Start all 4 containers with correct dependency ordering

### 3. Access the app

| Service          | URL                              |
|------------------|----------------------------------|
| Frontend (React) | http://localhost                 |
| Django Admin     | http://localhost/api/admin/      |
| Backend API      | http://localhost/api/prompts/    |

> All frontend-to-backend communication is handled internally by nginx. The browser only ever talks to port 80.

### Stop the app

```bash
docker-compose down           # stop containers
docker-compose down -v        # also remove volumes (clears DB + Redis)
```

---

## Local Setup (Manual Dev)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

# Set environment variables (or create a .env file)
set DB_HOST=localhost
set DB_PORT=5432
set REDIS_HOST=localhost
set REDIS_PORT=6379

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start dev server
python manage.py runserver
```

Backend runs at: `http://localhost:8000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`  
The Vite dev proxy forwards `/api/*` → `http://localhost:8000/*`

---

## API Reference

All endpoints are under the `/api/` prefix when accessed through nginx.  
Direct Django base URL during dev: `http://localhost:8000`

### Authentication

#### `POST /auth/login/`
```json
// Request
{ "username": "admin", "password": "admin123" }

// Response 200
{ "token": "<jwt>", "username": "admin" }
```

#### `POST /auth/register/`
```json
// Request
{ "username": "alice", "password": "securepass", "email": "alice@example.com" }

// Response 201
{ "token": "<jwt>", "username": "alice" }
```

---

### Prompts

#### `GET /prompts/`
Returns all prompts. Supports tag filtering.

```
GET /prompts/
GET /prompts/?tag=anime
```

```json
// Response 200
{
  "prompts": [
    {
      "id": "uuid",
      "title": "Cyberpunk City",
      "complexity": 8,
      "created_at": "2024-01-15T10:30:00Z",
      "tags": ["cyberpunk", "city"]
    }
  ],
  "count": 1
}
```

#### `POST /prompts/`  *(requires JWT Bearer token)*

```
Authorization: Bearer <token>
```

```json
// Request
{
  "title": "Cyberpunk City Rain",
  "content": "A cinematic wide shot of a rain-soaked cyberpunk megacity at night, neon reflections on wet asphalt, volumetric fog, hyper-realistic, 8K",
  "complexity": 8,
  "tags": ["cyberpunk", "rain", "city"]
}

// Response 201
{
  "id": "uuid",
  "title": "Cyberpunk City Rain",
  "content": "...",
  "complexity": 8,
  "created_at": "...",
  "tags": ["cyberpunk", "rain", "city"]
}
```

**Validation rules:**
| Field | Rule |
|-------|------|
| `title` | Required, min 3 characters |
| `content` | Required, min 20 characters |
| `complexity` | Required, integer 1–10 |
| `tags` | Optional, array of strings, max 8 |

**Error response (400):**
```json
{ "errors": { "title": "Title must be at least 3 characters." } }
```

#### `GET /prompts/:id/`
Retrieves a single prompt. **Increments view count in Redis on every call.**

```json
// Response 200
{
  "id": "uuid",
  "title": "Cyberpunk City Rain",
  "content": "...",
  "complexity": 8,
  "created_at": "...",
  "tags": ["cyberpunk"],
  "view_count": 7
}
```

#### `GET /prompts/tags/`
Returns all available tags for the filter UI.

```json
{ "tags": ["anime", "cyberpunk", "fantasy", "photorealistic"] }
```

---

## Architectural Decisions

### 1. Django without DRF (Django REST Framework)

All API views extend Django's built-in `View` class and return `JsonResponse`. JSON request bodies are parsed manually with `json.loads(request.body)`. This keeps the backend lightweight and avoids framework lock-in — the full API surface is implemented in ~150 lines of plain Python.

### 2. Redis as the Sole Source of Truth for View Counts

On every `GET /prompts/:id/` request, the backend calls `redis_client.incr(f"prompt:views:{id}")`. Redis's `INCR` command is atomic, so concurrent requests never cause a race condition. View counts are **never written to PostgreSQL** — Redis is the exclusive store. This pattern means:
- View counts survive container restarts (Redis volume is persisted via Docker named volume `redis_data`)
- Zero database I/O for counters — no table locking under read-heavy traffic

### 3. JWT Authentication (PyJWT — no auth framework)

Tokens are HS256-signed JWTs with a 7-day expiry, issued on login/register and validated on every protected endpoint via the `Authorization: Bearer <token>` header. The `get_user_from_token()` utility in `auth_app/utils.py` handles decode + User lookup. CSRF is disabled for API endpoints via `@csrf_exempt` since all mutations are protected by bearer tokens.

### 4. nginx as Unified Entry Point

The production container topology has **no exposed backend port**. nginx on port 80:
- Serves the pre-built React SPA for all non-API routes (`try_files $uri /index.html`)
- Reverse-proxies `/api/*` to the `backend:8000` container, stripping the `/api` prefix

This means the browser always addresses a single origin, eliminating CORS issues entirely in production.

### 5. Docker Health Checks + Dependency Ordering

The backend container's `entrypoint.sh` loops on `nc -z $DB_HOST $DB_PORT` before starting. Docker Compose `depends_on` with `condition: service_healthy` on both `db` and `redis` ensures the database is accepting connections before migrations run.

### 6. Tagging (Many-to-Many)

`Tag` is a standalone model with a `ManyToManyField` on `Prompt`. Tags are stored lowercase and deduplicated via `get_or_create`. The `GET /prompts/?tag=<name>` endpoint filters via `prompts.filter(tags__name=tag)` — a single JOIN query with no custom SQL.

---

## Bonus Features

| Feature | Status | Implementation |
|---------|--------|----------------|
| JWT Authentication | ✅ | PyJWT, `auth_app/` module, Bearer token scheme |
| Protected POST endpoint | ✅ | `get_user_from_token()` guard in `PromptListView.post` |
| Login + Register UI | ✅ | Tab-switched form at `/login` |
| Tagging System | ✅ | `Tag` model, M2M, `?tag=` filter param |
| Tag filter UI | ✅ | Pill bar on PromptList page |
| Tag chips input | ✅ | Keyboard-driven chip input on AddPrompt form |
| Live view counter | ✅ | Redis INCR, animated counter on PromptDetail |

---

## Default Credentials

The entrypoint script automatically creates a Django superuser on first boot:

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |

**Change this immediately in any production environment.**

Django admin panel: `http://localhost/api/admin/`

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | (insecure dev key) | Django secret key — **must change** in production |
| `DEBUG` | `True` | Set to `False` in production |
| `DB_NAME` | `promptlibrary` | PostgreSQL database name |
| `DB_USER` | `postgres` | PostgreSQL username |
| `DB_PASSWORD` | `postgres` | PostgreSQL password |
| `DB_HOST` | `db` | PostgreSQL hostname (Docker service name) |
| `DB_PORT` | `5432` | PostgreSQL port |
| `REDIS_HOST` | `redis` | Redis hostname |
| `REDIS_PORT` | `6379` | Redis port |
