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

function fmtINR(v: number): string {
    if (v >= 1e7) return "₹" + (v / 1e7).toFixed(2) + " Cr";
    if (v >= 1e5) return "₹" + (v / 1e5).toFixed(1) + " L";
    return "₹" + Math.round(v).toLocaleString("en-IN");
}

const BLUE  = "#4f7ec4";
const RED   = "#f87171";
const GREEN = "#34d399";

// ── TimelineChart ──────────────────────────────────────────────
function TimelineChart({ timeline, darkMode }: { timeline: any[]; darkMode: boolean }) {
    if (!timeline?.length) return null;

    const bg      = darkMode ? "#1a1d2a" : "#f7f9fc";
    const border  = darkMode ? "#252836" : "#e5e5e5";
    const txtMain = darkMode ? "#f1f5f9" : "#374151";
    const txtSub  = darkMode ? "#64748b"  : "#888888";
    const grey    = darkMode ? "#475569"  : "#919090";
    const gridCol = darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
    const legendColor = darkMode ? "#94a3b8" : "#444";

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
                backgroundColor: darkMode ? "rgba(79,126,196,0.15)" : "rgba(34,76,135,0.10)",
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
                backgroundColor: darkMode ? "rgba(248,113,113,0.10)" : "rgba(218,56,50,0.07)",
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
                labels:   { font: { size: 12, family: "Montserrat,Arial,sans-serif" }, padding: 16, boxWidth: 14, color: legendColor }
            },
            tooltip: {
                backgroundColor: darkMode ? "#1e2235" : "#fff",
                borderColor:     border,
                borderWidth:     1,
                titleColor:      txtMain,
                bodyColor:       txtSub,
                padding:         10,
                callbacks: { label: (ctx: any) => ` ${ctx.dataset.label}: ${fmtINR(ctx.raw)}` }
            }
        },
        scales: {
            x: {
                ticks: { maxTicksLimit: 10, font: { size: 11 }, color: grey },
                grid:  { display: false }
            },
            y: {
                ticks: { font: { size: 11 }, color: grey, callback: (v: any) => fmtINR(Number(v)) },
                grid:  { color: gridCol }
            }
        }
    };

    return (
        <div>
            <div role="img"
                aria-label={`Retirement timeline. Peak corpus ${fmtINR(maxC)} at age ${maxAge}. ${depleted ? "Corpus depletes before life expectancy." : "Corpus lasts through life expectancy."}`}
                style={{ width: "100%", height: 340 }}
            >
                <Line data={data} options={options as any} />
            </div>

            {/* Summary box — theme-aware */}
            <div style={{
                marginTop: 12, padding: "12px 16px",
                background: bg, borderRadius: 8,
                fontSize: 13, color: txtMain,
                border: `1px solid ${border}`,
                lineHeight: 1.6,
            }}>
                Peak corpus estimated at <strong>{fmtINR(maxC)}</strong> at age <strong>{maxAge}</strong>.{" "}
                {depleted
                    ? <span style={{ color: RED }}>⚠ Corpus may deplete before life expectancy — consider increasing SIP.</span>
                    : <span style={{ color: GREEN }}>Corpus estimated to last through life expectancy.</span>
                }
                <br />
                <span style={{ color: txtSub, marginTop: 4, display: "block", fontSize: 12 }}>
                    Illustrative projection based on assumed rates only.
                </span>
            </div>

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

// ── MonteCarloFanChart ─────────────────────────────────────────
function MonteCarloFanChart({ fan, yearsToRetirement, darkMode }: { fan: any[]; yearsToRetirement: number; darkMode: boolean }) {
    if (!fan?.length) return null;

    const bg      = darkMode ? "#1a1d2a" : "#f7f9fc";
    const border  = darkMode ? "#252836" : "#e5e5e5";
    const txtMain = darkMode ? "#f1f5f9" : "#374151";
    const txtSub  = darkMode ? "#64748b"  : "#888888";
    const grey    = darkMode ? "#475569"  : "#919090";
    const gridCol = darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
    const legendColor = darkMode ? "#94a3b8" : "#444";

    const labels = fan.map(d => `Yr ${d.year}`);
    const p5     = fan.map(d => d.p5);
    const p25    = fan.map(d => d.p25);
    const p50    = fan.map(d => d.p50);
    const p75    = fan.map(d => d.p75);
    const p95    = fan.map(d => d.p95);

    const safeRetIdx    = Math.max(0, Math.min(yearsToRetirement - 1, fan.length - 1));
    const retirementBand = fan[safeRetIdx] ?? fan[fan.length - 1];

    const data = {
        labels,
        datasets: [
            { label:"95th percentile",      data:p95, borderColor:"transparent", backgroundColor:darkMode?"rgba(79,126,196,0.08)":"rgba(34,76,135,0.06)", fill:"+3",   tension:0.4, pointRadius:0, borderWidth:0 },
            { label:"75th percentile",      data:p75, borderColor:"transparent", backgroundColor:darkMode?"rgba(79,126,196,0.13)":"rgba(34,76,135,0.10)", fill:"+1",   tension:0.4, pointRadius:0, borderWidth:0 },
            { label:"Median (50th percentile)", data:p50, borderColor:BLUE, backgroundColor:"transparent", fill:false, tension:0.4, pointRadius:0, borderWidth:2.5 },
            { label:"25th percentile",      data:p25, borderColor:"transparent", backgroundColor:darkMode?"rgba(79,126,196,0.13)":"rgba(34,76,135,0.10)", fill:false,  tension:0.4, pointRadius:0, borderWidth:0 },
            { label:"5th percentile",       data:p5,  borderColor:"transparent", backgroundColor:darkMode?"rgba(79,126,196,0.08)":"rgba(34,76,135,0.06)", fill:false,  tension:0.4, pointRadius:0, borderWidth:0 },
        ]
    };

    const retLinePlugin = {
        id: "retirementLine",
        afterDraw(chart: ChartJS) {
            const { ctx, scales } = chart as any;
            const xScale = scales["x"], yScale = scales["y"];
            if (!xScale || !yScale) return;
            const px = xScale.getPixelForValue(safeRetIdx);
            if (isNaN(px)) return;
            ctx.save();
            ctx.setLineDash([5, 4]);
            ctx.strokeStyle = grey;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(px, yScale.top);
            ctx.lineTo(px, yScale.bottom);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = grey;
            ctx.font = "11px Montserrat,Arial,sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("Retirement", px, yScale.top - 6);
            ctx.restore();
        }
    };

    const options = {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: "index" as const, intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: darkMode ? "#1e2235" : "#fff",
                borderColor: border, borderWidth: 1,
                titleColor: txtMain, bodyColor: txtSub, padding: 10,
                filter: (item: any) => item.dataset.label === "Median (50th percentile)",
                callbacks: {
                    title:  (items: any[]) => items[0].label,
                    label:  (ctx: any) => {
                        const yi = ctx.dataIndex, point = fan[yi];
                        return [`Optimistic (95th): ${fmtINR(point.p95)}`, `Median (50th): ${fmtINR(point.p50)}`, `Pessimistic (5th): ${fmtINR(point.p5)}`];
                    },
                    afterLabel: () => ""
                },
                itemSort: () => 0
            }
        },
        scales: {
            x: { ticks: { maxTicksLimit: 10, autoSkip: true, color: grey, font: { size: 11 } }, grid: { display: false } },
            y: { ticks: { color: grey, font: { size: 11 }, callback: (v: any) => fmtINR(Number(v)) }, grid: { color: gridCol } }
        }
    };

    const survived = fan[fan.length - 1];

    return (
        <div>
            {/* Legend */}
            <div role="list" aria-label="Chart legend" style={{ display:"flex", flexWrap:"wrap" as const, gap:14, marginBottom:12, fontSize:12, color:grey, fontFamily:"Montserrat,Arial,sans-serif" }}>
                {[
                    { color:GREEN, label:"Optimistic (95th %ile)", dash:true },
                    { color:BLUE,  label:"Median (50th %ile)",     dash:false },
                    { color:RED,   label:"Pessimistic (5th %ile)", dash:true }
                ].map(l=>(
                    <span key={l.label} role="listitem" style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span aria-hidden="true" style={{ width:22, height:0, borderTop:`${l.dash?"2px dashed":"3px solid"} ${l.color}`, display:"inline-block" }}/>
                        {l.label}
                    </span>
                ))}
                <span role="listitem" style={{ display:"flex",alignItems:"center",gap:6 }}>
                    <span aria-hidden="true" style={{ width:22,height:10,background:darkMode?"rgba(79,126,196,0.25)":"rgba(34,76,135,0.18)",borderRadius:2,display:"inline-block" }}/>
                    Probability band
                </span>
                <span role="listitem" style={{ display:"flex",alignItems:"center",gap:6 }}>
                    <span aria-hidden="true" style={{ width:1,height:14,borderLeft:`1.5px dashed ${grey}`,display:"inline-block" }}/>
                    Retirement age
                </span>
            </div>

            {/* Summary cards */}
            {retirementBand && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:16 }}>
                    {[
                        { label:"Optimistic corpus at retirement", val:retirementBand.p95, color:GREEN },
                        { label:"Median corpus at retirement",     val:retirementBand.p50, color:BLUE  },
                        { label:"Pessimistic corpus",              val:retirementBand.p5,  color:RED   }
                    ].map(c=>(
                        <div key={c.label} style={{ padding:"10px 14px", background:bg, borderRadius:8, border:`1.5px solid ${c.color}22` }}>
                            <p style={{ fontSize:11, color:grey, marginBottom:4, fontFamily:"Montserrat,Arial,sans-serif" }}>{c.label}</p>
                            <p style={{ fontSize:16, fontWeight:700, color:c.color, fontFamily:"Montserrat,Arial,sans-serif" }}>{fmtINR(c.val)}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Chart */}
            <div role="img"
                aria-label={`Monte Carlo fan chart. Median corpus at year ${yearsToRetirement}: ${fmtINR(retirementBand?.p50??0)}. Range: ${fmtINR(retirementBand?.p5??0)} to ${fmtINR(retirementBand?.p95??0)}.`}
                style={{ width:"100%", height:340 }}>
                <Line data={data} options={options as any} plugins={[retLinePlugin as any]}/>
            </div>

            {/* Survival note — theme-aware */}
            <div style={{ marginTop:12, padding:"12px 16px", background:bg, borderRadius:8, fontSize:13, color:txtMain, border:`1px solid ${border}`, lineHeight:1.6 }}>
                Pessimistic end balance:{" "}
                <strong style={{ color:survived.p5>0?GREEN:RED }}>{survived.p5>0?fmtINR(survived.p5):"Depleted"}</strong>
                {" "}&nbsp;|&nbsp;{" "}
                Median end balance: <strong style={{ color:BLUE }}>{fmtINR(survived.p50)}</strong>
                <br/>
                <span style={{ color:txtSub, marginTop:4, display:"block", fontSize:12 }}>
                    1,000 simulations using Gaussian return sampling. Illustrative only — not a guarantee of returns.
                </span>
            </div>

            {/* Accessible data table */}
            <details style={{ marginTop:12 }}>
                <summary style={{ fontSize:12, color:grey, cursor:"pointer", fontFamily:"Montserrat,Arial,sans-serif" }}>View data table (accessible version)</summary>
                <div style={{ overflowX:"auto" as const, marginTop:8 }}>
                    <table aria-label="Monte Carlo simulation data" style={{ width:"100%", fontSize:12, borderCollapse:"collapse" as const }}>
                        <thead>
                            <tr style={{ borderBottom:`1px solid ${border}` }}>
                                <th scope="col" style={{ padding:"6px 8px", textAlign:"left" as const, color:txtMain }}>Year</th>
                                <th scope="col" style={{ padding:"6px 8px", textAlign:"right" as const, color:GREEN }}>Optimistic (95th)</th>
                                <th scope="col" style={{ padding:"6px 8px", textAlign:"right" as const, color:BLUE  }}>Median (50th)</th>
                                <th scope="col" style={{ padding:"6px 8px", textAlign:"right" as const, color:RED   }}>Pessimistic (5th)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fan.filter((_,i)=>i%Math.max(1,Math.floor(fan.length/12))===0).map(row=>(
                                <tr key={row.year} style={{ borderBottom:`1px solid ${border}` }}>
                                    <td style={{ padding:"5px 8px", color:txtMain }}>Year {row.year}</td>
                                    <td style={{ padding:"5px 8px", textAlign:"right" as const, color:GREEN }}>{fmtINR(row.p95)}</td>
                                    <td style={{ padding:"5px 8px", textAlign:"right" as const, color:BLUE  }}>{fmtINR(row.p50)}</td>
                                    <td style={{ padding:"5px 8px", textAlign:"right" as const, color:RED   }}>{fmtINR(row.p5)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>
        </div>
    );
}

// ── Wrapper with tabs ──────────────────────────────────────────
export default function RetirementChart({
    timeline,
    monteCarloFan,
    yearsToRetirement,
    darkMode = false,
}: {
    timeline:           any[];
    monteCarloFan?:     any[];
    yearsToRetirement?: number;
    darkMode?:          boolean;
}) {
    const [tab, setTab] = useState<"timeline"|"montecarlo">("timeline");
    const hasFan = monteCarloFan && monteCarloFan.length > 0;
    const tabActive  = darkMode ? "#4f7ec4" : "#224c87";
    const tabInactive = darkMode ? "#64748b" : "#666";
    const tabBorder   = darkMode ? "#252836" : "#e5e5e5";

    return (
        <div>
            <div role="tablist" aria-label="Chart views" style={{ display:"flex", gap:0, borderBottom:`2px solid ${tabBorder}`, marginBottom:20 }}>
                {[
                    { key:"timeline",    label:"Wealth Timeline" },
                    ...(hasFan ? [{ key:"montecarlo", label:"Monte Carlo Simulation" }] : [])
                ].map(t => (
                    <button key={t.key} role="tab"
                        aria-selected={tab===t.key}
                        aria-controls={`panel-${t.key}`}
                        id={`tab-${t.key}`}
                        onClick={()=>setTab(t.key as any)}
                        style={{
                            padding:"10px 20px", fontSize:13,
                            fontWeight: tab===t.key ? 700 : 400,
                            color:      tab===t.key ? tabActive : tabInactive,
                            background:"none", border:"none",
                            borderBottom: tab===t.key ? `3px solid ${tabActive}` : "3px solid transparent",
                            cursor:"pointer", borderRadius:0,
                            fontFamily:"Montserrat,Arial,sans-serif",
                            marginBottom:-2,
                            transition:"color 0.2s, border-color 0.2s"
                        }}>
                        {t.label}
                    </button>
                ))}
            </div>

            <div role="tabpanel" id="panel-timeline" aria-labelledby="tab-timeline" hidden={tab!=="timeline"}>
                <TimelineChart timeline={timeline} darkMode={darkMode}/>
            </div>

            {hasFan && (
                <div role="tabpanel" id="panel-montecarlo" aria-labelledby="tab-montecarlo" hidden={tab!=="montecarlo"}>
                    <MonteCarloFanChart fan={monteCarloFan!} yearsToRetirement={yearsToRetirement??0} darkMode={darkMode}/>
                </div>
            )}
        </div>
    );
}
