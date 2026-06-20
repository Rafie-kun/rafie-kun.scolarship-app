# 🚀 ScholarPath: Comprehensive & No-Jargon Deployment Guide

This step-by-step tutorial explains how to host your newly overhauled **ScholarPath** application on the internet completely for free!

We will deploy our application in a secure, modern full-stack split configuration:
1. **Frontend (UI Interface)**: Hosted on **GitHub Pages** (always free).
2. **Backend (Server & Gemini API Proxy)**: Hosted on **Render** or **Railway** (free tiers).

---

## 🛠️ Phase 1: Host Your Backend on Render (Free)

The backend server is responsible for handling login/registration, managing the database, and securely proxying your Gemini API calls without exposing passwords or keys.

### 1. Register a Render Account
1. Go to [Render](https://render.com/) and click **Sign Up** (authenticating with your GitHub account is recommended).

### 2. Prepare the Code Repository
Ensure your codebase containing both frontend and backend directories is pushed to a private or public **GitHub Repository** (e.g., `github.com/yourusername/scholarpath`).

### 3. Create a New Web Service on Render
1. From the Render Dashboard, click the blue **New +** button and select **Web Service**.
2. Connect your **GitHub Repository** to Render.
3. Configure the following settings exactly:
   * **Name**: `scholarpath-backend` (or any name you like)
   * **Language**: `Node`
   * **Branch**: `main` (or whichever branch you push code to)
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `node dist/server.cjs` or modern startup equivalent.
   * **Instance Type**: Select **Free** ($0/month).

### 4. Setup Secure Environment Variables
In the Render Web Service creation interface, click **Advanced** or navigate to the **Environment** tab inside the dashboard, and add these key-value rows:

| Environment Key | Recommended Value / Description |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Generate a deep random string (e.g. `Xk82h&9W#sL1!)Pq9`) to encrypt session logins securely |
| `GEMINI_API_KEY` | Paste your official standard developers Gemini API key securely here |
| `FRONTEND_URL` | Your GitHub Pages URL (e.g. `https://yourusername.github.io/scholarpath`) - *You can fill this in after setting up the frontend.* |

5. Click **Create Web Service**. 
6. Wait for Render to finish building. Once the build yields **`Live`**, click and copy your dynamic backend API URL from the top of the Render screen (looks like `https://scholarpath-backend.onrender.com`).

---

## 🌐 Phase 2: Host Your Frontend on GitHub Pages (Free)

We will now build the static client interface files, link them to our newly deployed Render backend, and host them on GitHub Pages.

### 1. Update the API Endpoint Base URL in Code
Before generating your final build files, update your API configurations in the frontend so requests are sent directly to your Render backend instead of localhost.

1. Locate the custom fetch settings files (such as base URL setups or `AuthContext.tsx`).
2. Update the API fetch target:
   ```typescript
   // Locate where the base URL or authorizedFetch URL is assembled
   // Replace localhost target with your copied Render backend URL:
   const API_BASE_URL = "https://scholarpath-backend.onrender.com"; 
   ```

### 2. Configure GitHub Pages Deployment Actions
You can automatically deploy with GitHub Actions on every push:
1. In the root of your project, ensure `vite.config.ts` has a base path set matching your repo name:
   ```typescript
   export default defineConfig({
     base: '/scholarpath/', // Set to your GitHub repository folder name
     // ...
   });
   ```
2. Navigate to your repository page on GitHub.
3. Click the **Settings** tab.
4. On the left sidebar, click **Pages**.
5. Under "Build and deployment" -> **Source**, select **GitHub Actions**.
6. GitHub will automate the build and host your site directly on `https://yourusername.github.io/scholarpath`!

---

## 🧪 Phase 3: Post-Deployment Testing

Verify that your secure systems, database profiles, and mock AI components run flawlessly over the production URL:

1. **Connect & Register**: Go to your live URL `https://yourusername.github.io/scholarpath`, click **Register** to create a fresh secure profile. Verify that password hashes and tokens save properly on creation.
2. **Check Quest Achievements**: Edit your academic stand-out scores, GPA limits, and check milestones off your timeline tracking boards. Confirm that Fellowship XP triggers exactly **once** without looping.
3. **Verify AI Oracle Interactions**: Paste rawStatement of Purpose paragraphs in the Scroll Vault, or run an Admissions Simulation. Check that the Render backend queries Gemini APIs perfectly and returns accurate Markdown advice on your terminal screen.
