"use client";

import { useState } from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS, LineElement, CategoryScale,
    LinearScale, PointElement, Tooltip, Legend, Filler
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler);

interface ComparisonViewProps {
  darkMode?: boolean;
}

interface ScenarioForm {
    label: string; currentAge: string; retirementAge: string;
    lifeExpectancy: string; monthlyExpense: string; inflationRate: string;
    preReturn: string; postReturn: string; stepUpRate: string; existingCorpus: string;
}
interface ScenarioResult {
    futureMonthlyExpense: number; requiredCorpus: number; monthlySIP: number;
    monthlyStepUpSIP: number | null; yearsCorpusLasts: number; successProbability: number;
    timeline: any[]; expenseBuckets: { general: number; medical: number; lifestyle: number };
    monthlyRetirementIncome: number; existingCorpusAtRetirement: number;
}

function fmtINR(n: number) {
    if (n >= 1e7) return "₹" + (n / 1e7).toFixed(2) + " Cr";
    if (n >= 1e5) return "₹" + (n / 1e5).toFixed(1) + " L";
    return "₹ " + Math.round(n).toLocaleString("en-IN");
}
function getRisk(p: number) {
    if (p >= 80) return { label: "SAFE",     color: "#34d399", bg: "rgba(52,211,153,0.12)" };
    if (p >= 50) return { label: "MODERATE", color: "#fbbf24", bg: "rgba(251,191,36,0.12)" };
    return             { label: "RISKY",     color: "#f87171", bg: "rgba(248,113,113,0.12)" };
}

const DEFAULT_A: ScenarioForm = { label:"Scenario A",currentAge:"30",retirementAge:"60",lifeExpectancy:"85",monthlyExpense:"50000",inflationRate:"6",preReturn:"10",postReturn:"7",stepUpRate:"0",existingCorpus:"0" };
const DEFAULT_B: ScenarioForm = { label:"Scenario B",currentAge:"30",retirementAge:"60",lifeExpectancy:"85",monthlyExpense:"50000",inflationRate:"6",preReturn:"12",postReturn:"8",stepUpRate:"10",existingCorpus:"0" };

function MiniField({ label, name, value, onChange, accentColor, darkMode }: {
    label:string; name:string; value:string;
    onChange:(e:React.ChangeEvent<HTMLInputElement>)=>void;
    accentColor:string; darkMode:boolean;
}) {
    const bg     = darkMode ? "#0b0d14" : "#fff";
    const border = darkMode ? "#252836" : "#e5e7eb";
    const text   = darkMode ? "#f1f5f9" : "#111827";
    return (
        <div style={{ marginBottom:10 }}>
            <label htmlFor={`${accentColor}-${name}`} style={{ display:"block",fontSize:11,color:darkMode?"#94a3b8":"#555",marginBottom:3,fontWeight:600,fontFamily:"Montserrat,Arial,sans-serif" }}>{label}</label>
            <input id={`${accentColor}-${name}`} type="number" name={name} value={value} onChange={onChange} suppressHydrationWarning
                style={{ width:"100%",padding:"7px 10px",border:`1.5px solid ${border}`,borderRadius:6,fontSize:13,fontFamily:"Montserrat,Arial,sans-serif",color:text,background:bg,outline:"none",boxSizing:"border-box" as const }}
                onFocus={e=>e.target.style.borderColor=accentColor}
                onBlur={e=>e.target.style.borderColor=border}
            />
        </div>
    );
}

function MetricRow({ label, a, b, higherIsBetter=true, dark }: { label:string; a:string; b:string; higherIsBetter?:boolean; dark:boolean }) {
    const aNum = parseFloat(a.replace(/[^0-9.]/g,""));
    const bNum = parseFloat(b.replace(/[^0-9.]/g,""));
    const aWins = higherIsBetter ? aNum >= bNum : aNum <= bNum;
    const bWins = higherIsBetter ? bNum >= aNum : bNum <= aNum;
    const tie   = aNum === bNum;
    const GREEN = "#34d399", RED = "#f87171";
    const textColor = dark ? "#94a3b8" : "#555";
    const borderColor = dark ? "#252836" : "#f0f0f0";
    return (
        <tr>
            <td style={{ padding:"10px 12px",fontSize:12,color:textColor,fontWeight:500,borderBottom:`1px solid ${borderColor}`,whiteSpace:"nowrap" as const }}>{label}</td>
            <td style={{ padding:"10px 12px",fontSize:13,fontWeight:700,color:tie?"#94a3b8":aWins?GREEN:RED,textAlign:"center",borderBottom:`1px solid ${borderColor}` }}>{a} {!tie&&aWins&&<span>↑</span>}</td>
            <td style={{ padding:"10px 12px",fontSize:13,fontWeight:700,color:tie?"#94a3b8":bWins?GREEN:RED,textAlign:"center",borderBottom:`1px solid ${borderColor}` }}>{b} {!tie&&bWins&&<span>↑</span>}</td>
        </tr>
    );
}

export default function ComparisonView({ darkMode = false }: ComparisonViewProps) {
    const [formA, setFormA] = useState<ScenarioForm>(DEFAULT_A);
    const [formB, setFormB] = useState<ScenarioForm>(DEFAULT_B);
    const [resultA, setResultA] = useState<ScenarioResult | null>(null);
    const [resultB, setResultB] = useState<ScenarioResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState("");

    const bg       = darkMode ? "#0b0d14" : "#f4f6fb";
    const surface  = darkMode ? "#1a1d2a" : "#ffffff";
    const border   = darkMode ? "#252836" : "#e5e7eb";
    const text     = darkMode ? "#f1f5f9" : "#111827";
    const textSub  = darkMode ? "#94a3b8" : "#4b5563";
    const textMuted= darkMode ? "#4b5563" : "#9ca3af";
    const accent   = darkMode ? "#4f7ec4" : "#224c87";
    const BLUE_COL = darkMode ? "#4f7ec4" : "#224c87";
    const RED_COL  = "#da3832";
    const GREEN    = "#34d399";

    const handleA = (e: React.ChangeEvent<HTMLInputElement>) => setFormA(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleB = (e: React.ChangeEvent<HTMLInputElement>) => setFormB(p => ({ ...p, [e.target.name]: e.target.value }));

    const toPayload = (f: ScenarioForm) => ({
        currentAge: Number(f.currentAge), retirementAge: Number(f.retirementAge),
        lifeExpectancy: Number(f.lifeExpectancy), monthlyExpense: Number(f.monthlyExpense),
        inflationRate: Number(f.inflationRate) / 100, preReturn: Number(f.preReturn) / 100,
        postReturn: Number(f.postReturn) / 100, stepUpRate: Number(f.stepUpRate) / 100,
        existingCorpus: Number(f.existingCorpus)
    });

    const compare = async () => {
        setError(""); setLoading(true);
        try {
            const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
            const [resA, resB] = await Promise.all([
                fetch(`${BACKEND}/api/retirement/calculate`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(toPayload(formA)) }),
                fetch(`${BACKEND}/api/retirement/calculate`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(toPayload(formB)) })
            ]);
            const [dA, dB] = await Promise.all([resA.json(), resB.json()]);
            setResultA(dA.data); setResultB(dB.data);
        } catch { setError("Could not connect to backend. Make sure it is running."); }
        setLoading(false);
    };

    const FIELDS: { label:string; name:keyof ScenarioForm }[] = [
        { label:"Current age (yrs)",          name:"currentAge"     },
        { label:"Retirement age (yrs)",        name:"retirementAge"  },
        { label:"Life expectancy (yrs)",       name:"lifeExpectancy" },
        { label:"Monthly expense (₹)",         name:"monthlyExpense" },
        { label:"Existing corpus (₹)",         name:"existingCorpus" },
        { label:"Inflation rate (%)",          name:"inflationRate"  },
        { label:"Pre-retirement return (%)",   name:"preReturn"      },
        { label:"Post-retirement return (%)",  name:"postReturn"     },
        { label:"Annual SIP step-up (%)",      name:"stepUpRate"     },
    ];

    // Chart
    const chartData = resultA && resultB ? (() => {
        const allAges = Array.from(new Set([...resultA.timeline.map((t:any)=>t.age),...resultB.timeline.map((t:any)=>t.age)])).sort((a,b)=>a-b);
        const mapA = Object.fromEntries(resultA.timeline.map((t:any)=>[t.age,t.corpus]));
        const mapB = Object.fromEntries(resultB.timeline.map((t:any)=>[t.age,t.corpus]));
        return {
            labels: allAges.map(a=>`Age ${a}`),
            datasets: [
                { label:formA.label, data:allAges.map(a=>mapA[a]??null), borderColor:BLUE_COL, backgroundColor:`${BLUE_COL}15`, borderWidth:2.5, pointRadius:0, fill:true, tension:0.35, spanGaps:false },
                { label:formB.label, data:allAges.map(a=>mapB[a]??null), borderColor:RED_COL,  backgroundColor:`${RED_COL}10`,  borderWidth:2.5, pointRadius:0, fill:true, tension:0.35, spanGaps:false }
            ]
        };
    })() : null;

    const riskA = resultA ? getRisk(resultA.successProbability) : null;
    const riskB = resultB ? getRisk(resultB.successProbability) : null;

    return (
        <>
            <style>{`@media(max-width:640px){.vs-divider{display:none!important;}.comparison-grid{grid-template-columns:1fr!important;}}`}</style>

            <section aria-labelledby="compare-heading" style={{ marginTop:32 }}>
                <div style={{ borderBottom:`3px solid ${accent}`,paddingBottom:10,marginBottom:24 }}>
                    <h2 id="compare-heading" style={{ fontSize:20,fontWeight:700,color:accent,fontFamily:"Montserrat,Arial,sans-serif" }}>Scenario Comparison</h2>
                    <p style={{ fontSize:12,color:textSub,marginTop:4,fontFamily:"Montserrat,Arial,sans-serif" }}>Enter two different assumptions and compare side by side. Illustrative only.</p>
                </div>

                {/* Side-by-side inputs */}
                <div className="comparison-grid" style={{ display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:16,marginBottom:20,alignItems:"start" }}>
                    {/* Scenario A */}
                    <div style={{ padding:20,borderRadius:12,border:`2px solid ${BLUE_COL}`,background:surface }}>
                        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16 }}>
                            <div style={{ width:32,height:32,borderRadius:"50%",background:BLUE_COL,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,flexShrink:0 }}>A</div>
                            <input type="text" value={formA.label} onChange={e=>setFormA(p=>({...p,label:e.target.value}))} aria-label="Scenario A name"
                                style={{ flex:1,border:"none",background:"transparent",fontSize:15,fontWeight:700,color:BLUE_COL,fontFamily:"Montserrat,Arial,sans-serif",outline:"none" }}/>
                        </div>
                        {FIELDS.map(f=><MiniField key={f.name} label={f.label} name={f.name} value={formA[f.name]} onChange={handleA} accentColor={BLUE_COL} darkMode={darkMode}/>)}
                    </div>

                    {/* VS divider */}
                    <div className="vs-divider" aria-hidden="true" style={{ display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:800,color:textMuted,paddingTop:60,userSelect:"none" as const }}>VS</div>

                    {/* Scenario B */}
                    <div style={{ padding:20,borderRadius:12,border:`2px solid ${RED_COL}`,background:surface }}>
                        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16 }}>
                            <div style={{ width:32,height:32,borderRadius:"50%",background:RED_COL,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,flexShrink:0 }}>B</div>
                            <input type="text" value={formB.label} onChange={e=>setFormB(p=>({...p,label:e.target.value}))} aria-label="Scenario B name"
                                style={{ flex:1,border:"none",background:"transparent",fontSize:15,fontWeight:700,color:RED_COL,fontFamily:"Montserrat,Arial,sans-serif",outline:"none" }}/>
                        </div>
                        {FIELDS.map(f=><MiniField key={f.name} label={f.label} name={f.name} value={formB[f.name]} onChange={handleB} accentColor={RED_COL} darkMode={darkMode}/>)}
                    </div>
                </div>

                {error&&<p role="alert" style={{ color:"#f87171",fontSize:13,marginBottom:14,padding:"10px 14px",background:"rgba(248,113,113,0.1)",borderRadius:6,border:"1px solid rgba(248,113,113,0.3)" }}>{error}</p>}

                <button onClick={compare} disabled={loading} aria-busy={loading}
                    style={{ background:`linear-gradient(135deg,${accent},${darkMode?"#1a3a6b":"#1a3a6b"})`,color:"#fff",border:"none",padding:"13px 36px",borderRadius:8,fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1,marginBottom:32,fontFamily:"Montserrat,Arial,sans-serif" }}>
                    {loading?"Comparing…":"Compare scenarios"}
                </button>

                {resultA&&resultB&&(
                    <div aria-live="polite">
                        {/* Risk badges */}
                        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14,marginBottom:24 }}>
                            {[{r:resultA,risk:riskA!,label:formA.label,color:BLUE_COL},{r:resultB,risk:riskB!,label:formB.label,color:RED_COL}].map(({r,risk,label,color})=>(
                                <div key={label} style={{ padding:"18px 20px",borderRadius:12,border:`2px solid ${color}22`,background:surface,boxShadow:darkMode?"0 2px 12px rgba(0,0,0,0.3)":"0 2px 8px rgba(0,0,0,0.05)" }}>
                                    <div style={{ fontSize:12,fontWeight:700,color,marginBottom:12,display:"flex",alignItems:"center",gap:8 }}>
                                        <div style={{ width:24,height:24,borderRadius:"50%",background:color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700 }}>{label===formA.label?"A":"B"}</div>
                                        {label}
                                    </div>
                                    <div style={{ display:"inline-block",padding:"4px 14px",borderRadius:6,background:risk.bg,color:risk.color,fontSize:16,fontWeight:700,marginBottom:10 }}>
                                        {risk.label} — {Math.round(r.successProbability)}%
                                    </div>
                                    <p style={{ fontSize:12,color:textSub }}>Corpus: <strong style={{ color }}>{fmtINR(r.requiredCorpus)}</strong></p>
                                    <p style={{ fontSize:12,color:textSub,marginTop:4 }}>Monthly SIP: <strong style={{ color }}>{fmtINR(r.monthlySIP)}</strong></p>
                                </div>
                            ))}
                        </div>

                        {/* Head-to-head table */}
                        <div style={{ marginBottom:28,overflowX:"auto" }}>
                            <h3 style={{ fontSize:14,fontWeight:700,color:accent,marginBottom:12,fontFamily:"Montserrat,Arial,sans-serif" }}>Head-to-head comparison</h3>
                            <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12,background:surface }} aria-label="Head to head comparison">
                                <thead>
                                    <tr style={{ background:darkMode?"#1e3a6e":"#f7f9fc" }}>
                                        <th style={{ padding:"10px 12px",textAlign:"left",color:textSub,fontWeight:600,borderBottom:`2px solid ${border}`,fontFamily:"Montserrat,Arial,sans-serif" }}>Metric</th>
                                        <th style={{ padding:"10px 12px",textAlign:"center",color:BLUE_COL,fontWeight:700,borderBottom:`2px solid ${BLUE_COL}`,fontFamily:"Montserrat,Arial,sans-serif" }}>{formA.label}</th>
                                        <th style={{ padding:"10px 12px",textAlign:"center",color:RED_COL, fontWeight:700,borderBottom:`2px solid ${RED_COL}`, fontFamily:"Montserrat,Arial,sans-serif" }}>{formB.label}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <MetricRow label="Required corpus"          a={fmtINR(resultA.requiredCorpus)}             b={fmtINR(resultB.requiredCorpus)}             higherIsBetter={false} dark={darkMode}/>
                                    <MetricRow label="Monthly SIP (flat)"       a={fmtINR(resultA.monthlySIP)}                 b={fmtINR(resultB.monthlySIP)}                 higherIsBetter={false} dark={darkMode}/>
                                    <MetricRow label="Future monthly expense"   a={fmtINR(resultA.futureMonthlyExpense)}       b={fmtINR(resultB.futureMonthlyExpense)}       higherIsBetter={false} dark={darkMode}/>
                                    <MetricRow label="Corpus duration (years)"  a={`${resultA.yearsCorpusLasts} yrs`}          b={`${resultB.yearsCorpusLasts} yrs`}          higherIsBetter={true}  dark={darkMode}/>
                                    <MetricRow label="Success probability"      a={`${Math.round(resultA.successProbability)}%`} b={`${Math.round(resultB.successProbability)}%`} higherIsBetter={true} dark={darkMode}/>
                                    <MetricRow label="Monthly retirement income" a={fmtINR(resultA.monthlyRetirementIncome)}   b={fmtINR(resultB.monthlyRetirementIncome)}    higherIsBetter={true}  dark={darkMode}/>
                                    {(resultA.monthlyStepUpSIP||resultB.monthlyStepUpSIP)&&(
                                        <MetricRow label="Step-up SIP" a={resultA.monthlyStepUpSIP?fmtINR(resultA.monthlyStepUpSIP):"—"} b={resultB.monthlyStepUpSIP?fmtINR(resultB.monthlyStepUpSIP):"—"} higherIsBetter={false} dark={darkMode}/>
                                    )}
                                </tbody>
                            </table>
                            <p style={{ fontSize:11,color:textMuted,marginTop:6,fontFamily:"Montserrat,Arial,sans-serif" }}>↑ indicates the better value. All values are illustrative estimates.</p>
                        </div>

                        {/* Chart */}
                        {chartData&&(
                            <div style={{ marginBottom:16 }}>
                                <h3 style={{ fontSize:14,fontWeight:700,color:accent,marginBottom:12,fontFamily:"Montserrat,Arial,sans-serif" }}>Wealth timeline overlay</h3>
                                <div style={{ background:surface,borderRadius:10,padding:16,border:`1px solid ${border}` }}
                                    role="img" aria-label={`Comparison chart: ${formA.label} vs ${formB.label}`}>
                                    <div style={{ height:280 }}>
                                        <Line data={chartData} options={{
                                            responsive:true,maintainAspectRatio:false,
                                            interaction:{mode:"index" as const,intersect:false},
                                            plugins:{
                                                legend:{display:true,position:"top" as const,labels:{font:{size:12},padding:16,boxWidth:14,color:textSub}},
                                                tooltip:{backgroundColor:darkMode?"#1a1d2a":"#fff",borderColor:border,borderWidth:1,titleColor:text,bodyColor:textSub,padding:10,callbacks:{label:(c:any)=>` ${c.dataset.label}: ${fmtINR(c.raw)}`}}
                                            },
                                            scales:{
                                                x:{ticks:{maxTicksLimit:10,color:textMuted,font:{size:11}},grid:{display:false},border:{color:border}},
                                                y:{ticks:{color:textMuted,font:{size:11},callback:(v:any)=>fmtINR(Number(v))},grid:{color:darkMode?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)"},border:{color:border}}
                                            }
                                        } as any}/>
                                    </div>
                                </div>
                            </div>
                        )}

                        <p role="note" style={{ fontSize:11,color:textMuted,marginTop:12,lineHeight:1.6,fontFamily:"Montserrat,Arial,sans-serif" }}>
                            This tool has been designed for information purposes only. Actual results may vary depending on various factors involved in capital market. Investor should not consider above as a recommendation for any schemes of HDFC Mutual Fund. Past performance may or may not be sustained in future and is not a guarantee of any future returns.
                        </p>
                    </div>
                )}
            </section>
        </>
    );
}
