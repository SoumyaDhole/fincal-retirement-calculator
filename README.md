# FinCal Retirement Planning Calculator

> **FinCal Innovation Hackathon — Technex'26**
> Co-Sponsored by HDFC Mutual Fund · 13–15 Mar 2026

A **Retirement Planning Calculator** built for the FinCal Innovation Hackathon at IIT (BHU) Varanasi. The goal: replace boring, inaccessible industry calculators with something intuitive, interactive, and investor-friendly.

---

## Team

| Name | Role |
|---|---|
| Soumya Dhole | Frontend · UI/UX |
| Shashwat Deshpande | Backend · Financial Logic |
| Niraj Bhakte | Integration · Accessibility |

---

## Live Features

### Core Calculator
- Inflation-adjusted future expense projection
- Retirement corpus calculation using Present Value of Annuity
- Monthly SIP required (flat)
- Monthly SIP with annual step-up (binary search)
- Existing corpus compounding

### Advanced Features
| Feature | Description |
|---|---|
| **Inflation Buckets** | Splits expenses into General (6%), Medical (8%), Lifestyle (4%) |
| **Retirement Paycheck View** | Shows corpus as a monthly income at retirement |
| **Monte Carlo Simulation** | 1,000 Gaussian-sampled paths — success probability + p5/p50/p95 |
| **Monte Carlo Fan Chart** | Year-by-year probability bands across accumulation + depletion |
| **Regret Calculator** | Cost of delaying SIP by 5 years |
| **Sensitivity Table** | 3×3 SIP grid across return and inflation assumptions |
| **Persona Presets** | Fresh Graduate / Mid-career / Late Starter quick-start |
| **Scenario Buttons** | Conservative / Moderate / Aggressive return assumptions |
| **Wealth Timeline Chart** | Two-phase chart — accumulation (blue) + drawdown (red) |

### Compliance
- Mandatory HDFC Mutual Fund disclaimer on every page (pinned footer bar)
- All assumptions clearly disclosed and user-editable
- No guarantee language, no performance commitments
- Illustrative-only framing throughout

### Accessibility — WCAG 2.1 AA
- Skip-to-content link
- `aria-live` on results (screen reader announcements)
- `aria-pressed` on toggle buttons
- `role="tablist/tab/tabpanel"` on chart tabs
- `aria-label` on all charts with text summaries
- Screen-reader data tables for all charts
- `prefers-reduced-motion` support
- Forced-colors (Windows High Contrast) support
- Keyboard navigable throughout
- Minimum 4.5:1 text contrast ratio

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, TailwindCSS, Chart.js |
| Backend | Node.js 22, Express.js |
| Charts | react-chartjs-2 + Chart.js 4 |
| Styling | Tailwind + custom CSS (HDFC brand: `#224c87`, `#da3832`, `#919090`) |
| Fonts | Montserrat, Arial, Verdana |

---

## Financial Formulas

### Future Expense
```
FV = Current Expense × (1 + Inflation)^Years
```

### Retirement Corpus (Present Value of Annuity)
```
Corpus = Σ [Annual Expense_i / (1 + PostReturn)^i]   for i = 0 to RetirementYears
where Annual Expense_i = Annual Expense × (1 + Inflation)^i
```

### Required Monthly SIP
```
SIP = (Corpus × r) / ((1 + r)^n − 1)
where r = monthly rate, n = total months
```

### Step-Up SIP (Year-wise compounding)
```
FV = Σ [SIP_year × annuity_factor(monthsRemaining)]
SIP_year = Initial SIP × (1 + StepUpRate)^year
```

### Monte Carlo (Gaussian sampling)
```
Return_sim = N(mean, σ)   where σ = mean × 0.5
1,000 simulations × full accumulation + depletion path
Percentile bands: p5, p25, p50, p75, p95 per year
```

---

## How to Run

### Prerequisites
- Node.js ≥ 22.11.0
- npm ≥ 10.9.0

### Backend
```bash
cd backend
npm install
node server.js
# → Running on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# → Running on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
fincal-retirement-calculator/
├── backend/
│   ├── controllers/
│   │   └── retirementController.js   # Request handler
│   ├── routes/
│   │   └── retirementRoutes.js       # POST /api/retirement/calculate
│   ├── services/
│   │   └── retirementCalculator.js   # Orchestrates all calculations
│   ├── utils/
│   │   └── financeFormulas.js        # All financial formulas + Monte Carlo
│   └── server.js
├── frontend/
│   ├── app/
│   │   ├── page.tsx                  # Main calculator UI
│   │   ├── globals.css               # Brand styles + WCAG fixes
│   │   └── layout.tsx
│   └── components/
│       └── RetirementChart.tsx       # Timeline + Monte Carlo fan chart
└── README.md
```

---

## API Reference

### `POST /api/retirement/calculate`

**Request body:**
```json
{
  "currentAge": 25,
  "retirementAge": 60,
  "lifeExpectancy": 85,
  "monthlyExpense": 40000,
  "inflationRate": 0.06,
  "preReturn": 0.10,
  "postReturn": 0.07,
  "stepUpRate": 0.10,
  "existingCorpus": 0
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "futureMonthlyExpense": 307395,
    "requiredCorpus": 45230000,
    "monthlySIP": 8420,
    "monthlyStepUpSIP": 3210,
    "yearsCorpusLasts": 25,
    "successProbability": 84.2,
    "monteCarloFan": [...],
    "timeline": [...],
    "regret": {...},
    "sensitivity": {...},
    "expenseBuckets": { "general": 180000, "medical": 95000, "lifestyle": 32000 }
  }
}
```

---

## Judging Criteria Mapping

| Criterion | Weight | What we built |
|---|---|---|
| Financial logic accuracy | 25% | Industry-standard formulas, Gaussian Monte Carlo, step-up SIP binary search |
| Compliance adherence | 20% | Mandatory disclaimer pinned, no guarantee language, all assumptions disclosed |
| Accessibility compliance | 15% | WCAG 2.1 AA — skip link, ARIA, reduced motion, forced colors, SR tables |
| UX clarity | 15% | Persona presets, scenario buttons, paycheck view, regret calculator |
| Technical quality | 15% | Clean separation of concerns, TypeScript, modular formula layer |
| Responsiveness | 10% | CSS Grid auto-fit, mobile-first inputs, 640px breakpoints |

---

## Disclaimer

This tool has been designed for information purposes only. Actual results may vary depending on various factors involved in capital market. Investor should not consider above as a recommendation for any schemes of HDFC Mutual Fund. Past performance may or may not be sustained in future and is not a guarantee of any future returns.