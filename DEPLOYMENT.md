# FinTrack — Production Deployment Guide

This guide explains how to deploy **FinTrack** online with zero cost using **Vercel** (Frontend), **Render** or **Railway** (Backend with Cron Jobs), and **Neon** or **Supabase** (Serverless PostgreSQL).

---

## Architecture Overview

```
┌─────────────────────────────────┐
│     Client (React + Vite)       │
│  Hosted on Vercel               │
│  Domain: mybudget.vercel.app    │
└────────────────┬────────────────┘
                 │
                 │ HTTPS API calls (withCredentials: true)
                 ▼
┌─────────────────────────────────┐
│     Server (Express + Node.js)  │
│  Hosted on Render / Railway     │
│  Domain: mybudget-api.render.com│
└────────────────┬────────────────┘
                 │
                 │ Prisma Connection String (DATABASE_URL)
                 ▼
┌─────────────────────────────────┐
│    PostgreSQL Database          │
│  Hosted on Neon.tech / Supabase │
└─────────────────────────────────┘
```

---

## Step 1: Create a Free PostgreSQL Database (Neon)

1. Go to [neon.tech](https://neon.tech) and create a free account.
2. Click **Create Project** (Name: `mybudget`).
3. Copy the provided connection string:
   ```
   postgresql://[user]:[password]@[host]/[dbname]?sslmode=require
   ```
   *(Keep this connection string ready as `DATABASE_URL`)*.

---

## Step 2: Deploy the Backend API (Render)

1. Push your project repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "myBudget production ready"
   git branch -M main
   git remote add origin https://github.com/<your-username>/myBudget.git
   git push -u origin main
   ```
2. Go to [render.com](https://render.com) and click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Configure the settings:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   - `DATABASE_URL` = *(Your Neon PostgreSQL connection string)*
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
   - `JWT_SECRET` = *(Generate a strong random string, e.g. `openssl rand -hex 32`)*
   - `JWT_REFRESH_SECRET` = *(Generate another strong random string)*
   - `JWT_EXPIRES_IN` = `15m`
   - `JWT_REFRESH_EXPIRES_IN` = `7d`
   - `CLIENT_URL` = `https://<your-vercel-app-name>.vercel.app` *(update once Vercel deploys)*
   - `GEMINI_API_KEY` = *(Your Google Gemini API Key for AI Assistant)*
6. Run the initial database push from your terminal:
   ```bash
   npx prisma db push --schema=./prisma/schema.prisma
   ```
7. Click **Deploy Web Service**. Render will assign you a public URL (e.g., `https://mybudget-api.onrender.com`).

---

## Step 3: Deploy the Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) and click **Add New...** -> **Project**.
2. Select your `myBudget` GitHub repository.
3. Configure the Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click edit and select `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://mybudget-api.onrender.com` *(your Render backend URL from Step 2, no trailing slash)*
5. Click **Deploy**.
6. Once deployed, copy your Vercel URL (e.g., `https://mybudget-client.vercel.app`) and paste it back into your Render backend `CLIENT_URL` environment variable.

---

## Production Security & Stability Built-In

- **CORS Support**: `server/src/app.js` is pre-configured to accept requests from your `CLIENT_URL` and `*.vercel.app` domains.
- **Cross-Site Authentication Cookies**: `auth.controller.js` automatically uses `sameSite: 'none'` and `secure: true` in production, allowing HttpOnly JWT refresh cookies across Vercel and Render.
- **SPA Routing**: `client/vercel.json` contains route rewrites so direct navigation and browser refreshes work flawlessly on all routes.
- **Background Cron Jobs**: Recurring expenses, subscription billing, and monthly rollover cron jobs continue running 24/7 on the Node.js server.
