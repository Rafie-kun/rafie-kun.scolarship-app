# 🚀 ScholarPath Deployment Guide

ScholarPath is a **full-stack application** (Express API + SQLite + static frontend served from one process). The simplest deployments run it as a single web service.

---

## ⚙️ Required Environment Variables

| Variable | Required | Description |
| :--- | :--- | :--- |
| `JWT_SECRET` | **Yes (production)** | Long random string used to sign session tokens. The server refuses to boot without it. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `GEMINI_API_KEY` | Recommended | Google Gemini key powering all AI features. Without it the app falls back to offline heuristic responses. |
| `ADMIN_TOKEN` | Optional | Enables `POST /api/admin/import-universities` (send via the `x-admin-token` header). |

> ⚠️ Never commit real secrets to git. Set them in your hosting provider's dashboard or a local `.env` file.

---

## 🐳 Option 1: Docker (recommended for VPS / Cloud Run)

```bash
docker compose up --build -d
```

The container builds the frontend, bundles the server, and listens on port `3000`. Pass secrets via a `.env` file next to `docker-compose.yml` or `-e` flags.

---

## ☁️ Option 2: Render / Railway

1. Connect your GitHub repository.
2. Configure:
   * **Build Command**: `npm ci && npm run build`
   * **Start Command**: `node dist/server.cjs`
3. Add the environment variables above in the dashboard.
4. Attach a persistent disk mounted at `/app/data` if the platform supports it (Render/Railway do) so the SQLite database survives deploys.

---

## 🔒 Security Notes

- Sessions are signed JWTs stored in an HttpOnly cookie; `JWT_SECRET` must be unique per deployment.
- XP rewards are capped server-side; profile updates are field-whitelisted.
- Expensive AI endpoints require authentication.

## 💾 Data Persistence

SQLite lives at `data/app.db` (auto-created on first boot) and scraped datasets are written to `public/data/*.json`. Back these up, or mount them on a persistent volume.
