# 🚀 Prescripto AI — Complete Deployment Guide

## Architecture Overview
- **Frontend**: Next.js 16 (React 19) → Deploy to **Vercel** (free tier)
- **Backend**: FastAPI + SQLite → Deploy to **Render** (free tier)
- **AI**: NVIDIA NIM / OpenAI API (configurable via env var)

---

## Step 1: Deploy Backend to Render

### 1.1 Push Backend to GitHub
```bash
cd backend
git init
git add .
git commit -m "Initial backend deploy"
# Create a repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/prescripto-backend.git
git push -u origin main
```

### 1.2 Create Render Web Service
1. Go to [render.com](https://render.com) and sign up/log in.
2. Click **New +** → **Web Service**.
3. Connect your GitHub repo (`prescripto-backend`).
4. Configure:
   - **Name**: `prescripto-backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Under **Environment Variables**, add:
   - `OPENAI_API_KEY` = your NVIDIA/OpenAI key
   - `JWT_SECRET` = a strong random string (e.g., generate with `openssl rand -hex 32`)
   - `DATABASE_URL` = `sqlite:///./sql_app.db`
   - `FRONTEND_URL` = (add after deploying frontend, e.g. `https://prescripto-ai.vercel.app`)
6. Click **Create Web Service**.
7. Wait for build to complete. Copy your backend URL (e.g., `https://prescripto-backend.onrender.com`).

### 1.3 Verify Backend
Visit `https://YOUR-BACKEND.onrender.com/api/v1/health` — you should see:
```json
{"status": "healthy", "version": "1.0.0"}
```

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Push Frontend to GitHub
```bash
cd frontend
git init
git add .
git commit -m "Initial frontend deploy"
git remote add origin https://github.com/YOUR_USERNAME/prescripto-frontend.git
git push -u origin main
```

### 2.2 Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and sign up/log in with GitHub.
2. Click **Add New → Project**.
3. Import your `prescripto-frontend` repo.
4. Vercel auto-detects Next.js. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL` = your Render backend URL (e.g., `https://prescripto-backend.onrender.com`)
5. Click **Deploy**.
6. Your app will be live at something like `https://prescripto-ai.vercel.app`.

### 2.3 Update Backend CORS
Go back to your Render dashboard and update the `FRONTEND_URL` environment variable to your new Vercel URL.

---

## Step 3: Custom Domain (Optional)

### On Vercel (Frontend)
1. Go to your project → **Settings** → **Domains**.
2. Add your domain (e.g., `prescripto.yourdomain.com`).
3. Update your domain's DNS as instructed by Vercel.

### On Render (Backend)
1. Go to your web service → **Settings** → **Custom Domains**.
2. Add your API domain (e.g., `api.prescripto.yourdomain.com`).
3. Update DNS records accordingly.
4. Update `NEXT_PUBLIC_API_URL` in Vercel to point to your custom API domain.

---

## Step 4: Mobile App (PWA)

This app is configured as a **Progressive Web App (PWA)**. Users can install it on their phone:

### Android
1. Open the deployed URL in Chrome.
2. Tap the **⋮ menu** → **"Add to Home Screen"** or **"Install app"**.
3. The app will appear as a native app icon.

### iOS
1. Open the deployed URL in Safari.
2. Tap the **Share button** (square with arrow).
3. Tap **"Add to Home Screen"**.
4. The app opens full-screen without browser chrome.

---

## Environment Variables Summary

### Backend (Render)
| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | NVIDIA NIM or OpenAI API key |
| `JWT_SECRET` | Secret key for JWT token signing |
| `DATABASE_URL` | `sqlite:///./sql_app.db` (or PostgreSQL URL) |
| `FRONTEND_URL` | Your Vercel frontend URL |

### Frontend (Vercel)
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Your Render backend URL |

---

## Production Checklist
- [ ] Backend deployed and `/api/v1/health` returns OK
- [ ] Frontend deployed and login page loads
- [ ] CORS configured (FRONTEND_URL matches Vercel URL)
- [ ] JWT_SECRET is a strong, unique value
- [ ] Full auth flow works (signup → login → protected pages)
- [ ] AI chat responds to messages
- [ ] Prescription scan works with image upload
- [ ] Medicine CRUD operations work
- [ ] PWA installable on mobile devices
