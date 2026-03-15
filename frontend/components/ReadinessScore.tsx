"use client";

interface ReadinessProps {
  result: any;
  form: any;
  darkMode?: boolean;
}

export default function ReadinessScore({ result, form, darkMode = false }: ReadinessProps) {
  const bg       = darkMode ? "#1a1d2a" : "#ffffff";
  const border   = darkMode ? "#252836" : "#e5e7eb";
  const text     = darkMode ? "#f1f5f9" : "#111827";
  const textSub  = darkMode ? "#94a3b8" : "#4b5563";
  const textMuted= darkMode ? "#4b5563" : "#9ca3af";
  const trackBg  = darkMode ? "#252836" : "#e5e7eb";
  const accent   = "#224c87";

  const successPct  = result.successProbability;
  const corpusPct   = Math.min(100, (result.yearsCorpusLasts / result.retirementYears) * 100);
  const sipRatio    = result.monthlySIP / Number(form.monthlyExpense);
  const sipAfford   = Math.max(0, Math.min(100, (1 - sipRatio / 2) * 100));
  const timeHorizon = Math.min(100, (result.yearsToRetirement / 35) * 100);

  const components = [
    { label: "Success probability", score: Math.round((successPct / 100) * 35), max: 35, pct: successPct, desc: `${successPct.toFixed(0)}% Monte Carlo success rate`, color: "#224c87" },
    { label: "Corpus duration",     score: Math.round((corpusPct / 100) * 25),  max: 25, pct: corpusPct,  desc: `Corpus may last ${result.yearsCorpusLasts} of ${result.retirementYears} needed years`, color: "#059669" },
    { label: "SIP affordability",   score: Math.round((sipAfford / 100) * 20),  max: 20, pct: sipAfford,  desc: `SIP is ${Math.round(sipRatio * 100)}% of current monthly expense`, color: "#d97706" },
    { label: "Time horizon",        score: Math.round((timeHorizon / 100) * 20),max: 20, pct: timeHorizon,desc: `${result.yearsToRetirement} years to grow your wealth`, color: "#7c3aed" },
  ];

  const totalScore = components.reduce((s, c) => s + c.score, 0);
  const scoreLabel = totalScore >= 80 ? "Excellent" : totalScore >= 60 ? "Good" : totalScore >= 40 ? "Fair" : "Needs Work";
  const scoreColor = totalScore >= 80 ? "#059669" : totalScore >= 60 ? "#224c87" : totalScore >= 40 ? "#d97706" : "#dc2626";

  // SVG gauge
  const R = 54, CX = 70, CY = 70;
  const startAngle = -180, endAngle = 0;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const arcPath = (pct: number) => {
    const angle = startAngle + (endAngle - startAngle) * (pct / 100);
    const x1 = CX + R * Math.cos(toRad(startAngle));
    const y1 = CY + R * Math.sin(toRad(startAngle));
    const x2 = CX + R * Math.cos(toRad(angle));
    const y2 = CY + R * Math.sin(toRad(angle));
    const large = angle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`;
  };

  return (
    <div style={{ background: bg, borderRadius: 14, padding: "24px 28px", border: `1px solid ${border}`, marginBottom: 28, boxShadow: darkMode ? "0 2px 16px rgba(0,0,0,0.35)" : "0 2px 12px rgba(0,0,0,0.05)" }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: accent, marginBottom: 20, fontFamily: "Montserrat,Arial,sans-serif" }}>
        Retirement Readiness Score
      </h2>

      <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Gauge */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
          <svg width={140} height={80} aria-label={`Readiness score: ${totalScore} out of 100 — ${scoreLabel}`}>
            {/* Track */}
            <path d={arcPath(100)} fill="none" stroke={trackBg} strokeWidth={10} strokeLinecap="round"/>
            {/* Fill */}
            <path d={arcPath(totalScore)} fill="none" stroke={scoreColor} strokeWidth={10} strokeLinecap="round"/>
            {/* Score text */}
            <text x={CX} y={CY - 4} textAnchor="middle" fontSize={22} fontWeight={800} fill={scoreColor} fontFamily="Montserrat,Arial,sans-serif">{totalScore}</text>
          </svg>
          <div style={{ marginTop: -8, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: scoreColor, fontFamily: "Montserrat,Arial,sans-serif" }}>{scoreLabel}</div>
            <div style={{ fontSize: 10, color: textMuted, fontFamily: "Montserrat,Arial,sans-serif", marginTop: 2 }}>0 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 100</div>
          </div>
        </div>

        {/* Component bars */}
        <div style={{ flex: 1, minWidth: 240, display: "flex", flexDirection: "column", gap: 14 }}>
          {components.map(c => (
            <div key={c.label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: text, fontFamily: "Montserrat,Arial,sans-serif" }}>{c.label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: c.color, fontFamily: "Montserrat,Arial,sans-serif" }}>{c.score}/{c.max}</span>
              </div>
              <div style={{ height: 7, background: trackBg, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${(c.score / c.max) * 100}%`, height: "100%", background: c.color, borderRadius: 4, transition: "width 1s ease-out" }}/>
              </div>
              <p style={{ fontSize: 11, color: textMuted, marginTop: 4, fontFamily: "Montserrat,Arial,sans-serif" }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <p style={{ fontSize: 11, color: textMuted, marginTop: 16, fontFamily: "Montserrat,Arial,sans-serif" }}>
        Score is illustrative and based on assumed rates. Not a guarantee of retirement outcomes.
      </p>
    </div>
  );
}
