# ScholarPath 🎓🚀

ScholarPath is an AI-powered student success ecosystem designed to connect international students with global university admissions, fully funded scholarship programs, and advanced application coaching.

Rather than a simple listing index, ScholarPath represents a comprehensive workstation and workspace built upon a gamified adventure theme, providing high-efficiency guidance for students from Bangladesh, India, and across the globe.

---

## 🛠️ The Two-Panel Paradigm

ScholarPath is structured into two dedicated panels of operation designed to optimize student focus and workflow productivity:

### 1. 🏡 Panel 1: Student Homepage
An atmospheric, high-impact adventure launchpad tailored to discover top-fund opportunities and engage with the student cohort:
* **The Plains Overlook Grid**: Review live, bespoke scholarship recommendations and high-ranking comparable university databases centered on student GPAs and degree majors.
* **The Town Square Forum**: Share admission tips, DAAD curriculum analysis advice, and Chevening essay strategies in our community subreddits.
* **Alumni Mentorship Registry**: Request dynamic booking sessions with certified alumni who won fully funded slots at Cambridge, Stanford, or Munich.
* **The Wise Librarian (AI Study Copilot)**: A full-featured Chat terminal integrating server-side RAG to help students analyze and resolve eligibility checks instantly.

### 2. 💻 Panel 2: ScholarPath Studio
An elite, workspace-inspired lab built to craft, tailor, and prepare documents for admission reviews:
* **The Admissions planner tracker**: Track application checklists, update notes, and manage application states (Saved, In Progress, Submitted, Winner!).
* **The Alchemy Simulator (Dream University Lab)**: Hypothesize GPA tweaks, project additions, and essay hook focus topics to run admission simulations using historic international admissions vectors.
* **The Redstone Forge (AI Personalized Path)**: Generate gamified, step-by-step custom activity checklists, online courses, and skills schemas over multi-month timescales.
* **The Document Upload & Review Center**: Review personal SOP statements or full profile resumes for immediate line-level critical markup, grammar ratings, and high-impact hook generation via the Gemini API.
* **Mock Interview Training**: Engage in voice-like simulations with our conversational panel board. Try out challenging admissions queries!
* **The Portfolio Exporter**: Export timelines, application checklists, CV summaries, or essays to .docx, .md, .html, or .json schemas instantly.

---

## 🏗️ Technology Architecture

* **Frontend**: React 19 + TypeScript, styled via modern high-contrast Tailwind CSS v4, utilizing motion layout transitions.
* **Backend**: Express (Node.js) proxy server executing full-stack routing models to keep keys hidden from client bundles.
* **Artificial Intelligence**: Integrates the official `@google/genai` TypeScript SDK utilizing `gemini-3.5-flash` for high-efficiency, evidence-based counseling, matching, and editing operations.
* **Packaging**: Configured for lightweight multi-stage Docker compilation, binding to port `3000` internally.

---

## 🚀 Installation & Local Launch

### Prerequisites
* Node.js v20+ with NPM
* A validated Google Gemini API Key

### Setup Variables
Copy the dotenv example:
```bash
cp .env.example .env
```
Populate `.env` with your dedicated secret:
```env
GEMINI_API_KEY="AIzaSy..."
```

### Installation
```bash
# Install NPM items
npm install
```

### Run Local Development Server
```bash
# Runs full-stack hot-reload server (Express + Vite)
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Running with Docker Container

Compile and run the entire localized stack cleanly in isolated environments:

### Using Docker Compose
```bash
docker-compose up --build
```

### Or using Docker CLI directly
```bash
docker build -t scholarpath .
docker run -p 3000:3000 --env-file .env scholarpath
```

---

## ☁️ Production Deployment Guide

ScholarPath is built with standard portability in mind and can be easily hosted online:

### 🌐 Frontend Hosting (Static Assets)
The static files compile directly to `dist/` on build:
* **GitHub Pages / Vercel**: Import and point to the static `dist/` root directory.

### ⚙️ Full-Stack / Backend Hosting (Docker & Express API)
To support active AI matching, document analysis, and PDF/DOCX compiler loops, deploy the server container directly:
* **Railway / Render**: Connect your GitHub repository, assign your `GEMINI_API_KEY` environment secret, and deployment will automatically launch standard Dockerfile builds on port `3500` or `3000`!
* **Google Cloud Run**: Execute clean cluster deployments utilizing standard container engines.
