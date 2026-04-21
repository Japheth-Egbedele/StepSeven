# StepSeven Frontend (Vite)

## Environment

The frontend talks to the backend via `VITE_API_URL`.

### Local dev
`frontend/.env.development`:

```env
VITE_API_URL=http://localhost:5000
```

### Production (Vercel)
Set `VITE_API_URL` to your backend origin:

```env
VITE_API_URL=https://<your-render-service>.onrender.com
```

The app normalizes this internally to call `.../api/*`.

## Run

```bash
npm install
npm run dev
```
