# Mami's Cocina 🌮

A modern restaurant website for Mami's Cocina featuring a customer-facing homepage, menu display, and admin dashboard for content management.

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Framer Motion, Shadcn/UI
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Deployment**: Vercel

## Features

### Customer-Facing
- **Homepage**: Hero section, restaurant hours, delivery platform links, menu PDF download
- **Menu Page**: Interactive menu with categories, item cards, and search functionality
- **Responsive Design**: Mobile-first design that works on all devices

### Admin Dashboard
- **Dashboard Overview**: Stats display, navigation cards to all admin sections
- **Menu Management**: Add, edit, delete menu items with images and prices
- **Category Management**: Create and manage menu categories
- **Restaurant Hours**: Set and update operating hours
- **Menu PDF Upload**: Upload and manage downloadable menu PDF via Supabase Storage
- **Authentication**: Secure admin login with email/password

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a new project at [https://supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy your credentials and update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set Up Supabase Storage

1. Create a bucket named `menu-pdfs` in Supabase Storage
2. Make the bucket public
3. Add RLS policies to allow authenticated users to upload and read PDFs

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
/app          # Next.js app directory
  /admin      # Admin dashboard pages
  /api        # API routes
  /login      # Login page
  /menu       # Menu page
/components   # Reusable UI components
/contexts     # React contexts (Auth)
/lib          # Utility functions and Supabase clients
/public       # Static assets
```

## Current Status ✅

- [x] Next.js project with TypeScript
- [x] Tailwind CSS configured
- [x] Supabase configured (Auth, Database, Storage)
- [x] Homepage with hero and delivery links
- [x] Menu page with categories and items
- [x] Admin dashboard with navigation
- [x] Menu management (CRUD operations)
- [x] Category management
- [x] Restaurant hours management
- [x] Menu PDF upload via Supabase Storage
- [x] Responsive design
- [x] ESLint configured
