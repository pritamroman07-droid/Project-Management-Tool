# ProManager — Project Management Tool

A full-stack, production-ready project management application built with the MERN stack.

## 🚀 Tech Stack

**Frontend:** React 18, Vite, Tailwind CSS, Redux Toolkit, React Router v6, Socket.io-client, Recharts, DnD Kit, FullCalendar, Gantt-task-react

**Backend:** Node.js, Express.js, MongoDB (Atlas), Mongoose, JWT Auth, bcryptjs, Socket.io, Gemini AI

---

## 📦 Features

- ✅ JWT Authentication + Refresh Tokens + 2FA (TOTP)
- ✅ Role-based access (Admin / Manager / Member)
- ✅ Project Management (CRUD, members, tags, templates)
- ✅ Task Management (subtasks, labels, time tracking, dependencies)
- ✅ Kanban Board with real-time drag-and-drop (DnD Kit + Socket.io)
- ✅ Gantt Chart (gantt-task-react)
- ✅ Calendar View (FullCalendar)
- ✅ Analytics Dashboard (Recharts: line, bar, pie charts)
- ✅ AI Productivity Insights (Google Gemini)
- ✅ Team / Workspace management
- ✅ Real-time notifications (Socket.io)
- ✅ PDF export (jsPDF)
- ✅ Dark / Light mode toggle
- ✅ Responsive UI with loading skeletons & toast notifications

---

## 🛠️ Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Google Gemini API key (free at [ai.google.dev](https://ai.google.dev))

### 1. Clone the repo
```bash
git clone https://github.com/pritamroman07-droid/Project-Management-Tool.git
cd Project-Management-Tool
```

### 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and fill in your MONGO_URI, JWT secrets, GEMINI_API_KEY
npm run dev
```

### 3. Frontend setup
```bash
cd frontend
npm install --legacy-peer-deps
# .env is pre-configured for localhost:5000
npm run dev
```

### 4. Open the app
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health check: http://localhost:5000/health

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/projectmanager
JWT_ACCESS_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 📁 Project Structure

```
Project-Management-Tool/
├── backend/
│   ├── src/
│   │   ├── config/        # DB, Socket.io, Gemini AI
│   │   ├── controllers/   # Auth, Projects, Tasks, Comments, Analytics...
│   │   ├── middleware/    # JWT auth, error handler, validators, activity logger
│   │   ├── models/        # User, Project, Task, Comment, Notification, Team, ActivityLog
│   │   └── routes/        # All API route files
│   └── server.js
└── frontend/
    └── src/
        ├── api/           # Axios instance + all API functions
        ├── components/    # Reusable UI (Button, Modal, Avatar, Badges...)
        ├── context/       # Socket.io + Theme contexts
        ├── hooks/         # Custom hooks
        ├── pages/         # All page components
        ├── routes/        # Protected/Public route guards
        └── store/         # Redux slices (auth, projects, tasks, notifications, ui)
```

---

## 📝 License

MIT
