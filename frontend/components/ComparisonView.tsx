"use client";

import { useState } from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS, LineElement, CategoryScale,
    LinearScale, PointElement, Tooltip, Legend, Filler
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler);

// ─── Types ────────────────────────────────────────────────────────
interface ScenarioForm {
    label:          string;
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

interface ScenarioResult {
    futureMonthlyExpense:       number;
    requiredCorpus:             number;
    monthlySIP:                 number;
    monthlyStepUpSIP:           number | null;
    yearsCorpusLasts:           number;
    successProbability:         number;
    timeline:                   any[];
    expenseBuckets:             { general: number; medical: number; lifestyle: number };
    monthlyRetirementIncome:    number;
    existingCorpusAtRetirement: number;
}

// ─── Helpers ──────────────────────────────────────────────────────
const BLUE  = "#224c87";
const RED   = "#da3832";
const GREEN = "#1a7a4a";
const GREY  = "#919090";

function fmtINR(n: number) {
    if (n >= 1e7) return "₹" + (n / 1e7).toFixed(2) + " Cr";
    if (n >= 1e5) return "₹" + (n / 1e5).toFixed(1) + " L";
    return "₹ " + Math.round(n).toLocaleString("en-IN");
}

function getRisk(p: number) {
    if (p >= 80) return { label: "SAFE",     color: "#2e7d32", bg: "#e6f4ea" };
    if (p >= 50) return { label: "MODERATE", color: "#e65100", bg: "#fff4e5" };
    return             { label: "RISKY",     color: "#c62828", bg: "#fdecea" };
}

const DEFAULT_A: ScenarioForm = {
    label: "Scenario A", currentAge: "30", retirementAge: "60",
    lifeExpectancy: "85", monthlyExpense: "50000", inflationRate: "6",
    preReturn: "10", postReturn: "7", stepUpRate: "0", existingCorpus: "0"
};

const DEFAULT_B: ScenarioForm = {
    label: "Scenario B", currentAge: "30", retirementAge: "60",
    lifeExpectancy: "85", monthlyExpense: "50000", inflationRate: "6",
    preReturn: "12", postReturn: "8", stepUpRate: "10", existingCorpus: "0"
};

// ─── Mini input ───────────────────────────────────────────────────
function MiniField({ label, name, value, onChange, color }: {
    label: string; name: string; value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    color: string;
}) {
    return (
        <div style={{ marginBottom: 10 }}>
            <label htmlFor={`${color}-${name}`} style={{
                display: "block", fontSize: 11,
                color: "#555", marginBottom: 3, fontWeight: 600
            }}>
                {label}
            </label>
            <input
                id={`${color}-${name}`}
                type="number" name={name} value={value}
                onChange={onChange}
                style={{
                    width: "100%", padding: "7px 10px",
                    border: `1.5px solid ${color}44`,
                    borderRadius: 6, fontSize: 13,
                    fontFamily: "Montserrat,Arial,sans-serif",
                    color: "#1a1a1a", background: "#fff",
                    outline: "none", boxSizing: "border-box"
                }}
                onFocus={e => e.target.style.borderColor = color}
                onBlur={e  => e.target.style.borderColor = `${color}44`}
            />
        </div>
    );
}

// ─── Metric row ───────────────────────────────────────────────────
function MetricRow({ label, a, b, higherIsBetter = true }: {
    label: string; a: string; b: string; higherIsBetter?: boolean;
}) {
    const aNum = parseFloat(a.replace(/[^0-9.]/g, ""));
    const bNum = parseFloat(b.replace(/[^0-9.]/g, ""));
    const aWins = higherIsBetter ? aNum >= bNum : aNum <= bNum;
    const bWins = higherIsBetter ? bNum >= aNum : bNum <= aNum;
    const tie   = aNum === bNum;

    return (
        <tr>
            <td style={{
                padding: "10px 12px", fontSize: 12,
                color: "#555", fontWeight: 500,
                borderBottom: "1px solid #f0f0f0",
                whiteSpace: "nowrap"
            }}>
                {label}
            </td>
            <td style={{
                padding: "10px 12px", fontSize: 13, fontWeight: 700,
                color: tie ? "#333" : aWins ? GREEN : "#c62828",
                textAlign: "center", borderBottom: "1px solid #f0f0f0"
            }}>
                {a} {!tie && aWins && <span aria-label="better">↑</span>}
            </td>
            <td style={{
                padding: "10px 12px", fontSize: 13, fontWeight: 700,
                color: tie ? "#333" : bWins ? GREEN : "#c62828",
                textAlign: "center", borderBottom: "1px solid #f0f0f0"
            }}>
                {b} {!tie && bWins && <span aria-label="better">↑</span>}
            </td>
        </tr>
    );
}

// ─── Comparison Chart ─────────────────────────────────────────────
function ComparisonChart({ resultA, resultB, labelA, labelB }: {
    resultA: ScenarioResult; resultB: ScenarioResult;
    labelA: string; labelB: string;
}) {
    const allAges = Array.from(new Set([
        ...resultA.timeline.map((t: any) => t.age),
        ...resultB.timeline.map((t: any) => t.age)
    ])).sort((a, b) => a - b);

    const mapA = Object.fromEntries(resultA.timeline.map((t: any) => [t.age, t.corpus]));
    const mapB = Object.fromEntries(resultB.timeline.map((t: any) => [t.age, t.corpus]));

    const data = {
        labels: allAges.map(a => `Age ${a}`),
        datasets: [
            {
                label:           labelA,
                data:            allAges.map(a => mapA[a] ?? null),
                borderColor:     BLUE,
                backgroundColor: "rgba(34,76,135,0.08)",
                borderWidth:     2.5, pointRadius: 0,
                fill: true, tension: 0.35, spanGaps: false
            },
            {
                label:           labelB,
                data:            allAges.map(a => mapB[a] ?? null),
                borderColor:     RED,
                backgroundColor: "rgba(218,56,50,0.07)",
                borderWidth:     2.5, pointRadius: 0,
                fill: true, tension: 0.35, spanGaps: false
            }
        ]
    };

    const options = {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: "index" as const, intersect: false },
        plugins: {
            legend: {
                display: true, position: "top" as const,
                labels: { font: { size: 12 }, padding: 16, boxWidth: 14 }
            },
            tooltip: {
                backgroundColor: "#fff", borderColor: "#e2e8f0",
                borderWidth: 1, titleColor: "#1e293b", bodyColor: "#475569",
                padding: 10,
                callbacks: { label: (c: any) => ` ${c.dataset.label}: ${fmtINR(c.raw)}` }
            }
        },
        scales: {
            x: { ticks: { maxTicksLimit: 10, color: GREY, font: { size: 11 } }, grid: { display: false } },
            y: { ticks: { color: GREY, font: { size: 11 }, callback: (v: any) => fmtINR(Number(v)) }, grid: { color: "rgba(0,0,0,0.05)" } }
        }
    };

    return (
        <div role="img" aria-label={`Comparison chart: ${labelA} vs ${labelB} corpus over time`}
            style={{ width: "100%", height: 300 }}>
            <Line data={data} options={options as any} />
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────
export default function ComparisonView() {
    const [formA,    setFormA]    = useState<ScenarioForm>(DEFAULT_A);
    const [formB,    setFormB]    = useState<ScenarioForm>(DEFAULT_B);
    const [resultA,  setResultA]  = useState<ScenarioResult | null>(null);
    const [resultB,  setResultB]  = useState<ScenarioResult | null>(null);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState("");

    const handleA = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFormA(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleB = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFormB(p => ({ ...p, [e.target.name]: e.target.value }));

    const toPayload = (f: ScenarioForm) => ({
        currentAge:     Number(f.currentAge),
        retirementAge:  Number(f.retirementAge),
        lifeExpectancy: Number(f.lifeExpectancy),
        monthlyExpense: Number(f.monthlyExpense),
        inflationRate:  Number(f.inflationRate)  / 100,
        preReturn:      Number(f.preReturn)       / 100,
        postReturn:     Number(f.postReturn)      / 100,
        stepUpRate:     Number(f.stepUpRate)      / 100,
        existingCorpus: Number(f.existingCorpus)
    });

    const compare = async () => {
        setError(""); setLoading(true);
        try {
            const [resA, resB] = await Promise.all([
                fetch("http://localhost:5000/api/retirement/calculate", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(toPayload(formA))
                }),
                fetch("http://localhost:5000/api/retirement/calculate", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(toPayload(formB))
                })
            ]);
            const [dA, dB] = await Promise.all([resA.json(), resB.json()]);
            setResultA(dA.data);
            setResultB(dB.data);
        } catch {
            setError("Could not connect to backend. Make sure it is running on port 5000.");
        }
        setLoading(false);
    };

    const riskA = resultA ? getRisk(resultA.successProbability) : null;
    const riskB = resultB ? getRisk(resultB.successProbability) : null;

    const FIELDS: { label: string; name: keyof ScenarioForm }[] = [
        { label: "Current age (yrs)",           name: "currentAge"     },
        { label: "Retirement age (yrs)",         name: "retirementAge"  },
        { label: "Life expectancy (yrs)",        name: "lifeExpectancy" },
        { label: "Monthly expense (₹)",          name: "monthlyExpense" },
        { label: "Existing corpus (₹)",          name: "existingCorpus" },
        { label: "Inflation rate (%)",           name: "inflationRate"  },
        { label: "Pre-retirement return (%)",    name: "preReturn"      },
        { label: "Post-retirement return (%)",   name: "postReturn"     },
        { label: "Annual SIP step-up (%)",       name: "stepUpRate"     },
    ];

    return (
        <>
            {/*
              ── MOBILE FIX: inject style tag to hide VS divider on small screens.
                 We use a style tag here because this component has no globals.css import,
                 and inline styles cannot target media queries.
            */}
            <style>{`
                @media (max-width: 640px) {
                    .vs-divider { display: none !important; }
                    .comparison-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>

            <section aria-labelledby="compare-heading" style={{ marginTop: 40 }}>

                {/* Header */}
                <div style={{ borderBottom: "2px solid #224c87", paddingBottom: 10, marginBottom: 24 }}>
                    <h2 id="compare-heading" style={{
                        fontSize: 20, fontWeight: 700, color: BLUE,
                        fontFamily: "Montserrat,Arial,sans-serif"
                    }}>
                        Scenario Comparison
                    </h2>
                    <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                        Enter two different sets of assumptions and compare them side by side. Illustrative only.
                    </p>
                </div>

                {/* Side-by-side input forms */}
                <div
                    className="comparison-grid"
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto 1fr",
                        gap: 16, marginBottom: 20,
                        alignItems: "start"
                    }}
                >
                    {/* Scenario A */}
                    <div style={{
                        padding: "20px", borderRadius: 12,
                        border: `2px solid ${BLUE}`,
                        background: "#f8faff"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: "50%",
                                background: BLUE, color: "#fff",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 14, fontWeight: 700,
                                flexShrink: 0
                            }}>A</div>
                            <input
                                type="text" value={formA.label}
                                onChange={e => setFormA(p => ({ ...p, label: e.target.value }))}
                                style={{
                                    flex: 1, border: "none", background: "transparent",
                                    fontSize: 15, fontWeight: 700, color: BLUE,
                                    fontFamily: "Montserrat,Arial,sans-serif", outline: "none"
                                }}
                                aria-label="Scenario A name"
                            />
                        </div>
                        {FIELDS.map(f => (
                            <MiniField key={f.name} label={f.label} name={f.name}
                                value={formA[f.name]} onChange={handleA} color={BLUE} />
                        ))}
                    </div>

                    {/* VS divider — hidden on mobile via .vs-divider class */}
                    <div
                        className="vs-divider"
                        aria-hidden="true"
                        style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 22, fontWeight: 800, color: GREY,
                            paddingTop: 60,
                            userSelect: "none"
                        }}
                    >
                        VS
                    </div>

                    {/* Scenario B */}
                    <div style={{
                        padding: "20px", borderRadius: 12,
                        border: `2px solid ${RED}`,
                        background: "#fff8f8"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: "50%",
                                background: RED, color: "#fff",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 14, fontWeight: 700,
                                flexShrink: 0
                            }}>B</div>
                            <input
                                type="text" value={formB.label}
                                onChange={e => setFormB(p => ({ ...p, label: e.target.value }))}
                                style={{
                                    flex: 1, border: "none", background: "transparent",
                                    fontSize: 15, fontWeight: 700, color: RED,
                                    fontFamily: "Montserrat,Arial,sans-serif", outline: "none"
                                }}
                                aria-label="Scenario B name"
                            />
                        </div>
                        {FIELDS.map(f => (
                            <MiniField key={f.name} label={f.label} name={f.name}
                                value={formB[f.name]} onChange={handleB} color={RED} />
                        ))}
                    </div>
                </div>

                {error && (
                    <p role="alert" style={{
                        color: RED, fontSize: 13, marginBottom: 14,
                        padding: "10px 14px", background: "#fdecea",
                        borderRadius: 6, border: "1px solid #f7b9b7"
                    }}>{error}</p>
                )}

                <button
                    onClick={compare} disabled={loading} aria-busy={loading}
                    style={{
                        background: BLUE, color: "#fff", border: "none",
                        padding: "13px 36px", borderRadius: 8,
                        fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.7 : 1, marginBottom: 32,
                        fontFamily: "Montserrat,Arial,sans-serif"
                    }}
                >
                    {loading ? "Comparing…" : "Compare scenarios"}
                </button>

                {/* Results */}
                {resultA && resultB && (
                    <div aria-live="polite" aria-label="Comparison results">

                        {/* Risk badges */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: 14, marginBottom: 24
                        }}>
                            {[
                                { r: resultA, risk: riskA!, label: formA.label, color: BLUE },
                                { r: resultB, risk: riskB!, label: formB.label, color: RED  }
                            ].map(({ r, risk, label, color }) => (
                                <div key={label} style={{
                                    padding: "18px 20px", borderRadius: 12,
                                    border: `2px solid ${color}22`,
                                    background: "#fff",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                                }}>
                                    <div style={{
                                        fontSize: 12, fontWeight: 700, color,
                                        marginBottom: 12, display: "flex",
                                        alignItems: "center", gap: 8
                                    }}>
                                        <div style={{
                                            width: 24, height: 24, borderRadius: "50%",
                                            background: color, color: "#fff",
                                            display: "flex", alignItems: "center",
                                            justifyContent: "center", fontSize: 11, fontWeight: 700
                                        }}>
                                            {label === formA.label ? "A" : "B"}
                                        </div>
                                        {label}
                                    </div>
                                    <div style={{
                                        display: "inline-block", padding: "4px 14px",
                                        borderRadius: 6, background: risk.bg,
                                        color: risk.color, fontSize: 16,
                                        fontWeight: 700, marginBottom: 10
                                    }}>
                                        {risk.label} — {Math.round(r.successProbability)}%
                                    </div>
                                    <p style={{ fontSize: 12, color: "#555" }}>
                                        Corpus: <strong style={{ color }}>{fmtINR(r.requiredCorpus)}</strong>
                                    </p>
                                    <p style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
                                        Monthly SIP: <strong style={{ color }}>{fmtINR(r.monthlySIP)}</strong>
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Head-to-head table */}
                        <div style={{ marginBottom: 28, overflowX: "auto" }}>
                            <h3 style={{
                                fontSize: 14, fontWeight: 700, color: BLUE,
                                marginBottom: 12, fontFamily: "Montserrat,Arial,sans-serif"
                            }}>
                                Head-to-head comparison
                            </h3>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
                                aria-label="Head to head scenario comparison table">
                                <thead>
                                    <tr style={{ background: "#f7f9fc" }}>
                                        <th style={{ padding: "10px 12px", textAlign: "left", color: "#555", fontWeight: 600, borderBottom: "2px solid #e5e5e5" }}>Metric</th>
                                        <th style={{ padding: "10px 12px", textAlign: "center", color: BLUE, fontWeight: 700, borderBottom: "2px solid #224c87" }}>{formA.label}</th>
                                        <th style={{ padding: "10px 12px", textAlign: "center", color: RED,  fontWeight: 700, borderBottom: "2px solid #da3832" }}>{formB.label}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <MetricRow label="Required corpus"           a={fmtINR(resultA.requiredCorpus)}             b={fmtINR(resultB.requiredCorpus)}             higherIsBetter={false} />
                                    <MetricRow label="Monthly SIP (flat)"        a={fmtINR(resultA.monthlySIP)}                 b={fmtINR(resultB.monthlySIP)}                 higherIsBetter={false} />
                                    <MetricRow label="Future monthly expense"    a={fmtINR(resultA.futureMonthlyExpense)}       b={fmtINR(resultB.futureMonthlyExpense)}       higherIsBetter={false} />
                                    <MetricRow label="Corpus duration (years)"   a={`${resultA.yearsCorpusLasts} yrs`}          b={`${resultB.yearsCorpusLasts} yrs`}          higherIsBetter={true}  />
                                    <MetricRow label="Success probability"       a={`${Math.round(resultA.successProbability)}%`} b={`${Math.round(resultB.successProbability)}%`} higherIsBetter={true} />
                                    <MetricRow label="Monthly retirement income" a={fmtINR(resultA.monthlyRetirementIncome)}    b={fmtINR(resultB.monthlyRetirementIncome)}    higherIsBetter={true}  />
                                    {(resultA.monthlyStepUpSIP || resultB.monthlyStepUpSIP) && (
                                        <MetricRow label="Step-up SIP"
                                            a={resultA.monthlyStepUpSIP ? fmtINR(resultA.monthlyStepUpSIP) : "—"}
                                            b={resultB.monthlyStepUpSIP ? fmtINR(resultB.monthlyStepUpSIP) : "—"}
                                            higherIsBetter={false}
                                        />
                                    )}
                                </tbody>
                            </table>
                            <p style={{ fontSize: 11, color: "#888", marginTop: 6 }}>
                                ↑ indicates the better value for that metric. All values are illustrative estimates.
                            </p>
                        </div>

                        {/* Overlay chart */}
                        <div style={{ marginBottom: 16 }}>
                            <h3 style={{
                                fontSize: 14, fontWeight: 700, color: BLUE,
                                marginBottom: 12, fontFamily: "Montserrat,Arial,sans-serif"
                            }}>
                                Wealth timeline overlay
                            </h3>
                            <ComparisonChart
                                resultA={resultA} resultB={resultB}
                                labelA={formA.label} labelB={formB.label}
                            />
                        </div>

                        <p role="note" style={{ fontSize: 11, color: "#888", marginTop: 12, lineHeight: 1.6 }}>
                            This tool has been designed for information purposes only. Actual results may vary depending on various factors involved in capital market. Investor should not consider above as a recommendation for any schemes of HDFC Mutual Fund. Past performance may or may not be sustained in future and is not a guarantee of any future returns.
                        </p>
                    </div>
                )}
            </section>
        </>
    );
}
