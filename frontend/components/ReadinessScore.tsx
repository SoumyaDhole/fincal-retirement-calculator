"use client";

const BLUE  = "#224c87";
const RED   = "#da3832";
const GREEN = "#1a7a4a";
const AMBER = "#b45309";

interface ReadinessScoreProps {
    result: any;
    form:   any;
}

function scoreColor(score: number) {
    if (score >= 75) return GREEN;
    if (score >= 50) return BLUE;
    if (score >= 30) return AMBER;
    return RED;
}

function scoreLabel(score: number) {
    if (score >= 75) return "Excellent";
    if (score >= 50) return "On Track";
    if (score >= 30) return "Needs Attention";
    return "At Risk";
}

export default function ReadinessScore({ result, form }: ReadinessScoreProps) {

    // ── Score components (each out of their max, sum = 100) ──────
    // 1. Success probability          — 35 pts
    const probScore = Math.round((result.successProbability / 100) * 35);

    // 2. Corpus duration vs needed    — 25 pts
    const neededYears    = Number(form.lifeExpectancy) - Number(form.retirementAge);
    const durationScore  = Math.round(Math.min(result.yearsCorpusLasts / neededYears, 1) * 25);

    // 3. SIP affordability            — 20 pts
    // SIP as % of monthly expense — lower is better
    const sipRatio       = result.monthlySIP / Number(form.monthlyExpense);
    const affordScore    = Math.round(Math.max(0, 1 - Math.min(sipRatio, 1)) * 20);

    // 4. Time horizon bonus           — 20 pts
    // More years to retirement = more time to compound
    const yearsLeft      = Number(form.retirementAge) - Number(form.currentAge);
    const horizonScore   = Math.round(Math.min(yearsLeft / 35, 1) * 20);

    const total = probScore + durationScore + affordScore + horizonScore;

    const color  = scoreColor(total);
    const label  = scoreLabel(total);

    // Arc geometry
    const radius = 70;
    const cx     = 100;
    const cy     = 100;
    const stroke = 12;
    const circumference = Math.PI * radius; // half circle
    const pct    = Math.min(total / 100, 1);
    const dashOffset = circumference * (1 - pct);

    const components = [
        { label: "Success probability", score: probScore,    max: 35, desc: `${Math.round(result.successProbability)}% Monte Carlo success rate` },
        { label: "Corpus duration",     score: durationScore, max: 25, desc: `Corpus may last ${result.yearsCorpusLasts} of ${neededYears} needed years` },
        { label: "SIP affordability",   score: affordScore,  max: 20, desc: `SIP is ${Math.round(sipRatio * 100)}% of current monthly expense` },
        { label: "Time horizon",        score: horizonScore, max: 20, desc: `${yearsLeft} years to grow your wealth` },
    ];

    return (
        <section aria-labelledby="readiness-heading" style={{
            padding: "24px", borderRadius: 14,
            border: `2px solid ${color}22`,
            background: "#fff",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            marginBottom: 28
        }}>
            <h3 id="readiness-heading" style={{
                fontSize: 15, fontWeight: 700, color: BLUE,
                marginBottom: 20, fontFamily: "Montserrat,Arial,sans-serif"
            }}>
                Retirement Readiness Score
            </h3>

            <div style={{
                display: "flex", flexWrap: "wrap",
                gap: 24, alignItems: "center"
            }}>
                {/* Gauge */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <svg
                        width="200" height="120"
                        role="img"
                        aria-label={`Retirement readiness score: ${total} out of 100 — ${label}`}
                        viewBox="0 0 200 120"
                    >
                        {/* Background arc */}
                        <path
                            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
                            fill="none"
                            stroke="#f0f0f0"
                            strokeWidth={stroke}
                            strokeLinecap="round"
                        />
                        {/* Score arc */}
                        <path
                            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
                            fill="none"
                            stroke={color}
                            strokeWidth={stroke}
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={dashOffset}
                            style={{ transition: "stroke-dashoffset 1s ease" }}
                        />
                        {/* Score number */}
                        <text
                            x={cx} y={cy - 8}
                            textAnchor="middle"
                            fontSize="32"
                            fontWeight="700"
                            fill={color}
                            fontFamily="Montserrat,Arial,sans-serif"
                        >
                            {total}
                        </text>
                        <text
                            x={cx} y={cy + 14}
                            textAnchor="middle"
                            fontSize="13"
                            fill="#666"
                            fontFamily="Montserrat,Arial,sans-serif"
                        >
                            {label}
                        </text>
                        {/* 0 and 100 labels */}
                        <text x={cx - radius - 4} y={cy + 16} fontSize="10" fill="#aaa" textAnchor="end">0</text>
                        <text x={cx + radius + 4} y={cy + 16} fontSize="10" fill="#aaa" textAnchor="start">100</text>
                    </svg>
                </div>

                {/* Component breakdown */}
                <div style={{ flex: 1, minWidth: 220 }}>
                    {components.map(c => {
                        const pct = c.score / c.max;
                        const barColor = pct >= 0.75 ? GREEN : pct >= 0.5 ? BLUE : pct >= 0.3 ? AMBER : RED;
                        return (
                            <div key={c.label} style={{ marginBottom: 12 }}>
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: 4
                                }}>
                                    <span style={{ fontSize: 12, color: "#444", fontWeight: 600 }}>
                                        {c.label}
                                    </span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: barColor }}>
                                        {c.score}/{c.max}
                                    </span>
                                </div>
                                <div style={{
                                    height: 6, background: "#f0f0f0",
                                    borderRadius: 3, overflow: "hidden"
                                }}
                                    role="progressbar"
                                    aria-valuenow={c.score}
                                    aria-valuemin={0}
                                    aria-valuemax={c.max}
                                    aria-label={`${c.label}: ${c.score} of ${c.max}`}
                                >
                                    <div style={{
                                        width: `${pct * 100}%`,
                                        height: "100%",
                                        background: barColor,
                                        borderRadius: 3,
                                        transition: "width 0.8s ease"
                                    }} />
                                </div>
                                <p style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{c.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            <p style={{ fontSize: 11, color: "#888", marginTop: 12, lineHeight: 1.6 }}>
                Score is illustrative and based on assumed rates. Not a guarantee of retirement outcomes.
            </p>
        </section>
    );
}
