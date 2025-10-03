# 3D Printing Stall Management System

Full-stack inventory and sales management application tailored for running a small 3D printing stall. The system provides a real-time dashboard, inventory controls, sales session tracking, and automatic stock updates with optional product imagery.

## Tech Stack

- **Backend:** Node.js, Express, SQLite (`better-sqlite3`), Multer for image uploads
- **Frontend:** React (Vite), React Router, Day.js
- **Build/Tooling:** npm, Concurrently, Nodemon

## Project Structure

```
3DPSMS/
├── server/                 # Express API, SQLite schema, file uploads
│   ├── src/
│   │   ├── routes/         # REST endpoints (inventory, sessions, dashboard)
│   │   ├── services/       # Business logic and DB access helpers
│   │   ├── middleware/     # Multer upload config
│   │   └── utils/          # Shared helpers (currency, files)
│   └── uploads/            # Stored product images (created at runtime)
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── pages/          # Dashboard, Inventory, Sales pages
│   │   ├── api/            # API wrapper
│   │   └── utils/          # UI helpers (formatters)
└── README.md
```

## Getting Started

```bash
# 1. Install dependencies for server and client
npm install
npm run install:all

# 2. Start backend and frontend together (server on :4000, Vite on :5173)
npm run dev
```

The first run will create `server/data/3dpsms.sqlite` plus `server/uploads/` for product images.

### Running Pieces Individually

```bash
# API only (runs on http://localhost:4000)
npm run server

# Frontend only (runs on http://localhost:5173)
npm run client
```

## Environment Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `4000` | Express server port |
| `DB_PATH` | `server/data/3dpsms.sqlite` | SQLite database file |
| `VITE_API_BASE_URL` | `http://localhost:4000/api` | Frontend API base (set in `.env` if deploying) |

## Key Features

- **Dashboard** – Highlights today’s active sales session, low stock alerts, and recent performance trends.
- **Inventory Management** – Create/update products, adjust counts when new prints finish, view sales & revenue per item, and attach product images stored on disk.
- **Sales Sessions** – Start sessions for specific markets or pop-ups, log sales rapidly with auto-inventory deductions, close sessions, and review historical performance.

## API Overview (selected endpoints)

- `GET /api/dashboard` – Dashboard snapshot (today’s session summary, low stock, trends)
- `GET /api/items` / `POST /api/items` – List or create inventory (supports multipart uploads via `image` field)
- `PUT /api/items/:id` – Update item details (use `removeImage=true` to clear existing image)
- `POST /api/items/:id/adjust` – Increment/decrement stock with audit log
- `POST /api/sessions` / `POST /api/sessions/:id/close` – Manage sales sessions
- `POST /api/sessions/:id/sales` – Log a sale (updates stock + history automatically)

## Tests & Verification

- `client`: `npm run build` (Vite production build) ✓
- `server`: sanity boot via `node src/index.js` (exits after short delay) ✓

## Notes

- Product images are stored under `server/uploads/` and exposed at `http://<api-host>/uploads/<filename>`.
- The SQLite database is local; back up `server/data/3dpsms.sqlite` for persistence.
- The architecture keeps service logic isolated from route handlers, making it easier to extend (e.g., add analytics, customer tracking, or export tooling).
