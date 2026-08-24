# Skill Pack Hub

A small full-stack reference implementation for the assignment:
**Skill packs for non-Claude agent clients**.

It includes:
- React + Vite frontend
- Node.js + Express backend
- REST APIs for skill packs
- MCP capability metadata
- Client-specific extension packs for Cursor and Gemini
- Test/status tracking
- Documentation of client differences
## Project Structure

```text
Skillforge/
├── backend/
│   └── Node.js + Express backend
├── extensions/
│   ├── cursor/
│   │   └── skill-pack.json
│   └── gemini/
│       └── skill-pack.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── package.json
│   └── vite.config.js
└── README.md

## Run

### Backend
```bash
cd backend
npm install
npm run dev
```

Backend: http://localhost:5000

### Frontend
Open another terminal:
```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

The Vite dev server proxies `/api` requests to the backend.

## API

- `GET /api/health`
- `GET /api/skill-packs`
- `GET /api/skill-packs/:id`
- `POST /api/skill-packs`
- `PUT /api/skill-packs/:id`
- `DELETE /api/skill-packs/:id`
- `POST /api/skill-packs/:id/test`
- `GET /api/clients`

## Extension packs

See `extensions/` for client-specific capability definitions. These are intentionally adapted to each client's conventions rather than being byte-for-byte copies.
