# Travel Booking System — Project Report

**Project:** Travel Booking System (Task Level 1 + Task Level 2)
**Stack:** Python (Flask), SQLAlchemy, SQLite, HTML/CSS/JavaScript
**Author:** _[your name here]_

This report maps each deliverable in the brief to what was actually built, so it's easy to walk through during a review.

---

## Task 1.1 — User Interface Design

Wireframes for all five core screens are in [`docs/wireframes/`](./wireframes):

| File | Screen |
|---|---|
| `01_home.svg` | Home / landing page with hero search |
| `02_search_results.svg` | Search results with filters and sorting |
| `03_login_register.svg` | Login and registration forms |
| `04_dashboard.svg` | User dashboard / my bookings |
| `05_booking_checkout.svg` | Booking summary and checkout |

These low-fidelity wireframes were then developed into the full visual design implemented in `templates/` and `static/css/style.css` — a warm navy/gold/sand color palette, `Fraunces` for headlines and `Inter` for body text, a pill-shaped hero search bar, and a departures-board-style list for search results. The live implementation is fully responsive (see the `@media` breakpoints in `style.css` for tablet and mobile layouts).

## Task 1.2 — Database Design

The ER diagram is at [`docs/database_schema.svg`](./database_schema.svg). Four tables:

- **`users`** — account credentials (hashed passwords, never stored in plain text).
- **`trips`** — the catalog of bookable flights, hotels, and buses.
- **`bookings`** — one row per booking; a snapshot of trip details is stored on the booking itself (not just a foreign key to `trips`) so that a booking's record stays accurate for the user even if the original listing changes or is removed later.
- **`payments`** — one payment record per booking, tracking amount, method, and a transaction ID.

Relationships: `users` 1→N `bookings`, `bookings` 1→1 `payments`. Full column definitions are in `models.py`.

## Task 2.3 — Backend Development

Built with **Flask** (`app.py`) and **Flask-SQLAlchemy** (`models.py`). Covers:
- Route handlers for every page (`/`, `/search`, `/dashboard`, `/booking/<id>`, `/login`, `/register`, `/logout`).
- JSON API endpoints: `GET /api/search`, `POST /api/book`, `POST /api/bookings/<id>/cancel`.
- Input validation (passenger counts, seat availability) and proper HTTP status codes for errors.
- A mock external data source (`seed_mock_data()`) standing in for a live travel API, structured so a real API call could be swapped in without changing the route logic.

## Task 2.4 — Front-End Development

`templates/` (Jinja2, extending a shared `base.html`) + `static/css/style.css` + `static/js/*.js`. No frontend framework — vanilla HTML/CSS/JS, using `fetch()` for all async calls (search, booking, cancellation) so pages don't fully reload. Responsive from desktop down to mobile.

## Task 2.5 — User Registration & Authentication

**Flask-Login** handles sessions. Passwords are hashed with Werkzeug's `generate_password_hash` — never stored or logged in plain text. `/dashboard` and `/booking/<id>` are protected with `@login_required` and redirect unauthenticated users to `/login`.

## Task 2.6 — Search & Booking Functionality

`GET /api/search` filters the `trips` table by source, destination, and type. The search page (`search.html` + `search.js`) reads query params from the URL, calls the API, and renders results client-side with sort controls (price / departure time). Booking (`booking.html` + `booking.js`) posts to `/api/book`, which checks seat availability, creates the `Booking` and `Payment` records, and decrements available seats — all in one transaction.

## Task 2.7 — Payment Integration (Optional)

Implemented as a **mock payment flow**: the user picks a payment method, the backend generates a transaction ID and records a `Payment` row with status `mock_success`, and the confirmation screen shows both the booking reference and transaction ID. This satisfies the flow end-to-end without needing live payment credentials. Swapping in a real gateway (e.g., Stripe test mode) would mean replacing the mock transaction ID generation in `api_book()` with an actual charge call — the rest of the booking/payment logic doesn't need to change.

## Task 2.8 — Hosting

The project includes everything needed for a free-tier deployment:
- `requirements.txt` — pinned dependencies.
- `Procfile` — `web: gunicorn app:app`, for Render/Railway.
- `.env.example` — environment variable template (secret key, DB URI).

See the **Deployment** section in the main [`README.md`](../README.md) for step-by-step instructions.

---

## Known limitations / possible extensions

- The "external API" is a seeded mock dataset rather than a live third-party travel API — swappable later without touching route structure.
- Payment is mock-only (explicitly optional per the brief).
- No admin panel for managing the trip catalog — trips are currently seeded once at startup.
