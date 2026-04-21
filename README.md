# StepSeven

Nigerian-focused budgeting + cashflow tracking with Dave Ramsey’s Baby Steps built in.

## Daily workflow (how you’ll use it)
- **Create accounts** (Cash, Bank, etc) and enter your **starting balances**.
- **Create transactions daily** (income/expense) and optional **transfers** between accounts.
- Use **filters + analytics** to review spending and progress.

## Tech stack
- **Backend**: Node.js + Express + MongoDB (Mongoose)
- **Frontend**: React (Vite) + React Router + Context + Axios
- **Auth**: JWT stored in **HTTP-only cookie**

## Quick start (local dev)

### Prereqs
- Node.js 18+
- MongoDB 6+

### 1) Backend
From repo root:

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/stepseven
JWT_SECRET=replace_me_with_32+_chars
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

Run:

```bash
npm run dev
```

Health check: `GET http://localhost:5000/api/health`

### 2) Frontend
From repo root:

```bash
cd frontend
npm install
```

Create `frontend/.env.development` (or use the existing one):

```env
VITE_API_URL=http://localhost:5000
```

Run:

```bash
npm run dev
```

Open `http://localhost:5173`.

## Deployment (Vercel frontend + Render backend)

### Backend env (Render)
- **`NODE_ENV=production`**
- **`MONGO_URI=...`**
- **`JWT_SECRET=...`**
- **`CLIENT_URL=https://<your-vercel-app>.vercel.app`**

### Frontend env (Vercel)
- **`VITE_API_URL=https://<your-render-service>.onrender.com`**

Notes:
- The frontend app automatically normalizes `VITE_API_URL` to target `.../api` (so both `https://host` and `https://host/api` work).
- Auth uses an HTTP-only cookie. In production the API sets cookie attributes compatible with cross-site requests (`SameSite=None; Secure`).

## Troubleshooting
- **404 calling `/auth/me`**: your frontend is hitting the API without `/api` in the base URL. Ensure `VITE_API_URL` is set correctly.
- **401 loops back to login after signing in**: cookie likely not being sent (wrong `CLIENT_URL`, CORS not allowing your origin, or missing HTTPS in production).
