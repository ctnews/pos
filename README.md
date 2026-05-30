# pos

Point of Sale web application (React + TypeScript + Express + MongoDB).

## Setup (local)

1. Copy `.env.example` to `.env` and set your MongoDB URI.
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev`

Default admin login: `admin` / `admin123`

## Deploy on Vercel

Vercel runs the React app and the API as a serverless function. MongoDB Atlas must allow Vercel’s dynamic IPs.

### 1. MongoDB Atlas — Network Access

In [MongoDB Atlas](https://cloud.mongodb.com) → **Network Access** → **Add IP Address**:

- Choose **Allow Access from Anywhere** (`0.0.0.0/0`)

Vercel does not use a fixed IP, so whitelisting a single server IP will not work.

### 2. Vercel — Environment Variables

In your Vercel project → **Settings** → **Environment Variables**, add:

| Variable | Value |
|----------|--------|
| `MONGODB_URI` | Your Atlas connection string (`mongodb+srv://...`) |
| `DB_MODE` | `mongo` |
| `JWT_SECRET` | A long random string (e.g. 32+ characters) |

Do **not** commit `.env` to GitHub.

### 3. Deploy

Push to GitHub; Vercel will build with `npm run build` and serve:

- Frontend from `dist/`
- API at `/api/*` via the serverless handler in `api/index.ts`

### 4. Verify

After deploy, open:

- `https://your-app.vercel.app/api/health` → should show `"dbMode":"mongo"`
- Sign in with `admin` / `admin123`

If MongoDB fails, check Vercel **Functions** logs for connection errors.
