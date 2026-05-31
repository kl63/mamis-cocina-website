# ByteBurger Framework Guide
## Using ByteBurger as a Boilerplate for Restaurant Websites

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [What ByteBurger Provides](#what-byteburger-provides)
3. [Quick Start Guide](#quick-start-guide)
4. [Customization Guide](#customization-guide)
5. [Theme Customization](#theme-customization)
6. [Branding & Identity](#branding--identity)
7. [Feature Configuration](#feature-configuration)
8. [Deployment Checklist](#deployment-checklist)
9. [Common Use Cases](#common-use-cases)

---

## Overview

ByteBurger is a **production-ready, full-stack restaurant ordering platform** that can be adapted for any restaurant concept. Whether you're building for a pizza shop, sushi bar, coffee shop, or fine dining establishment, this framework provides all the core functionality you need.

### Why Use ByteBurger as a Framework?

✅ **Complete Feature Set** - Ordering, payments, kitchen management, analytics, rewards  
✅ **Production-Ready** - Authentication, RLS policies, CI/CD, testing infrastructure  
✅ **Modern Tech Stack** - Next.js 15, TypeScript, Supabase, Stripe, Tailwind CSS  
✅ **Scalable Architecture** - Clean code structure, reusable components, API routes  
✅ **Mobile-First Design** - Responsive UI that works on all devices  
✅ **Real-time Updates** - Kitchen display, order tracking, live notifications  

---

## What ByteBurger Provides

### 🎨 Frontend Features
- **Customer Ordering Flow** - Browse menu, customize items, cart management
- **Kiosk Mode** - Touch-friendly interface for in-store ordering
- **Kitchen Display System** - Real-time order management for staff
- **Admin Dashboard** - Menu management, analytics, order tracking
- **User Accounts** - Authentication, order history, rewards tracking
- **Responsive Design** - Works on desktop, tablet, and mobile

### 🔧 Backend Features
- **Supabase Database** - PostgreSQL with Row Level Security
- **Authentication** - Email/password with role-based access (admin/customer)
- **Payment Processing** - Stripe integration for secure payments
- **Email Notifications** - Order confirmations, status updates
- **Real-time Subscriptions** - Live order updates using Supabase Realtime
- **Analytics** - Revenue tracking, popular items, peak hours
- **Inventory Management** - Stock tracking and low-stock alerts

### 🚀 DevOps & Quality
- **CI/CD Pipeline** - GitHub Actions for automated testing and deployment
- **Testing Suite** - Vitest for unit tests, Playwright-ready for E2E
- **TypeScript** - Full type safety across the codebase
- **Environment Management** - Separate configs for dev/staging/production
- **Deployment** - Vercel-optimized with auto-deployments

---

## Quick Start Guide

### Step 1: Clone the Repository

```bash
# Clone ByteBurger
git clone https://github.com/yourusername/ByteBurger.git my-restaurant-name

# Navigate to the project
cd my-restaurant-name

# Install dependencies
npm install
```

### Step 2: Set Up Your Database

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Run Migrations**

   **Option A: Use All Existing Migrations (Recommended for Development)**
   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Link to your project
   supabase link --project-ref your-project-ref

   # Run all migrations in order
   supabase db push
   ```

   **Option B: Use Consolidated Migration (Recommended for Production)**
   
   For a fresh deployment, use the consolidated migration file that combines all 32+ migrations into one:
   
   ```bash
   # The consolidated migration is at:
   # /supabase/migrations/000_consolidated_schema.sql
   
   # Apply it via Supabase dashboard:
   # 1. Go to your Supabase project
   # 2. Navigate to SQL Editor
   # 3. Copy and paste the contents of 000_consolidated_schema.sql
   # 4. Run the query
   ```

   > **Note:** The consolidated migration includes all tables, RLS policies, triggers, and functions needed for ByteBurger to work. This is cleaner for new projects and avoids running 32+ individual migration files.

### Step 3: Configure Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key

# Email (Resend)
RESEND_API_KEY=your-resend-api-key
```

### Step 4: Customize Your Brand

See [Theme Customization](#theme-customization) section below.

### Step 5: Deploy

```bash
# Push to GitHub
git remote set-url origin https://github.com/yourusername/your-restaurant.git
git push -u origin main

# Deploy to Vercel
vercel --prod
```

---

## Customization Guide

### 1. Restaurant Information

**File:** `/app/layout.tsx`

```typescript
export const metadata: Metadata = {
  title: 'Your Restaurant Name',
  description: 'Your restaurant description',
}
```

**Files to Update:**
- `/components/layout/navbar.tsx` - Restaurant name in logo
- `/components/layout/footer.tsx` - Contact info, social links
- `/app/page.tsx` - Hero section, tagline, featured items
- `/app/about/page.tsx` - Restaurant story and mission

### 2. Menu Categories & Items

**Option A: Use Admin Dashboard** (Recommended)
1. Run the app: `npm run dev`
2. Navigate to `/login`
3. Create an admin account
4. Go to `/admin`
5. Add categories and menu items via UI

**Option B: Seed Database Directly**

Create a seed file: `/supabase/seed.sql`

```sql
-- Insert categories
INSERT INTO menu_categories (name, description, display_order) VALUES
  ('Your Category 1', 'Description', 1),
  ('Your Category 2', 'Description', 2);

-- Insert menu items
INSERT INTO menu_items (name, description, price, category_id, image_url) VALUES
  ('Item Name', 'Description', 12.99, category_id, 'image-url');
```

### 3. Restaurant Hours

Update via Admin Dashboard at `/admin` → Restaurant Hours tab, or directly in database:

```sql
UPDATE restaurant_hours SET
  is_open = true,
  open_time = '09:00',
  close_time = '22:00'
WHERE day_of_week = 1; -- Monday
```

---

## Theme Customization

### Color Scheme

**File:** `/app/globals.css`

ByteBurger uses an orange/red gradient theme. Customize it:

```css
/* Change primary colors */
--primary: 25 95% 53%;        /* Orange */
--primary-foreground: 0 0% 100%;

/* Change accent colors */
--accent: 0 84% 60%;          /* Red */
--accent-foreground: 0 0% 100%;

/* Background colors */
--background: 222.2 84% 4.9%; /* Dark theme */
--foreground: 210 40% 98%;
```

**Quick Theme Examples:**

**Pizza Shop (Red/White):**
```css
--primary: 0 84% 60%;     /* Red */
--accent: 0 0% 100%;      /* White */
```

**Sushi Bar (Blue/White):**
```css
--primary: 210 100% 50%;  /* Blue */
--accent: 180 100% 40%;   /* Teal */
```

**Coffee Shop (Brown/Cream):**
```css
--primary: 30 40% 40%;    /* Brown */
--accent: 40 60% 85%;     /* Cream */
```

**Fine Dining (Gold/Black):**
```css
--primary: 45 100% 50%;   /* Gold */
--accent: 0 0% 10%;       /* Dark */
```

### Typography

**File:** `/app/globals.css`

```css
/* Change font family */
body {
  font-family: 'Your Font', sans-serif;
}

/* Headings */
h1, h2, h3, h4, h5, h6 {
  font-family: 'Your Display Font', serif;
}
```

**Import Google Fonts in `/app/layout.tsx`:**

```typescript
import { Inter, Playfair_Display } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })
const playfair = Playfair_Display({ subsets: ['latin'] })
```

### Logo & Branding

**Replace Logo:**
1. Add your logo to `/public/logo.png`
2. Update navbar: `/components/layout/navbar.tsx`

```tsx
<Image 
  src="/logo.png" 
  alt="Your Restaurant" 
  width={120} 
  height={40} 
/>
```

**Favicon:**
Replace `/app/favicon.ico` with your restaurant's favicon.

---

## Branding & Identity

### Hero Section

**File:** `/app/page.tsx`

```tsx
// Update hero text
<h1>Your Restaurant Name</h1>
<p>Your unique tagline or description</p>

// Update hero image
<Image src="/hero-image.jpg" ... />
```

### Background Patterns

ByteBurger uses gradient overlays and patterns. Customize in any page:

```tsx
// Change gradient colors
<div className="bg-gradient-to-br from-blue-900 via-blue-800 to-black">

// Change pattern
<div style={{
  backgroundImage: 'your-pattern-here'
}} />
```

### Icons

ByteBurger uses **Lucide Icons**. Replace with your preferred icons:

```tsx
import { Pizza, Coffee, Utensils } from 'lucide-react'
```

---

## Feature Configuration

### Enable/Disable Features

**Kiosk Mode:**
- Keep: For in-store ordering tablets
- Remove: Delete `/app/kiosk/page.tsx`

**Rewards System:**
- Keep: Customer loyalty program
- Remove: Delete `/app/rewards/*` and related API routes

**Kitchen Display:**
- Keep: For restaurant staff
- Remove: Delete `/app/kitchen/*`

**Analytics:**
- Keep: Track sales and performance
- Remove: Remove analytics tab from `/app/admin/page.tsx`

### Payment Methods

**Stripe Configuration:**

```typescript
// File: /app/api/create-payment-intent/route.ts

// Add payment methods
const paymentIntent = await stripe.paymentIntents.create({
  amount: amount,
  currency: 'usd', // Change currency
  payment_method_types: ['card', 'apple_pay', 'google_pay'],
})
```

### Email Templates

**File:** `/lib/email/templates.ts`

Customize email templates for:
- Order confirmations
- Status updates
- Password resets
- Promotional emails

---

## Deployment Checklist

### Pre-Launch Checklist

- [ ] Update restaurant name and branding
- [ ] Customize color scheme and fonts
- [ ] Add menu categories and items
- [ ] Set restaurant hours
- [ ] Configure payment processing (Stripe)
- [ ] Set up email notifications (Resend)
- [ ] Test ordering flow end-to-end
- [ ] Create admin account
- [ ] Configure environment variables in Vercel
- [ ] Set up custom domain
- [ ] Test on mobile devices
- [ ] Run accessibility checks
- [ ] Enable analytics tracking

### Environment Variables (Vercel)

Required for production:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
RESEND_API_KEY
```

### GitHub Secrets (CI/CD)

Add the same variables to GitHub repository secrets for CI/CD pipeline.

---

## Common Use Cases

### 🍕 Pizza Restaurant

**Theme:** Red/White/Green (Italian colors)  
**Features to Emphasize:**
- Customization options (toppings, size, crust)
- Delivery tracking
- Family meal deals

**Customizations:**
```css
--primary: 220 13% 18%;   /* Pizza box brown */
--accent: 0 84% 60%;      /* Tomato red */
```

### 🍣 Sushi Bar

**Theme:** Blue/White/Black (Ocean-inspired)  
**Features to Emphasize:**
- High-quality food photography
- Omakase/chef's choice options
- Minimalist design

**Customizations:**
```css
--primary: 210 100% 50%;  /* Ocean blue */
--accent: 0 0% 10%;       /* Black */
```

### ☕ Coffee Shop

**Theme:** Brown/Cream/Warm tones  
**Features to Emphasize:**
- Quick ordering for regulars
- Rewards program
- Seasonal specials

**Customizations:**
```css
--primary: 30 40% 40%;    /* Coffee brown */
--accent: 40 60% 85%;     /* Cream */
```

### 🍔 Fast Casual

**Theme:** Bold colors, energetic  
**Features to Emphasize:**
- Kiosk ordering
- Speed and efficiency
- Combo meals

**Customizations:**
```css
--primary: 25 95% 53%;    /* Orange (keep ByteBurger theme) */
--accent: 0 84% 60%;      /* Red */
```

### 🍽️ Fine Dining

**Theme:** Elegant, sophisticated  
**Features to Emphasize:**
- Reservation system (add custom)
- Wine pairing suggestions
- Tasting menus

**Customizations:**
```css
--primary: 45 100% 50%;   /* Gold */
--accent: 0 0% 10%;       /* Black */
```

---

## Advanced Customization

### Add New Features

**Example: Table Reservations**

1. **Create Database Table:**
```sql
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  time TIME NOT NULL,
  party_size INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

2. **Create API Route:**
```typescript
// /app/api/reservations/route.ts
export async function POST(request: Request) {
  // Handle reservation creation
}
```

3. **Create UI Page:**
```typescript
// /app/reservations/page.tsx
export default function ReservationsPage() {
  // Reservation form and calendar
}
```

### Integrate Third-Party Services

**Delivery Integration (DoorDash, UberEats):**
- Add API routes for webhook handling
- Create order sync functionality

**POS System Integration:**
- Connect to Square, Toast, or Clover APIs
- Sync menu items and orders

**Marketing Tools:**
- Add Mailchimp for email campaigns
- Integrate Google Analytics
- Add Facebook Pixel for ads

---

## Support & Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Community
- Create GitHub issues for bugs
- Submit pull requests for improvements
- Share your restaurant implementation!

### License
This framework is open-source. Check the LICENSE file for details.

---

## Success Stories

**Share Your Restaurant!**

If you build a restaurant website using ByteBurger, we'd love to feature it here:

- Restaurant Name
- Website URL
- Theme/Cuisine Type
- Unique Features Added

---

## Conclusion

ByteBurger provides a solid foundation for any restaurant ordering platform. With minimal customization, you can have a production-ready website that handles:

✅ Online ordering  
✅ Payment processing  
✅ Kitchen management  
✅ Customer accounts  
✅ Analytics & reporting  
✅ Rewards programs  

**Time to Launch:** 1-2 weeks with customization  
**Cost:** Only infrastructure (Supabase, Vercel, Stripe fees)  
**Maintenance:** Minimal - focus on your restaurant, not code  

---

**Ready to build your restaurant website?** Follow the Quick Start Guide above and customize to match your brand!

**Questions?** Open an issue on GitHub or check the documentation.

**Good luck with your restaurant! 🍔🚀**
