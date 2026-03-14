"use client";

import { useState, useId } from "react";
import RetirementChart from "../components/RetirementChart";

// ─── Types ────────────────────────────────────────────────────────
interface FormState {
    currentAge:     string;
    retirementAge:  string;
    lifeExpectancy: string;
    monthlyExpense: string;
    inflationRate:  string;
    preReturn:      string;
    postReturn:     string;
    stepUpRate:     string;
    existingCorpus: string;
}

// ─── Persona presets ──────────────────────────────────────────────
const PERSONAS = [
    {
        label: "Fresh Graduate",
        desc:  "Age 22 · ₹30k/month",
        values: {
            currentAge: "22", retirementAge: "60", lifeExpectancy: "85",
            monthlyExpense: "30000", inflationRate: "6", preReturn: "12",
            postReturn: "7", stepUpRate: "10", existingCorpus: "0"
        }
    },
    {
        label: "Mid-career",
        desc:  "Age 35 · ₹80k/month",
        values: {
            currentAge: "35", retirementAge: "60", lifeExpectancy: "85",
            monthlyExpense: "80000", inflationRate: "6", preReturn: "10",
            postReturn: "7", stepUpRate: "8", existingCorpus: "500000"
        }
    },
    {
        label: "Late Starter",
        desc:  "Age 45 · ₹1.5L/month",
        values: {
            currentAge: "45", retirementAge: "62", lifeExpectancy: "85",
            monthlyExpense: "150000", inflationRate: "6", preReturn: "9",
            postReturn: "7", stepUpRate: "5", existingCorpus: "2000000"
        }
    }
] as const;

const SCENARIOS = {
    conservative: { preReturn: "7",  postReturn: "5",  label: "Conservative" },
    moderate:     { preReturn: "10", postReturn: "7",  label: "Moderate" },
    aggressive:   { preReturn: "12", postReturn: "9",  label: "Aggressive" }
} as const;

// ─── Formatting helpers ───────────────────────────────────────────
function fmtINR(n: number) {
    if (n >= 1e7) return "₹" + (n / 1e7).toFixed(2) + " Cr";
    if (n >= 1e5) return "₹" + (n / 1e5).toFixed(1) + " L";
    return "₹ " + Math.round(n).toLocaleString("en-IN");
}

function getRisk(prob: number) {
    if (prob >= 80) return { label: "SAFE",     bg: "#e6f4ea", color: "#2e7d32" };
    if (prob >= 50) return { label: "MODERATE", bg: "#fff4e5", color: "#e65100" };
    return               { label: "RISKY",     bg: "#fdecea", color: "#c62828" };
}

// ─── Reusable Input ───────────────────────────────────────────────
function Field({ label, name, value, onChange, hint }: {
    label: string; name: string; value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    hint?: string;
}) {
    const id = `field-${name}`;
    const hintId = hint ? `hint-${name}` : undefined;
    return (
        <div>
            <label htmlFor={id} style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 4 }}>
                {label}
            </label>
            {hint && (
                <p id={hintId} style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>{hint}</p>
            )}
            <input
                id={id} type="number" name={name} value={value}
                onChange={onChange}
                aria-describedby={hintId}
                style={{ width: "100%" }}
            />
        </div>
    );
}

// ─── Result Card ──────────────────────────────────────────────────
function ResultCard({
    title, value, sub, highlight, color
}: {
    title: string; value: string; sub?: string;
    highlight?: boolean; color?: string;
}) {
    return (
        <div style={{
            padding: "18px 20px", borderRadius: 10,
            border: highlight ? "2px solid #224c87" : "1px solid #e5e5e5",
            background: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
        }}>
            <p style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>{title}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: color ?? "#224c87", lineHeight: 1.2 }}>{value}</p>
            {sub && <p style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{sub}</p>}
        </div>
    );
}

// ─── Bucket Card ──────────────────────────────────────────────────
function BucketCard({ label, value, rate, color, pct }: {
    label: string; value: string; rate: string; color: string; pct: string;
}) {
    return (
        <div style={{
            padding: 16, borderRadius: 8,
            border: `1.5px solid ${color}33`, background: "white"
        }}>
            <span style={{
                fontSize: 11, fontWeight: 700, color: "white",
                background: color, padding: "2px 8px",
                borderRadius: 4, display: "inline-block", marginBottom: 8
            }}>
                {pct}
            </span>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 4 }}>{label}</p>
            <p style={{ fontSize: 18, fontWeight: 700, color }}>{value}</p>
            <p style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Assumed {rate}</p>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────
export default function Home() {
    const [form, setForm] = useState<FormState>({
        currentAge: "25", retirementAge: "60", lifeExpectancy: "85",
        monthlyExpense: "40000", inflationRate: "6", preReturn: "10",
        postReturn: "7", stepUpRate: "0", existingCorpus: "0"
    });
    const [result,   setResult]   = useState<any>(null);
    const [scenario, setScenario] = useState<keyof typeof SCENARIOS>("moderate");
    const [persona,  setPersona]  = useState("");
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const applyScenario = (type: keyof typeof SCENARIOS) => {
        setScenario(type);
        setForm(prev => ({
            ...prev,
            preReturn:  SCENARIOS[type].preReturn,
            postReturn: SCENARIOS[type].postReturn
        }));
    };

    const applyPersona = (p: typeof PERSONAS[number]) => {
        setPersona(p.label);
        setForm({ ...p.values });
    };

    const calculate = async () => {
        setError("");
        setLoading(true);
        try {
            const payload = {
                currentAge:     Number(form.currentAge),
                retirementAge:  Number(form.retirementAge),
                lifeExpectancy: Number(form.lifeExpectancy),
                monthlyExpense: Number(form.monthlyExpense),
                inflationRate:  Number(form.inflationRate)  / 100,
                preReturn:      Number(form.preReturn)       / 100,
                postReturn:     Number(form.postReturn)      / 100,
                stepUpRate:     Number(form.stepUpRate)      / 100,
                existingCorpus: Number(form.existingCorpus)
            };
            const res  = await fetch("http://localhost:5000/api/retirement/calculate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("Server error");
            const data = await res.json();
            setResult(data.data);
            setTimeout(() => {
                document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
        } catch {
            setError("Could not connect to backend. Make sure it is running on port 5000.");
        }
        setLoading(false);
    };

    const risk = result ? getRisk(result.successProbability) : null;

    // Sensitivity table styles
    const thS: React.CSSProperties = {
        padding: "10px 14px", background: "#224c87",
        color: "white", fontWeight: 600, fontSize: 12,
        textAlign: "left", whiteSpace: "nowrap"
    };
    const tdS = (hi: boolean): React.CSSProperties => ({
        padding: "10px 14px", fontSize: 12,
        border: "1px solid #e5e5e5",
        background: hi ? "#e8f0fb" : "white",
        fontWeight: hi ? 700 : 400,
        color:      hi ? "#224c87" : "#333",
        outline:    hi ? "2px solid #224c87" : "none"
    });

    return (
        <>
            {/* ── Skip navigation (WCAG) ── */}
            <a
                href="#main-content"
                className="skip-link"
                style={{
                    position: "absolute", top: -40, left: 8,
                    background: "#224c87", color: "#fff",
                    padding: "8px 12px", borderRadius: 4,
                    fontSize: 13, fontWeight: 600,
                    zIndex: 9999, textDecoration: "none",
                    transition: "top 0.2s"
                }}
                onFocus={e => (e.currentTarget.style.top = "8px")}
                onBlur={e  => (e.currentTarget.style.top = "-40px")}
            >
                Skip to main content
            </a>

            <main id="main-content" style={{ maxWidth: 880, margin: "0 auto", padding: "32px 20px 96px" }}>

                {/* ── HEADER ── */}
                <header style={{ borderBottom: "3px solid #224c87", paddingBottom: 16, marginBottom: 28 }}>
                    <h1 style={{ fontSize: 26, fontWeight: 700, color: "#224c87", fontFamily: "Montserrat,Arial,sans-serif" }}>
                        FinCal Retirement Calculator
                    </h1>
                    <p style={{ fontSize: 12, color: "#666", marginTop: 6, maxWidth: 600, lineHeight: 1.6 }}>
                        All values are <strong>illustrative estimates</strong> based on assumed rates. This tool is for educational purposes only — not investment advice.
                    </p>
                </header>

                {/* ── PERSONA PRESETS ── */}
                <section aria-labelledby="persona-heading" style={{ marginBottom: 28 }}>
                    <h2 id="persona-heading" style={sectionHead}>Quick start — choose a profile</h2>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }} role="group" aria-labelledby="persona-heading">
                        {PERSONAS.map(p => (
                            <button
                                key={p.label}
                                onClick={() => applyPersona(p)}
                                aria-pressed={persona === p.label}
                                style={{
                                    background:   persona === p.label ? "#224c87" : "#f1f5fb",
                                    color:        persona === p.label ? "#fff"    : "#224c87",
                                    border:       "1.5px solid #224c87",
                                    borderRadius: 8,
                                    padding:      "10px 18px",
                                    fontWeight:   600,
                                    cursor:       "pointer",
                                    fontSize:     13,
                                    textAlign:    "left"
                                }}
                            >
                                {p.label}
                                <span style={{ display: "block", fontSize: 11, fontWeight: 400, opacity: 0.85 }}>{p.desc}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* ── SCENARIO BUTTONS ── */}
                <section aria-labelledby="scenario-heading" style={{ marginBottom: 28 }}>
                    <h2 id="scenario-heading" style={sectionHead}>Investment scenario</h2>
                    <p style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>
                        Sets assumed pre- and post-retirement return rates. You can edit them manually below.
                    </p>
                    <div role="group" aria-labelledby="scenario-heading" style={{ display: "flex", gap: 10 }}>
                        {(Object.entries(SCENARIOS) as [keyof typeof SCENARIOS, typeof SCENARIOS[keyof typeof SCENARIOS]][]).map(([key, s]) => (
                            <button
                                key={key}
                                onClick={() => applyScenario(key)}
                                aria-pressed={scenario === key}
                                style={{
                                    background:  scenario === key ? "#224c87" : "#f1f1f1",
                                    color:       scenario === key ? "#fff"    : "#444",
                                    border:      "none",
                                    borderRadius: 6,
                                    padding:     "8px 20px",
                                    fontWeight:  scenario === key ? 700 : 400,
                                    cursor:      "pointer",
                                    fontSize:    13
                                }}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* ── FORM ── */}
                <section aria-labelledby="form-heading" style={{ marginBottom: 28 }}>
                    <h2 id="form-heading" style={sectionHead}>Your details</h2>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                        gap: 20
                    }}>
                        <Field label="Current age (years)"             name="currentAge"     value={form.currentAge}     onChange={handleChange} hint="Your age today" />
                        <Field label="Retirement age (years)"          name="retirementAge"  value={form.retirementAge}  onChange={handleChange} hint="Age you plan to retire" />
                        <Field label="Life expectancy (years)"         name="lifeExpectancy" value={form.lifeExpectancy} onChange={handleChange} hint="Plan until this age for safety" />
                        <Field label="Current monthly expenses (₹)"   name="monthlyExpense" value={form.monthlyExpense} onChange={handleChange} hint="Your current total monthly spending" />
                        <Field label="Existing savings / corpus (₹)"  name="existingCorpus" value={form.existingCorpus} onChange={handleChange} hint="EPF, FD, MF etc. already saved. Enter 0 if none." />
                        <Field label="Assumed inflation rate (%)"      name="inflationRate"  value={form.inflationRate}  onChange={handleChange} hint="Assumption only. Typical: 5–7%." />
                        <Field label="Assumed pre-retirement return (%)" name="preReturn"    value={form.preReturn}      onChange={handleChange} hint="Expected return during working years. Assumption only." />
                        <Field label="Assumed post-retirement return (%)" name="postReturn"  value={form.postReturn}     onChange={handleChange} hint="Expected return after retirement. Assumption only." />
                        <Field label="Annual SIP step-up (%) — optional" name="stepUpRate"  value={form.stepUpRate}     onChange={handleChange} hint="% increase in SIP each year. Enter 0 to skip." />
                    </div>

                    {error && (
                        <p role="alert" style={{
                            color: "#da3832", fontSize: 13,
                            marginTop: 14, padding: "10px 14px",
                            background: "#fdecea", borderRadius: 6,
                            border: "1px solid #f7b9b7"
                        }}>
                            {error}
                        </p>
                    )}

                    <button
                        onClick={calculate}
                        disabled={loading}
                        aria-busy={loading}
                        style={{
                            marginTop: 24, background: "#224c87", color: "#fff",
                            padding: "14px 40px", borderRadius: 8, border: "none",
                            fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                            opacity: loading ? 0.7 : 1,
                            fontFamily: "Montserrat,Arial,sans-serif"
                        }}
                    >
                        {loading ? "Calculating…" : "Calculate retirement plan"}
                    </button>
                </section>

                {/* ── RESULTS ── */}
                {result && (
                    <section
                        id="results-section"
                        aria-label="Retirement calculation results"
                        aria-live="polite"
                        style={{ marginTop: 16 }}
                    >
                        <div style={{ borderBottom: "2px solid #224c87", paddingBottom: 8, marginBottom: 24 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#224c87" }}>
                                Estimated retirement results
                            </h2>
                            <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                                Illustrative projections only — not a guarantee of future returns.
                            </p>
                        </div>

                        {/* ── MAIN RESULT CARDS ── */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: 14, marginBottom: 24
                        }}>
                            <ResultCard
                                title="Future monthly expense at retirement"
                                value={fmtINR(result.futureMonthlyExpense)}
                                sub="Inflation-adjusted at retirement age"
                            />
                            <ResultCard
                                title="Required retirement corpus"
                                value={fmtINR(result.requiredCorpus)}
                                sub="Total estimated corpus needed"
                                highlight
                            />
                            <ResultCard
                                title="Monthly SIP required (flat)"
                                value={fmtINR(result.monthlySIP)}
                                sub="Constant monthly investment needed"
                            />
                            {result.monthlyStepUpSIP && (
                                <ResultCard
                                    title={`Monthly SIP with ${form.stepUpRate}% annual step-up`}
                                    value={fmtINR(result.monthlyStepUpSIP)}
                                    sub="Lower starting SIP, increases yearly"
                                    highlight
                                />
                            )}
                            {result.existingCorpusAtRetirement > 0 && (
                                <ResultCard
                                    title="Your existing savings at retirement"
                                    value={fmtINR(result.existingCorpusAtRetirement)}
                                    sub="Current corpus compounded to retirement"
                                    color="#2e7d32"
                                />
                            )}
                            <ResultCard
                                title="Estimated corpus duration"
                                value={`${result.yearsCorpusLasts} yrs`}
                                sub="How long corpus may last"
                            />
                            <ResultCard
                                title="Success probability"
                                value={`${Math.round(result.successProbability)}%`}
                                sub="Based on 1,000 Monte Carlo simulations"
                                color={risk!.color}
                            />
                        </div>

                        {/* ── RETIREMENT PAYCHECK ── */}
                        <div style={{
                            padding: "20px 24px", background: "#f0f4fb",
                            borderRadius: 10, border: "1.5px solid #224c87", marginBottom: 24
                        }}>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#224c87", marginBottom: 8 }}>
                                Your estimated retirement paycheck
                            </h3>
                            <p style={{ fontSize: 14, color: "#333", lineHeight: 1.7 }}>
                                Your estimated corpus of <strong>{fmtINR(result.requiredCorpus)}</strong> could provide a monthly income of{" "}
                                <strong style={{ color: "#224c87", fontSize: 20 }}>{fmtINR(result.monthlyRetirementIncome)}</strong>{" "}
                                per month at retirement.
                            </p>
                            <p style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                                Equivalent to today's <strong>{fmtINR(result.monthlyIncomeInTodaysMoney)}</strong>/month in purchasing power.
                            </p>
                            <p style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                                Illustrative only. Based on assumed inflation and return rates.
                            </p>
                        </div>

                        {/* ── INFLATION BUCKETS ── */}
                        <section aria-labelledby="buckets-heading" style={{ marginBottom: 28 }}>
                            <h3 id="buckets-heading" style={{ fontSize: 14, fontWeight: 700, color: "#224c87", marginBottom: 6 }}>
                                Expense breakdown at retirement
                            </h3>
                            <p style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
                                Your spending is split into three buckets, each with a different assumed inflation rate.
                            </p>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                                <BucketCard label="General living"    value={fmtINR(result.expenseBuckets.general)}   rate="6% inflation" color="#224c87" pct="60% of expenses" />
                                <BucketCard label="Medical"           value={fmtINR(result.expenseBuckets.medical)}   rate="8% inflation" color="#da3832" pct="25% of expenses" />
                                <BucketCard label="Lifestyle & travel" value={fmtINR(result.expenseBuckets.lifestyle)} rate="4% inflation" color="#2e7d32" pct="15% of expenses" />
                            </div>
                        </section>

                        {/* ── RISK INDICATOR ── */}
                        <section aria-labelledby="risk-heading" style={{ marginBottom: 28 }}>
                            <h3 id="risk-heading" style={{ fontSize: 14, fontWeight: 700, color: "#224c87", marginBottom: 10 }}>
                                Retirement risk level
                            </h3>
                            <div style={{
                                background:   risk!.bg,
                                color:        risk!.color,
                                padding:      "12px 28px",
                                borderRadius: 8,
                                fontWeight:   700,
                                display:      "inline-block",
                                fontSize:     20,
                                letterSpacing: 1
                            }}
                                aria-label={`Risk level: ${risk!.label} — success probability ${Math.round(result.successProbability)}%`}
                            >
                                {risk!.label} — {Math.round(result.successProbability)}%
                            </div>
                            <p style={{ fontSize: 11, color: "#666", marginTop: 8 }}>
                                SAFE ≥ 80% &nbsp;|&nbsp; MODERATE ≥ 50% &nbsp;|&nbsp; RISKY &lt; 50%
                            </p>
                        </section>

                        {/* ── REGRET CALCULATOR ── */}
                        <section
                            aria-labelledby="regret-heading"
                            style={{
                                padding: "20px 24px", background: "#fff8f8",
                                borderRadius: 10, border: "1.5px solid #da3832", marginBottom: 28
                            }}
                        >
                            <h3 id="regret-heading" style={{ fontSize: 14, fontWeight: 700, color: "#da3832", marginBottom: 12 }}>
                                Cost of starting {result.regret.delayYears} years late
                            </h3>
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                                gap: 14
                            }}>
                                <div>
                                    <p style={{ fontSize: 11, color: "#666" }}>If you start now</p>
                                    <p style={{ fontSize: 22, fontWeight: 700, color: "#2e7d32" }}>
                                        {fmtINR(result.regret.sipIfStartNow)}<span style={{ fontSize: 12, fontWeight: 400 }}>/mo</span>
                                    </p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 11, color: "#666" }}>If you delay {result.regret.delayYears} years</p>
                                    <p style={{ fontSize: 22, fontWeight: 700, color: "#da3832" }}>
                                        {fmtINR(result.regret.sipIfDelayed)}<span style={{ fontSize: 12, fontWeight: 400 }}>/mo</span>
                                    </p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 11, color: "#666" }}>Extra total you would pay</p>
                                    <p style={{ fontSize: 22, fontWeight: 700, color: "#da3832" }}>
                                        {fmtINR(result.regret.extraTotalPaid)}
                                    </p>
                                </div>
                            </div>
                            <p style={{ fontSize: 11, color: "#888", marginTop: 12 }}>
                                Illustrative only. Based on assumed return rates.
                            </p>
                        </section>

                        {/* ── SENSITIVITY TABLE ── */}
                        <section aria-labelledby="sensitivity-heading" style={{ marginBottom: 28 }}>
                            <h3 id="sensitivity-heading" style={{ fontSize: 14, fontWeight: 700, color: "#224c87", marginBottom: 6 }}>
                                Sensitivity analysis — monthly SIP required
                            </h3>
                            <p style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
                                How your required SIP changes across different assumed return and inflation combinations. Highlighted cell = your current assumptions.
                            </p>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
                                    aria-label="Sensitivity analysis table — required monthly SIP by return and inflation rate"
                                >
                                    <thead>
                                        <tr>
                                            <th scope="col" style={thS}>Return ↓ / Inflation →</th>
                                            {result.sensitivity.inflationLabels.map((l: string) => (
                                                <th scope="col" key={l} style={thS}>Inflation {l}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.sensitivity.table.map((row: number[], i: number) => (
                                            <tr key={i}>
                                                <th scope="row" style={{ ...tdS(false), fontWeight: 600 }}>
                                                    Return {result.sensitivity.returnLabels[i]}
                                                </th>
                                                {row.map((val, j) => (
                                                    <td key={j} style={tdS(i === 1 && j === 1)}>
                                                        {fmtINR(val)}
                                                        {i === 1 && j === 1 && (
                                                            <span className="sr-only"> (your current rates)</span>
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p style={{ fontSize: 11, color: "#888", marginTop: 6 }}>
                                All values illustrative. Actual SIP required may differ based on market conditions.
                            </p>
                        </section>

                        {/* ── CHART (Timeline + Monte Carlo) ── */}
                        <section aria-labelledby="chart-heading" style={{ marginBottom: 28 }}>
                            <h2 id="chart-heading" style={{ fontSize: 18, fontWeight: 700, color: "#224c87", marginBottom: 4 }}>
                                Retirement wealth projection
                            </h2>
                            <p style={{ fontSize: 12, color: "#666", marginBottom: 16 }}>
                                Illustrative projection of corpus growth and drawdown over time.
                            </p>
                            <RetirementChart
                                timeline={result.timeline}
                                monteCarloFan={result.monteCarloFan}
                                yearsToRetirement={result.yearsToRetirement}
                            />
                        </section>

                        {/* ── IN-PAGE DISCLAIMER ── */}
                        <div style={{
                            marginTop: 24, padding: "14px 18px",
                            fontSize: 11, color: "#666",
                            borderTop: "1px solid #e0e0e0",
                            lineHeight: 1.7
                        }}
                            role="note"
                            aria-label="Important disclaimer"
                        >
                            * All calculations are illustrative and based on assumed rates of return and inflation.<br />
                            * Returns are assumed annual rates and are not guaranteed in any way.<br />
                            * Past performance may or may not be sustained in future.
                        </div>
                    </section>
                )}
            </main>

            {/* ── PINNED DISCLAIMER BAR ── */}
            <div
                role="contentinfo"
                aria-label="Legal disclaimer"
                style={{
                    position: "fixed", bottom: 0, left: 0, right: 0,
                    background: "#f7f9fc", borderTop: "1px solid #d0d0d0",
                    padding: "8px 24px", fontSize: 11, color: "#555",
                    zIndex: 999, lineHeight: 1.7
                }}
            >
                This tool has been designed for information purposes only. Actual results may vary depending on various factors involved in capital market. Investor should not consider above as a recommendation for any schemes of HDFC Mutual Fund. Past performance may or may not be sustained in future and is not a guarantee of any future returns.
            </div>
        </>
    );
}

// ─── Shared style constants ───────────────────────────────────────
const sectionHead: React.CSSProperties = {
    fontSize: 14, fontWeight: 700,
    color: "#224c87", marginBottom: 10
};
