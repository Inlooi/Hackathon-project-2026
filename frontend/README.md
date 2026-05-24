# abi2kg — University Discovery Platform for Kyrgyzstan

A React web application that helps students in Kyrgyzstan explore, compare, and choose universities. The platform features advanced filtering, a personalized recommendation quiz, rankings, saved lists, and an AI-powered chatbot — all backed by a live REST API.

---

## Features

- **University Catalog** — Browse universities with search, type/location filters, budget slider, minimum ORT score threshold, language, and field-of-study filters.
- **University Detail Pages** — View full profiles including description, available specialties, tuition, passing scores, seats, and student reviews with sentiment analysis.
- **Quiz / Recommendation Engine** — Answer questions about your ORT score, budget, city preference, specialty, language, study format, and degree level to get ranked university matches. Quiz history is saved per user.
- **Rankings Page** — League-table view of universities sorted by rating.
- **User Accounts** — Register and log in with JWT-based auth. Authenticated users can save universities to a personal list and manage their academic profile (ORT score, GPA, budget, city, interests, languages).
- **Saved Universities** — Bookmark universities; saved state persists across sessions for logged-in users.
- **AI Chatbot** — Embedded assistant for answering questions about universities.
- **Multilingual UI** — Language context for i18n support.
- **Platform Stats** — Live stats (total universities, students, etc.) displayed on the homepage.

---

## Tech Stack

| Layer       | Technology                                                       |
| ----------- | ---------------------------------------------------------------- |
| Framework   | React 18 + TypeScript                                            |
| Routing     | React Router 7                                                   |
| Build tool  | Vite 6                                                           |
| Styling     | Tailwind CSS 4 + shadcn/ui (Radix UI primitives)                 |
| UI extras   | MUI (Material Icons), Lucide React, Framer Motion, Sonner toasts |
| Charts      | Recharts                                                         |
| Drag & Drop | react-dnd                                                        |
| Forms       | react-hook-form                                                  |
| HTTP / Auth | Fetch API with JWT Bearer tokens stored in localStorage          |
| Backend API | REST — `https://hackathon-project-2026.onrender.com`             |

---

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── Chatbot.tsx          # AI chat widget
│   │   ├── Header.tsx           # Navigation bar
│   │   ├── Footer.tsx
│   │   ├── UniversityCard.tsx   # Card used in catalog & quiz results
│   │   ├── figma/
│   │   │   └── ImageWithFallback.tsx
│   │   └── ui/                  # shadcn/ui component library
│   ├── contexts/
│   │   ├── AuthContext.tsx      # JWT auth state
│   │   ├── LanguageContext.tsx  # i18n
│   │   └── SavedContext.tsx     # Saved universities list
│   ├── hooks/
│   │   └── useAuth.ts
│   ├── pages/
│   │   ├── Home.tsx             # Catalog with filters & stats
│   │   ├── UniversityDetail.tsx # Full university profile
│   │   ├── Quiz.tsx             # Recommendation quiz + history
│   │   ├── Rankings.tsx         # Leaderboard table
│   │   ├── Profile.tsx          # User profile editor
│   │   └── auth/
│   │       ├── LogInPage.tsx
│   │       └── SignUpPage.tsx
│   ├── services/
│   │   ├── authService.ts       # All API calls (auth, universities, profile)
│   │   └── profileService.ts
│   ├── data.ts                  # Static fallback university data
│   ├── routes.tsx               # React Router config
│   ├── App.tsx
│   └── Layout.tsx
├── imports/                     # Static image assets
└── styles/
    ├── theme.css                # Design tokens
    ├── globals.css
    └── tailwind.css
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd abi2kg-main

# Install dependencies
npm i
# or
pnpm install
```

### Environment

The app points to the hosted backend by default. To override it, create or edit `.env`:

```env
VITE_API_URL=https://hackathon-project-2026.onrender.com
```

Replace the URL with `http://localhost:8000` if you are running the backend locally.

### Running locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for production

```bash
npm run build
```

Output goes to `dist/`.

---

## API Overview

All requests go to `VITE_API_URL`. Authenticated endpoints require an `Authorization: Bearer <token>` header. The token is obtained on login/register and stored in `localStorage`.

| Endpoint                        | Method    | Description                              |
| ------------------------------- | --------- | ---------------------------------------- |
| `/auth/register`                | POST      | Create a new account                     |
| `/auth/login`                   | POST      | Log in, returns access token             |
| `/universities`                 | GET       | List all universities                    |
| `/universities/:id`             | GET       | University detail (specialties, reviews) |
| `/universities/stats`           | GET       | Platform-wide stats                      |
| `/universities/recommendations` | POST      | Quiz-based recommendations               |
| `/profile`                      | GET / PUT | Read or update user academic profile     |

---

## Key Design Decisions

- **Static fallback data** — `src/app/data.ts` contains four Kyrgyz universities that render even if the API is unreachable, giving the UI a non-empty state during development.
- **Quiz history in localStorage** — Stored per `user_id` key so each user's history survives page refreshes without a backend round-trip.
- **shadcn/ui** — Component library built on Radix UI primitives; all components live in `src/app/components/ui/` and can be customized freely.
- **JWT in localStorage** — Simple approach suitable for a hackathon context; for production consider `httpOnly` cookies.

---

## Contributing

1. Fork the repo and create a feature branch.
2. Follow existing code style (TypeScript strict mode, Tailwind utility classes, named exports for pages).
3. Keep components small — extract helpers and sub-components into their own files when they grow beyond ~150 lines.
4. Open a pull request with a clear description of what changed and why.

---

## Attributions

See [ATTRIBUTIONS.md](./ATTRIBUTIONS.md) for third-party licenses.

Original Figma design: [Educational Website Design](https://www.figma.com/design/HRPQCbtpP593Ehl09FDW2H/Educational-Website-Design)
