# Site Stat | Civil Engineering Data & Labor Tracking

> A high-performance, full-stack management system engineered to streamline real-time labor tracking and site analytics.

Site Stat is a custom web application architected specifically for a civil engineering client. It replaces manual data entry with a secure, centralized dashboard that handles daily labor tracking, statistical analysis, and temporary access management for construction sites.

## ✨ Core Features

* **Real-Time Dashboard:** A comprehensive, high-level overview of daily site statistics and active workforce numbers.
* **Labor Tracking System:** Efficient management and archival of labor data, allowing the client to monitor resources across different projects and shifts.
* **Secure Backend Architecture:** Powered by Supabase to handle real-time database updates, secure authentication, and complex data relations.
* **Responsive Field UI:** A clean, minimalist interface designed for seamless operation on both desktop office setups and mobile devices in the field.

## 🛠 Technical Stack

Built with a focus on speed, security, and scalable data management:

* **Frontend:** React, Vite, TypeScript
* **Styling:** Tailwind CSS, shadcn/ui
* **Backend & Database:** Supabase (PostgreSQL, Auth, Row Level Security)
* **Deployment & Hosting:** Vercel

## 💻 Local Development

To run this project locally, ensure you have Node.js installed on your machine.

### 1. Clone the repository
```bash
git clone [https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git)
cd YOUR_REPO_NAME
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Start the development server
```bash
npm run dev
```

The application will be available locally at `http://localhost:5173`.

## 🌍 Architecture & Deployment

This application is optimized for edge deployment on **Vercel**, ensuring fast load times and high availability. The backend relies on Supabase for robust Row Level Security (RLS) to ensure the client's civil engineering data and labor statistics remain strictly confidential.

---
*Architected and developed by Inderjeet Singh*
