
# 🎓 Aditya University Quiz Portal

A high-performance, AI-integrated digital assessment platform designed for Aditya University. Features include AI-powered question generation, real-time performance analytics, and an interactive AI academic assistant.

## 🚀 Quick Start (Local)

1.  **Clone the repo:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run development server:**
    ```bash
    npm run dev
    ```

## 🌐 Deployment (Vercel)

This app is optimized for Vercel. 

1.  Push your code to GitHub.
2.  Connect your GitHub repo to Vercel.
3.  **Environment Variable:** Add `API_KEY` in the Vercel dashboard using your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
4.  Deploy!

## ✨ Key Features

- **Students:** Interactive quizzes, AI-powered "Why did I get this wrong?" explanations, and topic mastery heatmaps.
- **Admins:** Full curriculum management and AI-assisted question generation.
- **AI Tutor:** A persistent Gemini-powered chat box for academic support (auto-hides during quizzes for integrity).
- **Responsive Design:** Beautifully crafted with Tailwind CSS and Glass-morphism effects.

## 🛠️ Tech Stack

- **Framework:** React 19
- **Styling:** Tailwind CSS
- **AI:** Google Gemini API (@google/genai)
- **Charts:** Recharts
- **Icons:** Custom SVG Component Library
