# FinCal — Retirement Planning Calculator
### by **Optiwealth** | Technex'26 IIT (BHU) Varanasi | Co-Sponsored by HDFC Mutual Fund

<div align="center">

![FinCal Banner](https://img.shields.io/badge/FinCal-Retirement%20Planning%20Calculator-224c87?style=for-the-badge&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=node.js)
![WCAG](https://img.shields.io/badge/WCAG-2.1%20AA-059669?style=for-the-badge)
![License](https://img.shields.io/badge/Hackathon-FinCal%20Innovation-da3832?style=for-the-badge)

### 🌐 [Live Demo → fincal-retirement-calculator-theta.vercel.app](https://fincal-retirement-calculator-theta.vercel.app)

</div>

---

> **Disclaimer:** This tool has been designed for information purposes only. Actual results may vary depending on various factors involved in capital market. Investor should not consider above as a recommendation for any schemes of HDFC Mutual Fund. Past performance may or may not be sustained in future and is not a guarantee of any future returns.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Team](#team)
- [Live URLs](#live-urls)
- [Features](#features)
- [Financial Logic](#financial-logic)
- [Tech Stack](#tech-stack)
- [Compliance](#compliance)
- [Accessibility](#accessibility)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [API Endpoints](#api-endpoints)
- [Judging Criteria Coverage](#judging-criteria-coverage)

---

## 🎯 Overview

FinCal is a **Retirement Planning Calculator** built for the FinCal Innovation Hackathon at Technex'26, IIT (BHU) Varanasi. The goal was to build an intuitive, investor-friendly, interactive financial calculator that simplifies retirement planning for everyday Indians — making concepts like Monte Carlo simulations, SIP step-ups, and inflation buckets accessible to anyone.

**Category:** Retirement Planning Calculator

**Problem we solve:** Most retirement calculators are static, boring, and give you one number with no context. FinCal gives you a complete retirement plan with interactive visualisations, scenario comparison, AI-powered explanations, and a PDF report — all in one place.

---

## 👥 Team

| Name | Role |
|------|------|
| **Soumya Dhole** | Lead Developer — Backend, Deployment |
| **Shashwat Deshpande** | Frontend Developer — UI/UX, Charts |
| **Niraj Bhakte** | Full Stack — Financial Logic, PDF, Chatbot |

**Team Name:** Optiwealth

---

## 🌐 Live URLs

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | https://fincal-retirement-calculator-theta.vercel.app | ✅ Live |
| **Backend API** | https://fincal-retirement-calculator.onrender.com | ✅ Live |
| **GitHub Repo** | https://github.com/SoumyaDhole/fincal-retirement-calculator | ✅ Public |

---

## ✨ Features

### 🧮 Core Calculator
- **Inflation-adjusted retirement corpus** using Present Value of Annuity formula
- **Flat SIP** and **Step-Up SIP** recommendations
- **Three expense buckets** — General (6%), Medical (8%), Lifestyle (4%) — each inflating at different rates
- **Existing corpus** support — factors in EPF, FD, MF savings already held
- **Lumpsum withdrawal at retirement** — withdraw a one-time amount on day 1, remaining corpus funds monthly income

### 📊 Monte Carlo Simulation
- **1,000 Gaussian Box-Muller simulations** of market returns
- **P5/P25/P50/P75/P95 percentile bands** visualised on the chart
- **Success probability** shown as SAFE (≥80%) / MODERATE (≥50%) / RISKY (<50%)

### 📍 Interactive Journey Timeline
- Drag-and-drop slider to explore corpus at any age
- Accumulation phase vs withdrawal phase clearly shown
- Corpus progress bar with peak value

### ⚖️ Scenario Comparison
- Two scenarios side-by-side with different return/inflation assumptions
- Head-to-head table with best/worst value highlighted
- Dual-line wealth timeline overlay chart

### 📈 Sensitivity Analysis
- 3×3 grid of 9 return × inflation combinations
- Each cell independently recalculated from scratch
- Your current rates highlighted in the centre

### ⏰ Regret Calculator
- Shows cost of delaying start by 5 years
- Extra SIP per month + total extra paid over lifetime

### 💰 SIP vs Lumpsum Toggle
- Compare monthly SIP path vs lumpsum-today path to the same corpus
- Total invested, estimated returns, final corpus breakdown

### 🤖 AI Retirement Advisor Chatbot
- Powered by **Google Gemini API** (free tier)
- Knows your exact retirement numbers — gives personalised answers
- Suggested questions for first-time users
- Compliance-aware: every response ends with mandatory disclaimer
- Full-screen on mobile, popup on desktop

### 📄 PDF Report Export
- Branded **Optiwealth · FinCal** PDF with HDFC Mutual Fund co-branding
- Profile summary, key results, expense breakdown, regret analysis
- Assumptions section — all rates transparently disclosed
- Mandatory disclaimer pinned in footer on every page
- Saves as `Optiwealth_FinCal_Retirement_Report.pdf`

### 🎓 Learn Tab
- 8 beginner-friendly explainers: What is SIP? What is a corpus? Monte Carlo explained, etc.
- Accordion-style, readable on mobile

### 🌗 Dark Mode
- Full light/dark theme toggle
- All components theme-aware including charts

### 🧭 Guided Tour
- 9-step interactive tooltip tour
- Pre-results steps shown on load; post-results steps appear after Calculate

### 👤 Quick-Start Personas
- Fresh Graduate (22 · ₹30k/mo)
- Mid-career (35 · ₹80k/mo)
- Late Starter (45 · ₹1.5L/mo)

### 📐 Investment Scenarios
- Conservative (7% pre / 5% post)
- Moderate (10% pre / 7% post)
- Aggressive (12% pre / 9% post)

---

## 📐 Financial Logic

All formulas follow the **mandatory framework** specified in the hackathon brief.

### Step 1 — Inflate Monthly Expenses
```
Retirement Annual Expense = Monthly Expense × 12 × (1 + inflationRate)^yearsToRetirement
```

### Step 2 — Retirement Corpus (Present Value of Annuity)
```
Corpus = Annual Expense × [(1 − (1 + postReturn)^−retirementYears) ÷ postReturn]
```

### Step 3 — Required Monthly SIP
```
Monthly rate r = preReturn ÷ 12
n = yearsToRetirement × 12
SIP = Corpus × r ÷ [((1+r)^n − 1) × (1+r)]
```

### Step 4 — Step-Up SIP
```
Year-wise compounding with annual SIP increase = stepUpRate
Programmatic implementation (not closed-form) per hackathon spec
```

### Step 5 — Existing Corpus Projection
```
ExistingCorpusAtRetirement = existingCorpus × (1 + preReturn)^yearsToRetirement
Net SIP Target = max(0, Corpus − ExistingCorpusAtRetirement)
```

### Step 6 — Expense Buckets (Extended from baseline)
```
General (60%): inflates at 6% p.a.
Medical (25%): inflates at 8% p.a. (healthcare inflation higher)
Lifestyle (15%): inflates at 4% p.a.
```

### Step 7 — Monte Carlo Simulation
```
1,000 simulations using Gaussian Box-Muller transform
Each sim: random annual return = mean ± volatility
Success = simulation where corpus > 0 at life expectancy
successProbability = (successes / 1000) × 100
```

### Step 8 — Sensitivity Analysis
```
3×3 grid of [preReturn ±2%] × [inflationRate ±1%]
Each cell: full recalculation from scratch
Centre cell = user's current rates (highlighted)
```

### Step 9 — Regret Calculator
```
delayYears = 5
sipIfDelayed = recalculate with (currentAge + 5)
extraMonthlySIP = sipIfDelayed − sipIfStartNow
extraTotalPaid = extraMonthlySIP × (yearsToRetirement − 5) × 12
```

All rates input as percentages by user, converted to decimals server-side.
All assumptions user-editable. All values illustrative only.

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15 | React framework, SSR |
| TypeScript | 5 | Type safety |
| Chart.js + react-chartjs-2 | Latest | Monte Carlo fan chart, comparison chart |
| jsPDF | Latest | PDF report generation |
| Google Fonts (Montserrat) | — | Hackathon-permitted font |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 22 | Runtime |
| Express.js | 4 | REST API |
| dotenv | — | Environment variable management |
| CORS | — | Cross-origin for Vercel frontend |

### AI
| Service | Usage |
|---------|-------|
| Google Gemini API (gemini-2.5-flash) | AI chatbot — free tier |

### Deployment
| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting (auto-deploy from GitHub) |
| Render | Backend hosting (Node.js web service) |

---

## ✅ Compliance

### Mandatory Disclaimer
The exact hackathon-mandated disclaimer appears in **three places**:
1. **Pinned footer** — fixed at bottom of every page, always visible
2. **PDF report** — pinned footer on every PDF page at position y=269mm
3. **AI Chatbot** — appended to every single AI response automatically

### Brand Guidelines
| Requirement | Implementation |
|-------------|---------------|
| Blue `#224c87` | Primary colour — navbar, buttons, accents, headings |
| Red `#da3832` | Alert colour — risk indicators, regret section, chatbot arrow |
| Grey `#919090` | Muted text, secondary labels |
| Font: Montserrat | Loaded from Google Fonts — all headings and UI |
| Font: Arial | Body text, form hints, message bubbles |
| No growth arrows | ✅ No upward arrows on results or charts |
| No guarantee language | ✅ "illustrative", "may", "estimated" used throughout |

### Hackathon Rules
- ✅ Category: Retirement Planning Calculator
- ✅ Mathematically correct industry-standard formulas
- ✅ All assumptions user-editable
- ✅ All assumptions transparently disclosed
- ✅ Illustrative only — no performance commitments
- ✅ No specific scheme recommended

---

## ♿ Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|---------------|
| Semantic HTML | `<nav>`, `<main>`, `<section>`, `<header>`, `<table>` with proper roles |
| Skip link | "Skip to main content" link at top, visible on focus |
| Screen reader tables | Sensitivity analysis table with `scope="col/row"` and `aria-label` |
| ARIA live regions | Results section: `aria-live="polite"`, errors: `aria-live="assertive"` |
| ARIA roles | `role="tablist"`, `role="tab"`, `aria-selected`, `role="dialog"` on chatbot |
| ARIA labels | Every button and input has `aria-label` or visible label |
| `aria-pressed` | Persona and scenario toggle buttons |
| `aria-expanded` | FAQ accordion buttons, tooltip ? buttons |
| `aria-busy` | Calculate and Compare buttons during loading |
| Keyboard navigation | All interactive elements reachable and operable via keyboard |
| Focus management | Tour tooltips scroll element into view; chatbot input auto-focused |
| Colour contrast | Blue `#224c87` on white meets AA ratio (7.2:1) |
| Reduced motion | `@media(prefers-reduced-motion:reduce)` disables all animations |
| Forced colours | `@media(forced-colors:active)` adds button borders |
| Error accessibility | Validation errors in `role="alert"` with `aria-live="assertive"` |
| `suppressHydrationWarning` | Applied to inputs touched by browser extensions |
| SR-only text | Hidden labels for sensitivity table centre cell |

---

## 📁 Project Structure

```
fincal-retirement-calculator/
├── backend/
│   ├── controllers/
│   │   └── retirementController.js      # Route handler
│   ├── routes/
│   │   └── retirementRoutes.js          # /api/retirement/calculate
│   ├── services/
│   │   └── retirementCalculator.js      # Core financial logic + Monte Carlo
│   ├── utils/
│   │   └── financeFormulas.js           # SIP, corpus, sensitivity formulas
│   ├── server.js                        # Express server + CORS + /api/chat proxy
│   └── .env                            # ANTHROPIC_API_KEY (gitignored)
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                     # Main calculator page (all tabs)
│   │   ├── globals.css                  # Global styles (Montserrat, resets)
│   │   └── layout.tsx                   # Root layout with Montserrat font
│   ├── components/
│   │   ├── RetirementChart.tsx          # Monte Carlo fan chart (Chart.js)
│   │   ├── ComparisonView.tsx           # Side-by-side scenario comparison
│   │   ├── RetirementChatbot.tsx        # AI chatbot (Gemini API)
│   │   ├── ReadinessScore.tsx           # Retirement readiness score card
│   │   └── WhatIfSliders.tsx            # Interactive what-if sliders
│   ├── public/
│   │   └── optiwealth-logo.svg          # Optiwealth logo (backup)
│   └── .env.local                      # NEXT_PUBLIC_GEMINI_API_KEY (gitignored)
│
└── README.md
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js 22+
- npm 10+

### 1. Clone the repository
```bash
git clone https://github.com/SoumyaDhole/fincal-retirement-calculator.git
cd fincal-retirement-calculator
```

### 2. Backend setup
```bash
cd backend
npm install

# Create environment file
echo "ANTHROPIC_API_KEY=placeholder" > .env
# (Optional: replace with real key for /api/chat proxy)

node server.js
# ✅ Backend running on http://localhost:5000
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm install jspdf

# Create environment file
# Get free Gemini key from: https://aistudio.google.com/app/apikey
echo "NEXT_PUBLIC_GEMINI_API_KEY=your_key_here" > .env.local
echo "NEXT_PUBLIC_BACKEND_URL=http://localhost:5000" >> .env.local

npm run dev
# ✅ Frontend running on http://localhost:3000
```

### 4. Open the app
```
http://localhost:3000
```

### Environment Variables Summary

| File | Variable | Value |
|------|----------|-------|
| `backend/.env` | `ANTHROPIC_API_KEY` | Kept for compatibility (chatbot uses Gemini) |
| `frontend/.env.local` | `NEXT_PUBLIC_GEMINI_API_KEY` | From aistudio.google.com/app/apikey |
| `frontend/.env.local` | `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:5000` (local) or Render URL (prod) |

---

## 📡 API Endpoints

### `POST /api/retirement/calculate`

**Request body:**
```json
{
  "currentAge": 25,
  "retirementAge": 60,
  "lifeExpectancy": 85,
  "monthlyExpense": 50000,
  "inflationRate": 0.06,
  "preReturn": 0.10,
  "postReturn": 0.07,
  "stepUpRate": 0.10,
  "existingCorpus": 0,
  "lumpSumWithdrawal": 0
}
```

**Response includes:**
```json
{
  "data": {
    "requiredCorpus": 45000000,
    "monthlySIP": 12500,
    "monthlyStepUpSIP": 8200,
    "successProbability": 82.3,
    "yearsCorpusLasts": 25,
    "futureMonthlyExpense": 152000,
    "monthlyRetirementIncome": 26000,
    "monthlyIncomeInTodaysMoney": 14500,
    "existingCorpusAtRetirement": 0,
    "yearsToRetirement": 35,
    "retirementYears": 25,
    "timeline": [...],
    "monteCarloFan": { "p5": [...], "p25": [...], "p50": [...], "p75": [...], "p95": [...] },
    "sensitivity": { "table": [[...]], "returnLabels": [...], "inflationLabels": [...] },
    "regret": { "sipIfStartNow": 12500, "sipIfDelayed": 18900, "extraMonthlySIP": 6400, "extraTotalPaid": 2304000, "delayYears": 5 },
    "expenseBuckets": { "general": 91200, "medical": 38000, "lifestyle": 22800 }
  }
}
```

### `GET /`
Health check — returns `"FinCal Backend Running"`

### `POST /api/chat`
Anthropic API proxy (kept for compatibility; chatbot uses Gemini directly from frontend)

---

## 🏆 Judging Criteria Coverage

| Criterion | Weight | Our Implementation | Score Target |
|-----------|--------|-------------------|-------------|
| **Financial logic accuracy** | 25% | PV Annuity corpus, SIP formula, step-up SIP (year-wise), Monte Carlo 1,000 sims, sensitivity 3×3 grid, expense inflation buckets, existing corpus compounding, regret calculator | ⭐⭐⭐⭐⭐ |
| **Compliance adherence** | 20% | Mandatory disclaimer in 3 places (footer, PDF, chatbot), brand colours #224c87 / #da3832 / #919090, Montserrat/Arial fonts only, no guarantee language, no growth arrows, all assumptions disclosed and editable | ⭐⭐⭐⭐⭐ |
| **Accessibility compliance** | 15% | WCAG 2.1 AA: skip link, aria-live, aria-pressed, aria-expanded, aria-busy, role="tablist/tab/dialog", semantic HTML, SR tables, reduced motion, forced-colors, keyboard nav, focus management | ⭐⭐⭐⭐⭐ |
| **UX clarity** | 15% | Guided 9-step tour, 3 quick-start personas, 3 scenario presets, interactive timeline slider, SIP vs lumpsum toggle, AI chatbot, comparison view, dark mode, form validation with friendly errors | ⭐⭐⭐⭐⭐ |
| **Technical quality** | 15% | TypeScript, modular backend (controller/service/utils), env-based config, Gemini AI integration, jsPDF report, Chart.js Monte Carlo fan, Vercel + Render deployment | ⭐⭐⭐⭐⭐ |
| **Responsiveness** | 10% | CSS Grid `auto-fill minmax`, mobile navbar wraps to 2 rows, chatbot full-screen on mobile, result cards 2-col on mobile, touch-friendly inputs and buttons | ⭐⭐⭐⭐⭐ |

---

## 📸 Key Screens

| Screen | Description |
|--------|-------------|
| **Calculator** | Form with 10 user-editable inputs, 3 personas, 3 scenarios |
| **Results** | 8+ result cards, retirement paycheck, interactive timeline, SIP vs lumpsum |
| **Charts** | Monte Carlo fan chart + wealth timeline overlay |
| **Comparison** | Side-by-side scenario A vs B with head-to-head table |
| **AI Chatbot** | Gemini-powered advisor knowing your exact numbers |
| **PDF Report** | Branded multi-section report with compliance footer |
| **Learn Tab** | 8 beginner explainers in accessible accordion |

---

## 🔐 Security

- API keys stored in `.env` / `.env.local` files — **never committed to GitHub**
- Both `.env` and `.env.local` are in `.gitignore`
- Gemini API key exposed as `NEXT_PUBLIC_` (frontend-only, free tier, no billing risk)
- Anthropic key kept server-side only in `backend/.env`

---

## 📜 License & IP

Per hackathon rules, HDFC AMC retains ownership of all calculators and code submitted to this competition.

---

<div align="center">

**Built with ❤️ by Team Optiwealth**
Soumya Dhole · Shashwat Deshpande · Niraj Bhakte

*FinCal Innovation Hackathon · Technex'26 · IIT (BHU) Varanasi*
*Co-Sponsored by HDFC Mutual Fund*

🌐 **[fincal-retirement-calculator-theta.vercel.app](https://fincal-retirement-calculator-theta.vercel.app)**

</div>
