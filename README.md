# 🎓 Abi2KG

> AI-powered platform helping high school graduates in Kyrgyzstan find their perfect university — fast, smart, and without the chaos.

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/status-MVP%20ready-brightgreen">
  <img alt="Python" src="https://img.shields.io/badge/python-3.10%2B-blue">
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-0.115-009688">
  <img alt="LLM" src="https://img.shields.io/badge/LLM-Groq%20Llama%203.3%2070B-orange">
  <img alt="Frontend" src="https://img.shields.io/badge/frontend-React%20%2B%20TypeScript-3178c6">
  <img alt="DevOps" src="https://img.shields.io/badge/devops-Docker%20Compose-2496ED">
</p>

---

## 📌 The Problem

Students in Kyrgyzstan currently open **20–30 university websites** just to compare options. Information is scattered, outdated, or hidden behind marketing fluff. There is **no single trusted source** that helps applicants make the right choice based on their personal situation: ORT score, GPA, budget, language and field of interest.

**Abi2KG solves this.** One platform, real data, personalized results, in under 3 minutes.

---

## ✨ Features

### 🎯 Hyper-Personalization
Forget generic lists. Abi2KG filters universities by exact ORT scores, budget, city, GPA and chosen field. The result feels like it was made just for you.

### 🤖 AI Chat Advisor (with memory)
Ask real questions and get real answers, instantly:
> *"What are my chances if my score is 180?"*
> *"Which university is better for IT in Bishkek under 100,000 som?"*
> *"How does AUCA compare to KRSU?"*

The chatbot **remembers your profile and the entire conversation** — so follow-up questions just work.

### 📊 Admission Chance Calculation
We don't just recommend — we **explain why**. Each specialty gets a match percentage (e.g. *87% chance*) with a transparent breakdown:
- ✅ ORT score vs passing score (sigmoid scoring)
- ✅ GPA bonus
- ✅ Budget fit (full / partial / grant only)
- ✅ Field alignment with student's interests

### 💬 AI-Argumented Recommendations
The AI cites **real student reviews** when justifying a recommendation, giving applicants honest pros and cons backed by data — not marketing.

### 🗂️ One Platform Instead of 30 Tabs
All universities in one place with a unified data format. **61 universities** of Kyrgyzstan parsed, with 370+ specialties and 290+ student reviews indexed.

### ⚖️ Neutral & Unbiased
We are independent — showing real tuition costs, honest admission requirements and fair comparisons.

### 🌍 Built for Our Region
Existing platforms are built for Western markets. Abi2KG is built specifically for **students in Kyrgyzstan and Central Asia** — local universities, local context, local language (Russian and Kyrgyz).

---

## 🏗️ Architecture

```
                ┌──────────────────┐
                │     Frontend     │
                │ React + TypeScript│
                │   (deployed on   │
                │     Vercel)      │
                └─────────┬────────┘
                          │ HTTPS
              ┌───────────┴───────────┐
              │                       │
       ┌──────▼──────────┐    ┌──────▼─────────┐
       │   AI Service    │    │    Backend     │
       │   (FastAPI)     │    │   (FastAPI)    │
       │  Groq Llama 3.3 │    │  Business logic│
       │   port 8000     │    │   port 8001    │
       └──────┬──────────┘    └──────┬─────────┘
              │                      │
              └──────────┬───────────┘
                         │
                  ┌──────▼─────┐
                  │  Database  │
                  │  SQLite /  │
                  │  Postgres  │
                  └────────────┘
```


## 📁 Repository Structure

```
Hackathon-project-2026/
├── ai/              # AI module — chatbot, RAG, recommendations, LLM parser
├── backend/         # Core API for frontend (user data, business logic)
├── frontend/        # React + TypeScript SPA, deployed on Vercel
├── devops/          # Docker Compose, deployment configs, CI/CD
├── management/      # Project planning, design docs, pitch materials
└── README.md        # You are here
```

---

## 🚀 Quick Start (Docker)

The fastest way to run the whole stack locally.

### Prerequisites
- Docker Desktop installed and running
- Free [Groq API key](https://console.groq.com) (no credit card required)

### 1. Clone the repo

```bash
git clone https://github.com/Inlooi/Hackathon-project-2026.git
cd Hackathon-project-2026
```

### 2. Configure environment

```bash
# AI service needs a Groq API key
cp ai/.env.example ai/.env
# Open ai/.env in your editor and paste your gsk_... key
```

### 3. Run the stack

```bash
docker compose -f devops/docker-compose.yml up --build
```

### 4. Open in browser

- 🌐 **Frontend**: [https://your-frontend.vercel.app](https://your-frontend.vercel.app)
- 🤖 **AI API Swagger**: [http://localhost:8000/docs](http://localhost:8000/docs)
- 🔧 **Backend API**: [http://localhost:8001/docs](http://localhost:8001/docs)

To stop:
```bash
docker compose -f devops/docker-compose.yml down
```

---

## 🧪 Manual Run (without Docker)

If Docker isn't your thing, each service can be started independently.

### AI Service

```bash
cd ai
python -m venv venv
venv\Scripts\activate            # Windows
# source venv/bin/activate       # Mac/Linux

pip install -r requirements.txt
cp .env.example .env             # add your GROQ_API_KEY

python seed.py                   # initial 10 universities
python parse_all.py              # optional — parse all 61 unis (~15 min)
python parse_top_unis.py         # optional — deep parse top 12 unis

uvicorn app.main:app --reload
```

API will be live at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App will be live at `http://localhost:3000` or `http://localhost:5173`.

### Backend

```bash
cd backend
# See backend/README.md for setup
```

---

## 🧠 AI Module — Technical Details

The AI service implements **5 production-grade features**:

### 1. Chatbot with persistent memory
Built on **Groq Llama 3.3 70B** (free tier, 14,400 requests per day, response in 1-2 seconds). Conversation history is stored in SQLite and re-injected into every prompt — the bot truly remembers the user across sessions.

### 2. RAG over university database
Real-time retrieval of relevant universities and specialties from the local database, embedded as structured context into the LLM prompt. This **eliminates hallucinations** — the bot can only answer based on actual indexed data.

### 3. Sigmoid admission chance model
Hybrid scoring function combining:
- **70%** sigmoid of (user_ORT − passing_score) / 15
- **15%** GPA factor (normalized to 5.0)
- **15%** budget fit factor (full / grant possible / out of reach)
- **±15%** field alignment multiplier with normalized synonyms (e.g. *"айти"* → *"IT"*)

### 4. AI-argumented recommendations
For any recommended specialty, the system retrieves the user profile, specialty details and indexed student reviews, then asks the LLM to produce a structured argument with citations: *why this fits / risks to consider / actionable advice*.

### 5. Universal LLM parser
Instead of writing 60 custom parsers, a single LLM-powered extractor reads each university's HTML and returns structured JSON (description, faculties, specialties, tuition, passing scores). Handles rate limits gracefully with progressive backoff retry, falls back to SSL-verify-off mode for sites with broken certificates.

### Database schema

```
users              → user_profiles
universities       → specialties, reviews
messages           (chat history per user)
recommendations    (cached top-N results per user)
parse_logs         (parser status and errors)
```

### Key endpoints

| Method | Path                                                | Description                          |
| ------ | --------------------------------------------------- | ------------------------------------ |
| POST   | `/users/`                                           | Register a new applicant             |
| PUT    | `/users/{id}/profile`                               | Save / update applicant profile      |
| POST   | `/chat/message`                                     | Send a message to the AI advisor     |
| GET    | `/chat/history/{user_id}`                           | Fetch full chat history              |
| GET    | `/recommendations/{user_id}`                        | Top-N specialties with chance %      |
| GET    | `/recommendations/{user_id}/{spec_id}/argument`     | AI argument backed by student reviews|
| GET    | `/universities?city=Бишкек&type=частный`            | Filter universities                  |
| GET    | `/universities/{id}/reviews`                        | All reviews for a university         |
| GET    | `/stats`                                            | Aggregated stats for dashboard       |

---

## 🛠️ Tech Stack

| Layer        | Technology                                              |
| ------------ | ------------------------------------------------------- |
| Frontend     | React, TypeScript, Tailwind CSS, deployed on Vercel     |
| AI Service   | FastAPI, SQLAlchemy, Groq SDK (Llama 3.3 70B + 3.1 8B)  |
| Backend      | FastAPI, business logic for user-facing operations      |
| Database     | SQLite (dev) / PostgreSQL (prod), via SQLAlchemy        |
| Parsing      | BeautifulSoup4 + lxml + Groq for structured extraction  |
| DevOps       | Docker, Docker Compose, Railway (AI hosting), Vercel    |

---

## 🎤 Live Demo Flow

Recommended demo scenario (3 minutes):

1. **Open the website** — landing page explains the value
2. **Register and fill the profile** — ORT 195, GPA 4.5, budget 120k KGS, field IT
3. **Open the chat** — ask *"Where should I apply?"*
   - Bot suggests 3 concrete universities from the database based on the profile
4. **Follow-up question** *"Which one is in English?"*
   - Bot remembers the previous suggestions — proves memory
5. **Open the Recommendations page** — see top-10 specialties with chance percentages
6. **Click "Why this?"** — AI argument with quotes from real student reviews
7. **Open the Dashboard** — aggregated statistics across the platform

---

## ✅ AI Engineer Requirements Coverage

The project covers **9 out of 16** AI Engineer requirements from the hackathon brief, across **three categories**:

**Working with Database**
- ✅ Natural-language search instead of filters
- ✅ AI assistant answering questions from the database (RAG)
- ✅ Automatic categorization and tagging (field / sentiment)
- ✅ Recommendation system based on user history

**Working with Text**
- ✅ In-product support chatbot
- ✅ Automatic summarization of long documents (parser)
- ✅ Review sentiment analysis (positive / neutral / negative)
- ✅ Templated content generation (AI arguments)

**Working with Analytics**
- ✅ Automated report based on user data (recommendations)
- ✅ Prediction based on historical data (admission chance)
- ✅ Smart dashboard highlighting key metrics
- ✅ Personalized advice based on behavior

---

## 👥 Team

| Role            | Responsibilities                                              |
| --------------- | ------------------------------------------------------------- |
| AI Engineer     | Chatbot, RAG, recommendation engine, LLM parser, AI arguments |
| Backend         | User management, business logic, API for frontend             |
| Frontend        | React SPA, UX, integration with API                           |
| DevOps          | Docker, Docker Compose, deployment, CI/CD                     |
| Project Manager | Planning, coordination, pitch                                 |

---

## 📜 License

This project is for educational and hackathon purposes.

---

## 🙏 Acknowledgments

- **Groq** — free, fast LLM inference
- **Meta AI** — Llama 3.3 70B and Llama 3.1 8B models
- **Ministry of Education of the Kyrgyz Republic** — public university data
- All Kyrgyzstani universities whose public information made this project possible
