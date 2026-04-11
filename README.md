<div align="center">

```
 _____ _____ _____ _____   _____ _____ ___ _____ 
/  ___|_   _|_   _|  ___| /  ___|_   _/ _ \_   _|
\ `--.  | |   | | | |__   \ `--.  | |/ /_\ \| |  
 `--. \ | |   | | |  __|   `--. \ | ||  _  || |  
/\__/ /_| |_  | | | |___  /\__/ / | || | | || |  
\____/ \___/  \_/ \____/  \____/  \_/\_| |_/\_/  
```

### Civil Engineering · Labor Intelligence · Real-Time Analytics

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

*Engineered to eliminate paperwork. Built for the field.*

</div>

---

## 🏗️ What is Site Stat?

> **Site Stat** is a purpose-built web application for civil engineering operations — a centralized command center that replaces slow, error-prone manual data entry with a fast, secure, and intelligent dashboard. From tracking daily labor across multiple shifts to generating site-wide analytics at a glance, Site Stat brings enterprise-grade tooling directly to the construction site.

No more clipboards. No more spreadsheets. No more guessing.

---

## ✨ Core Features

### 📊 &nbsp;Real-Time Dashboard
A live, high-level overview of your entire operation — active workforce counts, daily site statistics, and critical KPIs — all updating in real time without a single page refresh.

### 👷 &nbsp;Labor Tracking System
Log, manage, and archive daily labor data across projects and shifts with precision. Built-in historical records mean your workforce data is always audit-ready and instantly accessible.

### 🔐 &nbsp;Secure Backend Architecture
Powered by **Supabase** with PostgreSQL under the hood. Row Level Security (RLS) ensures your civil engineering data stays strictly confidential — accessible only to those who are authorized.

### 📱 &nbsp;Responsive Field UI
Designed for real conditions. Whether you're at a desktop in the office or on a phone at the job site, the clean, minimalist interface adapts seamlessly so nothing slows you down.

---

## 🛠️ Technical Stack

| Layer | Technology |
|-------|------------|
| **Frontend Framework** | React + Vite + TypeScript |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **Data Security** | Row Level Security (RLS) |
| **Deployment** | Vercel (Edge Network) |

---

## 💻 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A [Supabase](https://supabase.com/) project with your credentials ready

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### Step 2 — Install Dependencies

```bash
npm install
```

### Step 3 — Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> 💡 Find these values in your Supabase project under **Settings → API**.

### Step 4 — Launch the Dev Server

```bash
npm run dev
```

The app will be live at **`http://localhost:5173`** 🚀

---

## 🌍 Architecture & Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                        VERCEL EDGE                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │               React + Vite + TypeScript             │    │
│  │           (Responsive Field UI / Dashboard)         │    │
│  └────────────────────────┬────────────────────────────┘    │
│                           │                                 │
│              Real-time subscriptions & REST                 │
│                           │                                 │
│  ┌────────────────────────▼────────────────────────────┐    │
│  │                    SUPABASE                         │    │
│  │   PostgreSQL  │  Auth  │  Row Level Security (RLS)  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

Site Stat is deployed on **Vercel's global edge network** for sub-second load times anywhere. Supabase handles all backend complexity — authentication, real-time data sync, and iron-clad access control — so the front end stays lean and fast.

---

## 🔒 Security Model

Security is not an afterthought in Site Stat — it's baked into every layer:

- **Row Level Security (RLS):** Database-level policies ensure users can only access data they're explicitly authorized to see.
- **Supabase Auth:** Secure token-based authentication out of the box.
- **Environment Isolation:** All sensitive credentials are handled via environment variables — never hardcoded.
- **Edge Deployment:** No origin server to compromise; Vercel's infrastructure handles DDoS protection and TLS automatically.

---

## 📁 Project Structure

```
site-stat/
├── public/                  # Static assets
├── src/
│   ├── components/          # Reusable UI components (shadcn/ui)
│   ├── pages/               # Route-level page components
│   ├── lib/                 # Supabase client & utilities
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript type definitions
│   └── main.tsx             # Application entry point
├── .env                     # 🔒 Local environment variables (not committed)
├── vite.config.ts           # Vite configuration
├── tailwind.config.ts       # Tailwind configuration
└── package.json
```

---

## 🚀 Deployment

Site Stat is optimized for one-click deployment on Vercel:

1. Push your repository to GitHub
2. Import the project on [vercel.com](https://vercel.com)
3. Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in the Vercel dashboard
4. Deploy — Vercel handles the rest

---

<div align="center">

---

**Architected & Developed by [Inderjeet Singh](https://github.com/YOUR_USERNAME)**

*Built with precision. Deployed with confidence.*

---

</div>
### 📱 &nbsp;Responsive Field UI
Designed for real conditions. Whether you're at a desktop in the office or on a phone at the job site, the clean, minimalist interface adapts seamlessly so nothing slows you down.

---

## 🛠️ Technical Stack

| Layer | Technology |
|-------|------------|
| **Frontend Framework** | React + Vite + TypeScript |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **Data Security** | Row Level Security (RLS) |
| **Deployment** | Vercel (Edge Network) |

---

## 💻 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A [Supabase](https://supabase.com/) project with your credentials ready

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### Step 2 — Install Dependencies

```bash
npm install
```

### Step 3 — Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> 💡 Find these values in your Supabase project under **Settings → API**.

### Step 4 — Launch the Dev Server

```bash
npm run dev
```

The app will be live at **`http://localhost:5173`** 🚀

---

## 🌍 Architecture & Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                        VERCEL EDGE                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │               React + Vite + TypeScript             │    │
│  │           (Responsive Field UI / Dashboard)         │    │
│  └────────────────────────┬────────────────────────────┘    │
│                           │                                 │
│              Real-time subscriptions & REST                 │
│                           │                                 │
│  ┌────────────────────────▼────────────────────────────┐    │
│  │                    SUPABASE                         │    │
│  │   PostgreSQL  │  Auth  │  Row Level Security (RLS)  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

Site Stat is deployed on **Vercel's global edge network** for sub-second load times anywhere. Supabase handles all backend complexity — authentication, real-time data sync, and iron-clad access control — so the front end stays lean and fast.

---

## 🔒 Security Model

Security is not an afterthought in Site Stat — it's baked into every layer:

- **Row Level Security (RLS):** Database-level policies ensure users can only access data they're explicitly authorized to see.
- **Supabase Auth:** Secure token-based authentication out of the box.
- **Environment Isolation:** All sensitive credentials are handled via environment variables — never hardcoded.
- **Edge Deployment:** No origin server to compromise; Vercel's infrastructure handles DDoS protection and TLS automatically.

---

## 📁 Project Structure

```
site-stat/
├── public/                  # Static assets
├── src/
│   ├── components/          # Reusable UI components (shadcn/ui)
│   ├── pages/               # Route-level page components
│   ├── lib/                 # Supabase client & utilities
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript type definitions
│   └── main.tsx             # Application entry point
├── .env                     # 🔒 Local environment variables (not committed)
├── vite.config.ts           # Vite configuration
├── tailwind.config.ts       # Tailwind configuration
└── package.json
```

---

## 🚀 Deployment

Site Stat is optimized for one-click deployment on Vercel:

1. Push your repository to GitHub
2. Import the project on [vercel.com](https://vercel.com)
3. Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in the Vercel dashboard
4. Deploy — Vercel handles the rest

---

<div align="center">

---

**Architected & Developed by [Inderjeet Singh](https://github.com/YOUR_USERNAME)**

*Built with precision. Deployed with confidence.*

---

</div>
