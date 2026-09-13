# Wayfare — Travel Booking System

A full-stack travel booking web application built with **Python (Flask)**, **SQLite**, and vanilla **HTML/CSS/JavaScript**. Built to fulfill an internship task brief covering UI/DB design, backend, frontend, auth, search & booking, mock payments, and free-tier hosting.

📄 **Full task-by-task breakdown:** see [`docs/PROJECT_REPORT.md`](docs/PROJECT_REPORT.md)
🖼️ **Wireframes:** see [`docs/wireframes/`](docs/wireframes)
🗂️ **Database ER diagram:** see [`docs/database_schema.svg`](docs/database_schema.svg)

## Features

- Responsive home page with a live search bar and "popular routes" feed
- Search & filter flights, hotels, and buses by source/destination/type, with client-side sorting
- User registration & login (hashed passwords, session auth via Flask-Login)
- Full booking flow: pick a trip → choose travelers & payment method → confirm → get a booking reference and transaction ID
- User dashboard listing all bookings, with the ability to cancel a confirmed booking
- Mock payment flow (see notes below on making this a real gateway)

## Project Structure

```
├── app.py                  # Flask app: routes, auth, API endpoints
├── models.py                # SQLAlchemy models: User, Trip, Booking, Payment
├── requirements.txt
├── Procfile                 # for Render / Railway deployment
├── .env.example
├── templates/
│   ├── base.html             # shared nav / footer / flash messages
│   ├── index.html            # home page
│   ├── search.html           # search results
│   ├── login.html / register.html
│   ├── dashboard.html        # my bookings
│   └── booking.html          # checkout page
├── static/
│   ├── css/style.css
│   └── js/ (main.js, search.js, booking.js, dashboard.js)
└── docs/
    ├── PROJECT_REPORT.md
    ├── database_schema.svg
    └── wireframes/ (5 SVG wireframes)
```

## Database Schema (overview)

- **`users`** — `id`, `name`, `email` (unique), `password_hash`, `phone`, `created_at`
- **`trips`** — `id`, `trip_type`, `provider`, `source`, `destination`, `departure_time`, `arrival_time`, `price`, `seats_available`
- **`bookings`** — `id`, `user_id` (FK), `trip_type`, `origin`, `destination`, `travel_date`, `return_date`, `passengers`, `status`, `total_price`, `created_at`
- **`payments`** — `id`, `booking_id` (FK), `amount`, `status`, `payment_method`, `transaction_id` (unique), `created_at`

Relationships: `User` 1:N `Booking`, `Booking` 1:1 `Payment`. Full ER diagram: [`docs/database_schema.svg`](docs/database_schema.svg).

## Local Setup

1. **Clone the project and enter the folder.**

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate   # Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

5. **Initialize the database (creates tables and seeds sample trips):**
   ```bash
   python -c "from app import app, db, seed_mock_data; app.app_context().push(); db.create_all(); seed_mock_data()"
   ```

6. **Run the app:**
   ```bash
   flask run
   ```

7. Open `http://127.0.0.1:5000` in your browser.

## Deployment (Free Hosting)

### Option A — Render or Railway
1. Push this project to a GitHub repository.
2. Create a new Web Service on [Render](https://render.com) or [Railway](https://railway.app) and connect the repo.
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn app:app` (already set in `Procfile`)
5. Add environment variables from `.env.example` in the dashboard (`SECRET_KEY`, `SQLALCHEMY_DATABASE_URI`).
6. Deploy. Render/Railway will give you a public URL.

### Option B — PythonAnywhere
1. Upload the project files (or clone from GitHub) in a PythonAnywhere console.
2. Create a virtualenv and `pip install -r requirements.txt`.
3. Go to the **Web** tab → Add a new web app → Flask → point the WSGI file to `app.app`.
4. Reload the web app.

> **Important:** Change `SECRET_KEY` to a real random value in production — never use the default from `.env.example`. Also note SQLite is fine for a demo/internship submission but isn't recommended for a real multi-user production deployment; swap `SQLALCHEMY_DATABASE_URI` for a managed Postgres instance if you outgrow it.

## Notes on Payment Integration

Payment integration was explicitly marked optional in the brief. This project implements a **mock payment flow**: booking a trip generates a transaction ID and a `Payment` record with status `mock_success`, so the full booking-confirmation experience works end-to-end without needing real payment credentials. To upgrade to a real gateway (e.g., Stripe test mode), you'd only need to replace the mock transaction logic inside `api_book()` in `app.py` — the booking/payment data model already supports it.

## Default Login (after seeding)

No demo user is pre-created — register a new account from the **Sign up** page to try the full flow.
