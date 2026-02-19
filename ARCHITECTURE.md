
# 🎓 Aditya University Quiz Portal - System Architecture

This document explains how the application is structured, how the files connect, and how the logic flows between the Student/Faculty roles, the Supabase database, and the Gemini AI.

---

## 🏗️ Project Structure & File Roles

### 1. Entry & Configuration
*   **`index.html`**: The main entry page. It includes Tailwind CSS, Google Fonts, and the global styles for the "Glass-morphism" UI.
*   **`index.tsx`**: The React entry point. It hooks the React application into the `root` div in `index.html`.
*   **`vite.config.ts`**: Configures the build system. It handles environment variables (like your `API_KEY`) and ensures the app works when deployed.
*   **`package.json`**: Lists all dependencies like `@supabase/supabase-js` (database) and `@google/genai` (AI).

### 2. Data Models & Constants
*   **`types.ts`**: The "Dictionary" of the app. Defines what a `User`, `Quiz`, `Question`, and `Attempt` look like. This ensures every part of the app uses the same data structure.
*   **`constants.tsx`**: Contains static data like categories (Computer Science, Engineering, etc.) and fallback mock data for when the database is empty.

### 3. Services (The Engine)
*   **`services/db.ts`**: **The Database Bridge.** It connects to Supabase. It contains functions to `getQuizzes`, `saveAttempt`, and `findUser`. If Supabase keys aren't provided, it automatically falls back to `localStorage` so the app doesn't crash.
*   **`services/gemini.ts`**: **The AI Engine.** It talks to Google Gemini. It handles:
    *   `chatWithAI`: General academic help.
    *   `explainWrongAnswer`: Personalized feedback for students.
    *   `generateAIQuestions`: Creating new quiz content for faculty.

### 4. Logic & State Management
*   **`App.tsx`**: **The "Brain" of the App.** 
    *   It manages the global state (who is logged in, what quizzes exist).
    *   It handles "Routing" (switching between the Dashboard, Admin Console, and Analytics).
    *   It triggers the initial database sync when the app loads.

### 5. Components (The Interface)
*   **`Auth.tsx`**: Handles Login and Registration. It includes the "Faculty Verification Code" (`AUS_FACULTY`) logic to protect admin access.
*   **`QuizPlayer.tsx`**: The interactive interface for students. It handles the 1000ms timer, LIFO/FIFO logic, and progress tracking.
*   **`QuizEditor.tsx`**: The faculty's toolkit. Allows manual quiz creation or AI-assisted generation.
*   **`AIChatBox.tsx`**: A floating AI assistant available throughout the portal.
*   **`Icons.tsx`**: A library of custom SVG icons used for navigation.

---

## 🔄 How Everything Connects (Data Flow)

### 1. Authentication Flow
1.  User enters credentials in `Auth.tsx`.
2.  `Auth.tsx` calls `db.findUser()` in `services/db.ts`.
3.  `services/db.ts` queries the **Supabase `users` table**.
4.  If valid, `App.tsx` stores the user in state and `localStorage`.

### 2. Quiz Lifecycle
1.  **Faculty** creates a quiz in `QuizEditor.tsx`.
2.  `QuizEditor.tsx` sends data to `db.saveQuiz()`.
3.  **Student** sees the quiz on their Dashboard (`App.tsx` -> `quizzes` state).
4.  Student starts `QuizPlayer.tsx`. Upon finishing, it sends a `QuizAttempt` to `db.saveAttempt()`.
5.  **Analytics** (`App.tsx` -> `view === 'stats'`) fetches these attempts to draw graphs using **Recharts**.

### 3. AI Integration
1.  When a student misses a question, they click "Explain AI".
2.  `App.tsx` calls `explainWrongAnswer` in `services/gemini.ts`.
3.  Gemini receives the question and the student's wrong choice, then returns a friendly explanation.

---

## 🔐 Role-Based Access Control (RBAC)
*   **Faculty (ADMIN)**: 
    *   Must provide `AUS_FACULTY` during registration.
    *   Redirected to the **Faculty Console** by default.
    *   Can create, edit, and delete quizzes in the database.
*   **Student (STUDENT)**:
    *   Redirected to the **Student Hub** dashboard.
    *   Can only attempt quizzes and view their own performance analytics.

---

## 🛠️ To Connect Your College Database
1.  Set up a **Supabase** project.
2.  Run the SQL schema (provided in the previous chat) in the Supabase SQL Editor.
3.  Add your `SUPABASE_URL` and `SUPABASE_ANON_KEY` to your environment variables.
4.  The app will automatically switch from `localStorage` to your real cloud database!
