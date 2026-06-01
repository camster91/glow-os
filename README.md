# Glow OS

**A production-ready SaaS operating system template providing a complete dashboard foundation for modern software applications.**

Glow OS is a full-stack monorepo starter kit built for speed. Ship your next SaaS with a polished dashboard, authentication, responsive sidebar navigation, and an AI-ready backend — all wired together with Docker Compose.

## Features

- **Dashboard Layout** — Responsive sidebar navigation with collapsible menu, breadcrumbs, and dark/light mode
- **Authentication Flow** — Supabase Auth with email/password, magic link, and OAuth providers
- **Responsive Design** — Mobile-first Tailwind CSS 4 system with touch-friendly components
- **Component Library** — Reusable UI primitives (Button, Card, Modal, Toast via Sonner, icons via Lucide)
- **Internationalization** — Built-in i18n support via next-intl
- **AI Integration** — AI SDK (Vercel AI) ready for chat, completions, and agents
- **State Management** — Zustand for client state, Supabase for server state
- **API Backend** — Python FastAPI backend with Supabase database integration

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, clsx, tailwind-merge |
| Auth | Supabase Auth (SSR) |
| Database | Supabase (PostgreSQL) |
| Backend | Python FastAPI |
| AI | Vercel AI SDK |
| I18n | next-intl |
| Icons | Lucide React |
| Toast | Sonner |
| State | Zustand |
| Deployment | Docker Compose, Coolify-compatible |

## Project Structure

```
glow-os/
├── frontend/              # Next.js 16 application
│   ├── src/
│   │   ├── app/           # App Router pages and layouts
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/           # Utilities (Supabase client, etc.)
│   │   ├── store/         # Zustand stores
│   │   ├── i18n/          # Translation files
│   │   └── middleware.ts  # Auth middleware
│   └── public/            # Static assets
├── backend/               # Python FastAPI application
│   ├── app/               # API routes and services
│   ├── requirements.txt   # Python dependencies
│   └── supabase/          # Supabase config
└── docker-compose.yml     # Full-stack orchestration
```

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Docker & Docker Compose (for full-stack)
- Supabase project (for auth and database)

### Quick Start (Frontend Only)

```bash
git clone https://github.com/camster91/glow-os.git
cd glow-os/frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Full Stack (Docker)

```bash
git clone https://github.com/camster91/glow-os.git
cd glow-os

# Copy and fill environment variables
cp .env.example .env

# Start all services
docker-compose up -d
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:8001 |

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Backend
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

## Deployment

Build for production:

```bash
# Frontend
cd frontend
npm run build

# Full stack via Docker
docker-compose -f docker-compose.yml build
docker-compose -f docker-compose.yml up -d
```

Designed for deployment on Coolify, Vercel, or any Docker-capable host.

## Customization

- **Branding**: Replace colors, logos, and fonts in Tailwind config
- **Auth**: Configure Supabase providers (Google, GitHub, etc.)
- **Pages**: Add or remove dashboard pages in `frontend/src/app/`
- **API**: Extend the FastAPI backend in `backend/app/`

## License

Private — This project is proprietary and confidential.

## Author

Developed by Cameron Ashley / Ashbi Design.
