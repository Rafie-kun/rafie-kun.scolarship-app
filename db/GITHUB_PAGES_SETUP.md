# 🚀 GitHub Pages Deploy Guide (ScholarPath Minecraft Edition)

GitHub Pages hosts **pure static web applications** (HTML, CSS, JS) directly from a GitHub repository. Because GitHub Pages does not run active Node.js/Express servers, this guide outlines how to easily deploy and run ScholarPath statically natively on GitHub Pages by serving data locally or using a serverless approach.

---

## 🛠️ Step 1: Add Relative Base Paths to Vite
By default, Vite builds assets using absolute root paths (e.g., `/assets/index.js`), which fail when hosted inside GitHub project subdirectories (e.g., `https://your-username.github.io/scholarpath-app/`).

Update your `vite.config.ts` to use relative paths (`base: './'`):

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './', // 🌟 Essential for GitHub Pages subfolders!
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});
```

---

## 💾 Step 2: Make API Reads Serverless-Compatible
To display database info (scholarships list, universities) without an active database, you can load static payload chunk arrays inside the client, or place JSON files directly into the compiled output.

### Options 1: Define Local Fallbacks in your components
Replace HTTP server requests with local storage states and static catalogs inside elements like `src/components/ScholarshipsView.tsx` and `src/components/UniversitiesView.tsx`. This avoids throwing `404` errors when running strictly offline.

### Option 2: Serverless Static JSON Route-Bypassing
A very neat trick is putting fallback JSON files inside your `public/` folder so static HTTP calls resolve successfully!
For example, create:
* `public/api/profile` containing the user profile object
* `public/api/scholarships` containing the scholarship objects array
* `public/api/universities` containing the university objects array
* `public/api/notifications` containing notification lists

Vite bundles all contents of `public/` into the build output root, enabling standard fetches to succeed even on static hosting sites!

---

## 📦 Step 3: Create Automated GitHub Action Workflow
Avoid compiling assets locally! You can configure a workflow that triggers a fresh build and pushes it to your static host automatically on every commit.

1. In your project root, create directories: `.github/workflows/`
2. Create a file named `deploy.yml` with the following content:

```yaml
# .github/workflows/deploy.yml
name: Deploy ScholarPath to GitHub Pages

on:
  push:
    branches:
      - main # Runs on pushes to the main branch

permissions:
  contents: write

jobs:
  build-and-deploy:
    concurrency: ci-${{ github.ref }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository 🛎️
        uses: actions/checkout@v4

      - name: Set up Node.js ⚙️
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies 🔧
        run: npm ci

      - name: Compile and Build Assets 🧪
        run: npm run build

      - name: Deploy Static Build to GitHub Pages 🚀
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: dist # Vite output directory
          branch: gh-pages # Pushes compiled assets to the gh-pages branch
```

---

## 🏗️ Step 4: Configure GitHub Settings
Once you push your code to your repository:

1. Navigate to your new GitHub Repository on **GitHub.com**.
2. Click on the ⚙️ **Settings** tab.
3. Scroll down the sidebar menu to find **Pages** under the "Code and automation" section.
4. Under **Build and deployment**:
   * **Source**: Choose `Deploy from a branch`
   * **Branch**: Select the compiled branch: `gh-pages` and select root folder `/` (this branch is auto-created by the action workflow in Step 3).
5. Click **Save**.
6. Refresh the page after 1 minute; you will see the active live link:
   🚀 **`https://your-username.github.io/scholarpath-app/`**

---

## 🎮 Local Offline Mode & Sound Assets
* For custom game audio cues to play without remote asset servers, ensure all `.wav` or `.mp3` level-up sounds are placed inside your `public/sounds/` folder so relative client-side assets fetch instantly on the browser side.
