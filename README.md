# Library Management System (LibraryOS)

A full-stack Library Management System built with Next.js 15 (App Router), Better Auth, Prisma, and shadcn/ui.

## Tech Stack

- **Framework**: Next.js 15 (App Router, Server Actions)
- **Auth**: Better Auth with Admin Plugin (RBAC)
- **Database**: SQLite via Prisma ORM
- **UI**: Tailwind CSS v4 + shadcn/ui + Framer Motion
- **Validation**: Zod + React Hook Form
- **Icons**: Lucide React

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up the database

```bash
npx prisma db push
```

### 3. Seed sample data

```bash
npm run db:seed
```

### 4. Start the dev server

```bash
npm run dev
```

### 5. Create your admin account

Visit `http://localhost:3000/sign-up` and create an account.
**The first user registered is automatically promoted to admin.**

## Features

- 📚 **Book Management** — CRUD, ISBN tracking, categories, stock management
- 👥 **Member Management** — Role-based (Admin/User), profile views, borrow history  
- 🔄 **Transactions** — Issue, return, renewal with automatic fine calculation
- 💰 **Fine System** — ₹2/day overdue fine, automatic calculation on return
- 🔍 **Advanced Search** — Search by title, author, subject, ISBN
- 🛒 **Purchase Management** — Vendor management, purchase orders, stock updates
- 📊 **Reports** — Issued books, overdue, inventory, purchase history
- 🌙 **Dark/Light Mode** — System-aware theme switching
- 📱 **Responsive** — Mobile-first with collapsible sidebar
- 🎨 **Animations** — Smooth Framer Motion transitions throughout

## Folder Structure

```
src/
├── app/
│   ├── (auth)/         # Sign-in, Sign-up pages
│   ├── (dashboard)/    # All dashboard pages
│   └── api/auth/       # Better Auth API route
├── actions/            # Server actions (business logic)
├── components/
│   ├── ui/             # shadcn/ui components
│   └── layout/         # Sidebar, topbar, mobile nav
├── lib/                # Auth, Prisma, utils, permissions
└── types/              # TypeScript interfaces
```

## Default Configuration

| Setting | Value |
|---------|-------|
| Loan period | 14 days |
| Max renewals | 2 |
| Max books/user | 5 |
| Fine rate | ₹2/day |

These can be configured in the `.env` file.
