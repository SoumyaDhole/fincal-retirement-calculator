"use client";

import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
    Filler
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useState } from "react";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler);

// ─── Helpers ──────────────────────────────────────────────────────
function fmtINR(v: number): string {
    if (v >= 1e7) return "₹" + (v / 1e7).toFixed(2) + " Cr";
    if (v >= 1e5) return "₹" + (v / 1e5).toFixed(1) + " L";
    return "₹" + Math.round(v).toLocaleString("en-IN");
}

const BLUE   = "#224c87";
const RED    = "#da3832";
const GREEN  = "#1a7a4a";
const GREY   = "#919090";

// ─── Timeline Chart ───────────────────────────────────────────────
function TimelineChart({ timeline }: { timeline: any[] }) {
    if (!timeline?.length) return null;

    const retIdx  = timeline.findIndex((t, i) => i > 0 && t.corpus < timeline[i - 1].corpus);
    const labels  = timeline.map((t: any) => `Age ${t.age}`);
    const corpus  = timeline.map((t: any) => Math.round(t.corpus));
    const maxC    = Math.max(...corpus);
    const maxAge  = timeline[corpus.indexOf(maxC)]?.age;
    const depleted = corpus[corpus.length - 1] <= 0;

    const accData = corpus.map((v, i) => (i <= retIdx ? v : null));
    const depData = corpus.map((v, i) => (i >= retIdx ? v : null));

    const data = {
        labels,
        datasets: [
            {
                label:           "Accumulation phase",
                data:            accData,
                borderColor:     BLUE,
                backgroundColor: "rgba(34,76,135,0.10)",
                borderWidth:     2.5,
                pointRadius:     0,
                fill:            true,
                tension:         0.35,
                spanGaps:        false
            },
            {
                label:           "Retirement drawdown",
                data:            depData,
                borderColor:     RED,
                backgroundColor: "rgba(218,56,50,0.07)",
                borderWidth:     2.5,
                pointRadius:     0,
                fill:            true,
                tension:         0.35,
                spanGaps:        false
            }
        ]
    };

    const options = {
        responsive:          true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display:  true,
                position: "top" as const,
                labels:   { font: { size: 12, family: "Montserrat,Arial,sans-serif" }, padding: 16, boxWidth: 14 }
            },
            tooltip: {
                backgroundColor: "#fff",
                borderColor:     "#e2e8f0",
                borderWidth:     1,
                titleColor:      "#1e293b",
                bodyColor:       "#475569",
                padding:         10,
                callbacks: {
                    label: (ctx: any) => ` ${ctx.dataset.label}: ${fmtINR(ctx.raw)}`
                }
            }
        },
        scales: {
            x: {
                ticks: { maxTicksLimit: 10, font: { size: 11 }, color: GREY },
                grid:  { display: false }
            },
            y: {
                ticks: {
                    font: { size: 11 }, color: GREY,
                    callback: (v: any) => fmtINR(Number(v))
                },
                grid: { color: "rgba(0,0,0,0.05)" }
            }
        }
    };

    return (
        <div>
            <div
                role="img"
                aria-label={`Retirement timeline chart. Peak corpus ${fmtINR(maxC)} at age ${maxAge}. ${depleted ? "Corpus depletes before life expectancy." : "Corpus lasts through life expectancy."}`}
                style={{ width: "100%", height: 340 }}
            >
                <Line data={data} options={options as any} />
            </div>
            <div style={{
                marginTop: 10, padding: "10px 16px",
                background: "#f7f9fc", borderRadius: 6,
                fontSize: 12, color: "#555",
                border: "1px solid #e5e5e5"
            }}>
                Peak corpus estimated at <strong>{fmtINR(maxC)}</strong> at age <strong>{maxAge}</strong>.{" "}
                {depleted
                    ? <span style={{ color: RED }}>⚠ Corpus may deplete before life expectancy — consider increasing SIP.</span>
                    : <span style={{ color: GREEN }}>Corpus estimated to last through life expectancy.</span>
                }
                <br />
                <span style={{ color: "#888", marginTop: 4, display: "block" }}>
                    Illustrative projection based on assumed rates only.
                </span>
            </div>
            {/* SR-only data table */}
            <table className="sr-only" aria-label="Retirement corpus by age">
                <thead><tr><th>Age</th><th>Corpus (₹)</th><th>Phase</th></tr></thead>
                <tbody>
                    {timeline.map((t: any) => (
                        <tr key={t.age}>
                            <td>{t.age}</td>
                            <td>{Math.round(t.corpus).toLocaleString("en-IN")}</td>
                            <td>{t.phase}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─── Monte Carlo Fan Chart ────────────────────────────────────────
function MonteCarloFanChart({
    fan,
    yearsToRetirement
}: {
    fan: any[];
    yearsToRetirement: number;
}) {
    if (!fan?.length) return null;

    const labels  = fan.map(d => `Yr ${d.year}`);
    const p5      = fan.map(d => d.p5);
    const p25     = fan.map(d => d.p25);
    const p50     = fan.map(d => d.p50);
    const p75     = fan.map(d => d.p75);
    const p95     = fan.map(d => d.p95);

    // Retirement survival at end
    const retIdx         = yearsToRetirement - 1;
    const retirementBand = fan[retIdx];

    const data = {
        labels,
        datasets: [
            // Outer band top (p95)
            {
                label:           "95th percentile",
                data:            p95,
                borderColor:     "transparent",
                backgroundColor: "rgba(34,76,135,0.06)",
                fill:            "+3",   // fill down to p5
                tension:         0.4,
                pointRadius:     0,
                borderWidth:     0
            },
            // Inner band top (p75)
            {
                label:           "75th percentile",
                data:            p75,
                borderColor:     "transparent",
                backgroundColor: "rgba(34,76,135,0.10)",
                fill:            "+1",   // fill down to p25
                tension:         0.4,
                pointRadius:     0,
                borderWidth:     0
            },
            // Median
            {
                label:       "Median (50th percentile)",
                data:        p50,
                borderColor: BLUE,
                backgroundColor: "transparent",
                fill:        false,
                tension:     0.4,
                pointRadius: 0,
                borderWidth: 2.5
            },
            // Inner band bottom (p25)
            {
                label:           "25th percentile",
                data:            p25,
                borderColor:     "transparent",
                backgroundColor: "rgba(34,76,135,0.10)",
                fill:            false,
                tension:         0.4,
                pointRadius:     0,
                borderWidth:     0
            },
            // Outer band bottom (p5)
            {
                label:           "5th percentile",
                data:            p5,
                borderColor:     "transparent",
                backgroundColor: "rgba(34,76,135,0.06)",
                fill:            false,
                tension:         0.4,
                pointRadius:     0,
                borderWidth:     0
            }
        ]
    };

    // Retirement vertical line plugin
    const retLinePlugin = {
        id: "retirementLine",
        afterDraw(chart: ChartJS) {
            const { ctx, scales: { x, y } } = chart;
            if (retIdx < 0 || retIdx >= fan.length) return;
            const px = x.getPixelForValue(retIdx);
            ctx.save();
            ctx.setLineDash([5, 4]);
            ctx.strokeStyle = GREY;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(px, y.top);
            ctx.lineTo(px, y.bottom);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = GREY;
            ctx.font = "11px Montserrat,Arial,sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("Retirement", px, y.top - 6);
            ctx.restore();
        }
    };

    const options = {
        responsive:          true,
        maintainAspectRatio: false,
        interaction: { mode: "index" as const, intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "#fff",
                borderColor:     "#e2e8f0",
                borderWidth:     1,
                titleColor:      "#1e293b",
                bodyColor:       "#475569",
                padding:         10,
                filter:          (item: any) => item.dataset.label === "Median (50th percentile)",
                callbacks: {
                    title:  (items: any[]) => items[0].label,
                    label:  (ctx: any) => {
                        const y     = ctx.dataIndex;
                        const point = fan[y];
                        return [
                            ` Optimistic (95th): ${fmtINR(point.p95)}`,
                            ` Median (50th):     ${fmtINR(point.p50)}`,
                            ` Pessimistic (5th): ${fmtINR(point.p5)}`
                        ];
                    },
                    afterLabel: () => ""
                },
                itemSort: () => 0
            }
        },
        scales: {
            x: {
                ticks: {
                    maxTicksLimit: 10, autoSkip: true,
                    color: GREY, font: { size: 11 }
                },
                grid: { display: false }
            },
            y: {
                ticks: {
                    color: GREY, font: { size: 11 },
                    callback: (v: any) => fmtINR(Number(v))
                },
                grid: { color: "rgba(0,0,0,0.05)" }
            }
        }
    };

    // Survival stat
    const survived = fan[fan.length - 1];

    return (
        <div>
            {/* Custom legend */}
            <div
                role="list"
                aria-label="Chart legend"
                style={{
                    display: "flex", flexWrap: "wrap", gap: 14,
                    marginBottom: 12, fontSize: 12, color: GREY,
                    fontFamily: "Montserrat,Arial,sans-serif"
                }}
            >
                {[
                    { color: GREEN,  label: "Optimistic (95th %ile)", dash: true },
                    { color: BLUE,   label: "Median (50th %ile)",     dash: false },
                    { color: RED,    label: "Pessimistic (5th %ile)",  dash: true }
                ].map(l => (
                    <span key={l.label} role="listitem" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span aria-hidden="true" style={{
                            width: 22, height: 0,
                            borderTop: `${l.dash ? "2px dashed" : "3px solid"} ${l.color}`,
                            display: "inline-block"
                        }} />
                        {l.label}
                    </span>
                ))}
                <span role="listitem" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span aria-hidden="true" style={{
                        width: 22, height: 10,
                        background: "rgba(34,76,135,0.18)",
                        borderRadius: 2, display: "inline-block"
                    }} />
                    Probability band
                </span>
                <span role="listitem" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span aria-hidden="true" style={{
                        width: 1, height: 14,
                        borderLeft: `1.5px dashed ${GREY}`, display: "inline-block"
                    }} />
                    Retirement age
                </span>
            </div>

            {/* Retirement band summary cards */}
            {retirementBand && (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3,1fr)",
                    gap: 10, marginBottom: 16
                }}>
                    {[
                        { label: "Optimistic corpus at retirement", val: retirementBand.p95, color: GREEN },
                        { label: "Median corpus at retirement",     val: retirementBand.p50, color: BLUE  },
                        { label: "Pessimistic corpus",              val: retirementBand.p5,  color: RED   }
                    ].map(c => (
                        <div key={c.label} style={{
                            padding: "10px 14px",
                            background: "#f7f9fc",
                            borderRadius: 8,
                            border: `1.5px solid ${c.color}22`
                        }}>
                            <p style={{ fontSize: 11, color: GREY, marginBottom: 4 }}>{c.label}</p>
                            <p style={{ fontSize: 16, fontWeight: 700, color: c.color }}>{fmtINR(c.val)}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Chart */}
            <div
                role="img"
                aria-label={`Monte Carlo fan chart showing 1000 simulations. Median corpus at year ${yearsToRetirement} is ${fmtINR(retirementBand?.p50 ?? 0)}. Band spans from ${fmtINR(retirementBand?.p5 ?? 0)} (pessimistic) to ${fmtINR(retirementBand?.p95 ?? 0)} (optimistic).`}
                style={{ width: "100%", height: 340 }}
            >
                <Line
                    data={data}
                    options={options as any}
                    plugins={[retLinePlugin as any]}
                />
            </div>

            {/* Survival note */}
            <div style={{
                marginTop: 10, padding: "10px 16px",
                background: "#f7f9fc", borderRadius: 6,
                fontSize: 12, color: "#555",
                border: "1px solid #e5e5e5"
            }}>
                Pessimistic end balance: <strong style={{ color: survived.p5 > 0 ? GREEN : RED }}>
                    {survived.p5 > 0 ? fmtINR(survived.p5) : "Depleted"}
                </strong> &nbsp;|&nbsp;
                Median end balance: <strong style={{ color: BLUE }}>{fmtINR(survived.p50)}</strong>
                <br />
                <span style={{ color: "#888", marginTop: 4, display: "block" }}>
                    1,000 simulations using Gaussian return sampling. Illustrative only — not a guarantee of returns.
                </span>
            </div>

            {/* SR data table */}
            <details style={{ marginTop: 12 }}>
                <summary style={{ fontSize: 12, color: GREY, cursor: "pointer", fontFamily: "Montserrat,Arial,sans-serif" }}>
                    View data table (accessible version)
                </summary>
                <div style={{ overflowX: "auto", marginTop: 8 }}>
                    <table aria-label="Monte Carlo simulation data" style={{
                        width: "100%", fontSize: 12,
                        borderCollapse: "collapse",
                        fontFamily: "Montserrat,Arial,sans-serif"
                    }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                                <th scope="col" style={{ padding: "6px 8px", textAlign: "left" }}>Year</th>
                                <th scope="col" style={{ padding: "6px 8px", textAlign: "right" }}>Optimistic (95th)</th>
                                <th scope="col" style={{ padding: "6px 8px", textAlign: "right" }}>Median (50th)</th>
                                <th scope="col" style={{ padding: "6px 8px", textAlign: "right" }}>Pessimistic (5th)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fan.filter((_, i) => i % Math.max(1, Math.floor(fan.length / 12)) === 0).map(row => (
                                <tr key={row.year} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                    <td style={{ padding: "5px 8px" }}>Year {row.year}</td>
                                    <td style={{ padding: "5px 8px", textAlign: "right", color: GREEN }}>{fmtINR(row.p95)}</td>
                                    <td style={{ padding: "5px 8px", textAlign: "right", color: BLUE  }}>{fmtINR(row.p50)}</td>
                                    <td style={{ padding: "5px 8px", textAlign: "right", color: RED   }}>{fmtINR(row.p5)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>
        </div>
    );
}

// ─── Exported wrapper with tabs ───────────────────────────────────
export default function RetirementChart({
    timeline,
    monteCarloFan,
    yearsToRetirement
}: {
    timeline:         any[];
    monteCarloFan?:   any[];
    yearsToRetirement?: number;
}) {
    const [tab, setTab] = useState<"timeline" | "montecarlo">("timeline");
    const hasFan = monteCarloFan && monteCarloFan.length > 0;

    return (
        <div>
            {/* Tab bar */}
            <div
                role="tablist"
                aria-label="Chart views"
                style={{
                    display: "flex", gap: 0,
                    borderBottom: "2px solid #e5e5e5",
                    marginBottom: 20
                }}
            >
                {[
                    { key: "timeline",    label: "Wealth Timeline" },
                    ...(hasFan ? [{ key: "montecarlo", label: "Monte Carlo Simulation" }] : [])
                ].map(t => (
                    <button
                        key={t.key}
                        role="tab"
                        aria-selected={tab === t.key}
                        aria-controls={`panel-${t.key}`}
                        id={`tab-${t.key}`}
                        onClick={() => setTab(t.key as any)}
                        style={{
                            padding:         "10px 20px",
                            fontSize:        13,
                            fontWeight:      tab === t.key ? 700 : 400,
                            color:           tab === t.key ? "#224c87" : "#666",
                            background:      "none",
                            border:          "none",
                            borderBottom:    tab === t.key ? "3px solid #224c87" : "3px solid transparent",
                            cursor:          "pointer",
                            borderRadius:    0,
                            fontFamily:      "Montserrat,Arial,sans-serif",
                            marginBottom:    -2,
                            transition:      "color 0.2s, border-color 0.2s"
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Panels */}
            <div
                role="tabpanel"
                id="panel-timeline"
                aria-labelledby="tab-timeline"
                hidden={tab !== "timeline"}
            >
                <TimelineChart timeline={timeline} />
            </div>

            {hasFan && (
                <div
                    role="tabpanel"
                    id="panel-montecarlo"
                    aria-labelledby="tab-montecarlo"
                    hidden={tab !== "montecarlo"}
                >
                    <MonteCarloFanChart fan={monteCarloFan!} yearsToRetirement={yearsToRetirement ?? 0} />
                </div>
            )}
        </div>
    );
}
