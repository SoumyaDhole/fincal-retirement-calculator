"use client";

import { useState } from "react";
import RetirementChart   from "../components/RetirementChart";
import ComparisonView    from "../components/ComparisonView";
import RetirementChatbot from "../components/RetirementChatbot";
import ReadinessScore    from "../components/ReadinessScore";
import WhatIfSliders     from "../components/WhatIfSliders";
import PDFExport         from "../components/PDFExport";

// ─── Theme tokens ──────────────────────────────────────────────────
const LIGHT = {
  bg:         "#f7f9fc",
  surface:    "#ffffff",
  surfaceAlt: "#f0f4fb",
  border:     "#e5e7eb",
  borderAccent:"#dbe6f5",
  text:       "#111827",
  textSub:    "#6b7280",
  textMuted:  "#9ca3af",
  accent:     "#224c87",
  accentGrad: "linear-gradient(135deg,#224c87,#1a3a6b)",
  red:        "#da3832",
  green:      "#059669",
  navShadow:  "0 1px 12px rgba(0,0,0,0.06)",
  cardShadow: "0 2px 12px rgba(0,0,0,0.04)",
  inputBg:    "#fafafa",
  disclaimerBg:"#ffffff",
};
const DARK = {
  bg:         "#0f1117",
  surface:    "#1a1d27",
  surfaceAlt: "#1e2235",
  border:     "#2a2d3e",
  borderAccent:"#2c3a5a",
  text:       "#f1f5f9",
  textSub:    "#94a3b8",
  textMuted:  "#64748b",
  accent:     "#4f7ec4",
  accentGrad: "linear-gradient(135deg,#2d5fa3,#224c87)",
  red:        "#f87171",
  green:      "#34d399",
  navShadow:  "0 1px 12px rgba(0,0,0,0.4)",
  cardShadow: "0 2px 12px rgba(0,0,0,0.3)",
  inputBg:    "#12151f",
  disclaimerBg:"#1a1d27",
};

type Theme = typeof LIGHT;

interface FormState {
  currentAge:string; retirementAge:string; lifeExpectancy:string;
  monthlyExpense:string; inflationRate:string; preReturn:string;
  postReturn:string; stepUpRate:string; existingCorpus:string;
}

const PERSONAS = [
  { label:"Fresh Graduate", icon:"🎓", desc:"Age 22 · ₹30k/mo",
    values:{ currentAge:"22",retirementAge:"60",lifeExpectancy:"85",monthlyExpense:"30000",inflationRate:"6",preReturn:"12",postReturn:"7",stepUpRate:"10",existingCorpus:"0" } },
  { label:"Mid-career",     icon:"💼", desc:"Age 35 · ₹80k/mo",
    values:{ currentAge:"35",retirementAge:"60",lifeExpectancy:"85",monthlyExpense:"80000",inflationRate:"6",preReturn:"10",postReturn:"7",stepUpRate:"8", existingCorpus:"500000" } },
  { label:"Late Starter",   icon:"⏰", desc:"Age 45 · ₹1.5L/mo",
    values:{ currentAge:"45",retirementAge:"62",lifeExpectancy:"85",monthlyExpense:"150000",inflationRate:"6",preReturn:"9", postReturn:"7",stepUpRate:"5", existingCorpus:"2000000" } },
] as const;

const SCENARIOS = {
  conservative:{ preReturn:"7",  postReturn:"5", label:"Conservative", icon:"🛡", desc:"Lower risk" },
  moderate:    { preReturn:"10", postReturn:"7", label:"Moderate",      icon:"⚖", desc:"Balanced" },
  aggressive:  { preReturn:"12", postReturn:"9", label:"Aggressive",    icon:"🚀", desc:"High growth" },
} as const;

const FIELD_EDU: Record<string,{why:string;eg:string}> = {
  currentAge:    { why:"Earlier you start, less you need to invest monthly due to compounding.",          eg:"Starting at 25 vs 35 can halve your required SIP." },
  retirementAge: { why:"More working years = larger corpus and fewer retirement years to fund.",          eg:"Retiring at 60 vs 55 reduces required SIP by 30–40%." },
  lifeExpectancy:{ why:"Plan long — running out of money is riskier than having surplus.",               eg:"Planning to 90 vs 80 adds a 10-year safety buffer." },
  monthlyExpense:{ why:"Your current lifestyle, inflated forward to estimate future needs.",              eg:"₹50k/month today ≈ ₹1.6L/month in 30 years at 6% inflation." },
  existingCorpus:{ why:"Savings already invested reduce how much new SIP you need.",                     eg:"₹5L today at 10% becomes ~₹87L in 30 years." },
  inflationRate: { why:"Inflation erodes purchasing power. India's long-run avg is 5–7%.",               eg:"At 6%, ₹1,000 today costs ₹1,791 in 10 years." },
  preReturn:     { why:"Return on your investments during working years (equity funds).",                 eg:"Indian large-cap equity has historically returned 10–14% over 10+ years." },
  postReturn:    { why:"Post-retirement investments are safer, so returns are lower.",                    eg:"Debt/balanced funds typically return 6–8%." },
  stepUpRate:    { why:"Raising SIP by 10–15%/year as income grows cuts starting SIP dramatically.",     eg:"A 10% step-up reduces starting SIP by ~35% vs flat SIP." },
};

type NavTab = "calculator"|"comparison"|"learn";

function fmtINR(n:number){ if(n>=1e7)return"₹"+(n/1e7).toFixed(2)+" Cr"; if(n>=1e5)return"₹"+(n/1e5).toFixed(1)+" L"; return"₹"+Math.round(n).toLocaleString("en-IN"); }
function getRisk(p:number){ if(p>=80)return{label:"SAFE",bg:"rgba(52,211,153,0.12)",color:"#34d399",border:"rgba(52,211,153,0.3)"}; if(p>=50)return{label:"MODERATE",bg:"rgba(251,191,36,0.12)",color:"#fbbf24",border:"rgba(251,191,36,0.3)"}; return{label:"RISKY",bg:"rgba(248,113,113,0.12)",color:"#f87171",border:"rgba(248,113,113,0.3)"}; }

// ─── Field ──────────────────────────────────────────────────────
function Field({ label,name,value,onChange,hint,fieldKey,t }:{
  label:string;name:string;value:string;
  onChange:(e:React.ChangeEvent<HTMLInputElement>)=>void;
  hint?:string;fieldKey?:string;t:Theme;
}) {
  const [showEdu,setShowEdu]=useState(false);
  const edu=fieldKey?FIELD_EDU[fieldKey]:null;
  const id=`field-${name}`;
  return (
    <div style={{position:"relative"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
        <label htmlFor={id} style={{fontSize:12,fontWeight:700,color:t.textSub,fontFamily:"Montserrat,Arial,sans-serif"}}>
          {label}
        </label>
        {edu&&(
          <button type="button" onClick={()=>setShowEdu(v=>!v)} aria-expanded={showEdu} aria-label={`Learn about ${label}`}
            style={{background:showEdu?t.accent:"transparent",border:`1px solid ${t.borderAccent}`,borderRadius:"50%",width:18,height:18,fontSize:10,fontWeight:700,color:showEdu?"#fff":t.accent,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>?</button>
        )}
      </div>
      {hint&&<p style={{fontSize:11,color:t.textMuted,marginBottom:5,fontFamily:"Montserrat,Arial,sans-serif"}}>{hint}</p>}
      {/* suppressHydrationWarning fixes the fdprocessedid hydration error from browser extensions */}
      <input id={id} type="number" name={name} value={value} onChange={onChange} suppressHydrationWarning
        style={{width:"100%",padding:"10px 12px",border:`1.5px solid ${t.border}`,borderRadius:9,fontSize:14,color:t.text,fontFamily:"Montserrat,Arial,sans-serif",background:t.inputBg,outline:"none",transition:"border-color 0.15s",boxSizing:"border-box"}}
        onFocus={e=>(e.target.style.borderColor=t.accent)}
        onBlur={e=>(e.target.style.borderColor=t.border)}
      />
      {showEdu&&edu&&(
        <div style={{position:"absolute",left:0,right:0,top:"100%",zIndex:20,background:"#1e293b",borderRadius:10,padding:"12px 14px",boxShadow:"0 8px 24px rgba(0,0,0,0.35)",marginTop:4,border:"1px solid #334155"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#93c5fd",marginBottom:5,fontFamily:"Montserrat,Arial,sans-serif"}}>Why this matters</div>
          <p style={{fontSize:12,color:"#e2e8f0",marginBottom:8,lineHeight:1.55,fontFamily:"Georgia,serif"}}>{edu.why}</p>
          <div style={{fontSize:11,fontWeight:700,color:"#86efac",marginBottom:4,fontFamily:"Montserrat,Arial,sans-serif"}}>Example</div>
          <p style={{fontSize:11,color:"#bbf7d0",lineHeight:1.55,fontFamily:"Georgia,serif"}}>{edu.eg}</p>
        </div>
      )}
    </div>
  );
}

// ─── ResultCard ─────────────────────────────────────────────────
function ResultCard({title,value,sub,highlight,color,icon,t}:{
  title:string;value:string;sub?:string;highlight?:boolean;color?:string;icon?:string;t:Theme;
}) {
  return (
    <div style={{padding:"18px 20px",borderRadius:12,border:highlight?`2px solid ${t.accent}`:`1px solid ${t.border}`,background:highlight?t.surfaceAlt:t.surface,boxShadow:t.cardShadow,position:"relative",overflow:"hidden"}}>
      {highlight&&<div style={{position:"absolute",top:0,left:0,right:0,height:3,background:t.accentGrad}}/>}
      <p style={{fontSize:10,color:t.textMuted,marginBottom:6,fontFamily:"Montserrat,Arial,sans-serif",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.6px"}}>
        {icon&&<span style={{marginRight:5}}>{icon}</span>}{title}
      </p>
      <p style={{fontSize:22,fontWeight:800,color:color??t.accent,lineHeight:1.2,fontFamily:"Montserrat,Arial,sans-serif"}}>{value}</p>
      {sub&&<p style={{fontSize:11,color:t.textMuted,marginTop:5,fontFamily:"Montserrat,Arial,sans-serif"}}>{sub}</p>}
    </div>
  );
}

// ─── BucketCard ─────────────────────────────────────────────────
function BucketCard({label,value,rate,color,pct,icon,t}:{label:string;value:string;rate:string;color:string;pct:string;icon:string;t:Theme;}) {
  return (
    <div style={{padding:"16px 18px",borderRadius:12,border:`1.5px solid ${color}30`,background:t.surface,boxShadow:t.cardShadow}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <span style={{fontSize:20}}>{icon}</span>
        <span style={{fontSize:10,fontWeight:700,color:"#fff",background:color,padding:"2px 8px",borderRadius:20,fontFamily:"Montserrat,Arial,sans-serif"}}>{pct}</span>
      </div>
      <p style={{fontSize:13,fontWeight:700,color:t.text,marginBottom:6,fontFamily:"Montserrat,Arial,sans-serif"}}>{label}</p>
      <p style={{fontSize:20,fontWeight:800,color,fontFamily:"Montserrat,Arial,sans-serif"}}>{value}</p>
      <p style={{fontSize:11,color:t.textMuted,marginTop:4,fontFamily:"Montserrat,Arial,sans-serif"}}>Assumed {rate} p.a.</p>
    </div>
  );
}

// ─── Learn Tab ──────────────────────────────────────────────────
function LearnTab({t}:{t:Theme}) {
  const [open,setOpen]=useState<string|null>("what");
  const sections=[
    { id:"what",  title:"📚 What is retirement planning?",
      content:`Retirement planning means figuring out how much money you will need after you stop working — and then building a systematic savings plan to reach that number.\n\nWhen you retire, your salary stops. But your expenses don't. You still need money for food, rent, healthcare, travel, and emergencies — for potentially 20–30 years.\n\nThis calculator helps you estimate:\n• How much monthly income you'll need at retirement (adjusted for inflation)\n• The total "corpus" (lump sum) needed to sustain that income\n• How much to invest monthly right now (your SIP) to build that corpus` },
    { id:"sip",   title:"💰 What is a SIP?",
      content:`SIP stands for Systematic Investment Plan — investing a fixed amount every month into mutual funds.\n\nWhy SIP works so well:\n• Rupee Cost Averaging: You buy more units when markets are low, fewer when high.\n• Compounding: ₹5,000/month SIP at 12% for 30 years → ₹1.76 Crore. You invested only ₹18 Lakhs. The rest is compounding!\n• Discipline: Small regular investments are easier than large lump sums.\n\nStep-up SIP means increasing your SIP by a % each year. A 10% step-up reduces your starting SIP by ~35%.` },
    { id:"infl",  title:"📈 Why does inflation matter so much?",
      content:`Inflation is the gradual rise in prices over time. At 6% annual inflation:\n• ₹50,000/month today → ₹1.6 Lakh/month in 30 years\n• Your ₹1 today → only ₹0.17 purchasing power in 30 years\n\nThis calculator uses three inflation buckets:\n• General living expenses: 6% — groceries, utilities, transport\n• Medical expenses: 8% — healthcare inflates faster than general prices\n• Lifestyle (travel, dining): 4% — typically lower inflation\n\nA savings account at 4% return vs 6% inflation actually loses money in real terms.` },
    { id:"monte", title:"🎲 What is Monte Carlo simulation?",
      content:`Real markets don't deliver smooth returns. Some years +25%, some years -15%. Monte Carlo handles this uncertainty.\n\nHow it works:\n1. Run 1,000 different "what if" market scenarios\n2. Each uses a different random sequence of returns (with realistic volatility)\n3. Count how many scenarios end with money still remaining\n\nResult: "78% success" = 780 of 1,000 scenarios end with money left.\n\nSafe ≥ 80% | Moderate 50–80% | Risky < 50%\n\nTo improve: increase SIP, retire later, reduce target expenses, or use step-up SIP.` },
    { id:"corp",  title:"🏦 What is a retirement corpus?",
      content:`The retirement corpus is the total lump sum you need saved by retirement day.\n\nThe corpus must:\n1. Be large enough to invest in safe instruments (7–9% return)\n2. Allow monthly withdrawals covering your expenses + inflation each year\n3. Last until your life expectancy\n\nExample: Retirement monthly expense ₹1 Lakh at 7% post-retirement return → need roughly ₹1.5–2 Crore for 20 years.\n\nThis calculator uses the Present Value of Annuity formula — the same method financial planners use globally.` },
    { id:"regret",title:"⏰ The cost of waiting — why start now?",
      content:`Every year you delay, your required SIP goes up dramatically.\n\nBuilding ₹2 Crore corpus by age 60:\n• Start at 25 → ₹3,460/month\n• Start at 30 → ₹6,280/month\n• Start at 35 → ₹11,600/month\n• Start at 40 → ₹22,450/month\n\nWaiting 5 years from 25 to 30 nearly doubles your required SIP. From 35 to 40 doubles it again.\n\nThe Regret Calculator in your results shows exactly what a 5-year delay costs — in extra monthly SIP and total extra amount paid.` },
  ];
  return (
    <section style={{marginTop:32}} aria-labelledby="learn-heading">
      <div style={{borderBottom:`3px solid ${t.accent}`,paddingBottom:16,marginBottom:28}}>
        <h2 id="learn-heading" style={{fontSize:24,fontWeight:800,color:t.text,fontFamily:"Montserrat,Arial,sans-serif",letterSpacing:"-0.3px"}}>Retirement Planning 101</h2>
        <p style={{fontSize:13,color:t.textSub,marginTop:6,fontFamily:"Montserrat,Arial,sans-serif"}}>New to retirement planning? These explainers decode every number in your report.</p>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {sections.map(s=>(
          <div key={s.id} style={{border:`1.5px solid ${open===s.id?t.accent:t.border}`,borderRadius:12,overflow:"hidden",background:open===s.id?t.surfaceAlt:t.surface,transition:"border-color 0.15s"}}>
            <button onClick={()=>setOpen(open===s.id?null:s.id)} aria-expanded={open===s.id}
              style={{width:"100%",padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"transparent",border:"none",cursor:"pointer",textAlign:"left"}}>
              <span style={{fontSize:15,fontWeight:700,color:t.text,fontFamily:"Montserrat,Arial,sans-serif"}}>{s.title}</span>
              <span style={{fontSize:18,color:t.accent,fontWeight:700,transform:open===s.id?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}>⌄</span>
            </button>
            {open===s.id&&(
              <div style={{padding:"4px 20px 20px",borderTop:`1px solid ${t.border}`}}>
                {s.content.split("\n").map((line,i)=>(
                  line.trim()===""?<br key={i}/>:
                  line.startsWith("•")?(<div key={i} style={{display:"flex",gap:8,marginBottom:5}}><span style={{color:t.accent,fontWeight:700,flexShrink:0}}>•</span><span style={{fontSize:13,color:t.textSub,lineHeight:1.65,fontFamily:"Georgia,serif"}}>{line.slice(1).trim()}</span></div>):
                  (<p key={i} style={{fontSize:13,color:t.textSub,lineHeight:1.65,marginBottom:8,fontFamily:"Georgia,serif"}}>{line}</p>)
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{marginTop:24,padding:"16px 20px",background:`${t.accent}15`,borderRadius:12,border:`1.5px solid ${t.accent}30`,fontSize:13,color:t.text,fontFamily:"Montserrat,Arial,sans-serif",lineHeight:1.6}}>
        <strong>💡 Key takeaway:</strong> The earlier you start, the smaller your monthly investment. Time is your most valuable asset in retirement planning.
      </div>
    </section>
  );
}

// ─── Main ────────────────────────────────────────────────────────
export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const t = darkMode ? DARK : LIGHT;

  const [activeTab,setActiveTab]=useState<NavTab>("calculator");
  const [form,setForm]=useState<FormState>({currentAge:"25",retirementAge:"60",lifeExpectancy:"85",monthlyExpense:"40000",inflationRate:"6",preReturn:"10",postReturn:"7",stepUpRate:"0",existingCorpus:"0"});
  const [result,setResult]=useState<any>(null);
  const [scenario,setScenario]=useState<keyof typeof SCENARIOS>("moderate");
  const [persona,setPersona]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  const handleChange=(e:React.ChangeEvent<HTMLInputElement>)=>setForm(prev=>({...prev,[e.target.name]:e.target.value}));
  const applyScenario=(type:keyof typeof SCENARIOS)=>{ setScenario(type); setForm(prev=>({...prev,preReturn:SCENARIOS[type].preReturn,postReturn:SCENARIOS[type].postReturn})); };
  const applyPersona=(p:typeof PERSONAS[number])=>{ setPersona(p.label); setForm({...p.values}); };

  const calculate=async()=>{
    setError("");setLoading(true);
    try {
      const payload={currentAge:Number(form.currentAge),retirementAge:Number(form.retirementAge),lifeExpectancy:Number(form.lifeExpectancy),monthlyExpense:Number(form.monthlyExpense),inflationRate:Number(form.inflationRate)/100,preReturn:Number(form.preReturn)/100,postReturn:Number(form.postReturn)/100,stepUpRate:Number(form.stepUpRate)/100,existingCorpus:Number(form.existingCorpus)};
      const res=await fetch("http://localhost:5000/api/retirement/calculate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      if(!res.ok)throw new Error("Server error");
      const data=await res.json();
      setResult(data.data);
      setTimeout(()=>document.getElementById("results-section")?.scrollIntoView({behavior:"smooth",block:"start"}),100);
    } catch { setError("Could not connect to backend. Make sure it is running on port 5000."); }
    setLoading(false);
  };

  const numericInputs={currentAge:Number(form.currentAge),retirementAge:Number(form.retirementAge),lifeExpectancy:Number(form.lifeExpectancy),monthlyExpense:Number(form.monthlyExpense),inflationRate:Number(form.inflationRate)/100,preReturn:Number(form.preReturn)/100,postReturn:Number(form.postReturn)/100};
  const risk=result?getRisk(result.successProbability):null;

  const thS:React.CSSProperties={padding:"10px 14px",background:t.accent,color:"#fff",fontWeight:700,fontSize:11,textAlign:"left",whiteSpace:"nowrap",fontFamily:"Montserrat,Arial,sans-serif"};
  const tdS=(hi:boolean):React.CSSProperties=>({padding:"10px 14px",fontSize:12,border:`1px solid ${t.border}`,background:hi?`${t.accent}18`:t.surface,fontWeight:hi?800:400,color:hi?t.accent:t.textSub,fontFamily:"Montserrat,Arial,sans-serif"});

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;}
        body{margin:0;background:${t.bg};transition:background 0.2s;}
        .skip-link{position:absolute;top:-100px;left:16px;z-index:9999;background:#224c87;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;text-decoration:none;transition:top 0.1s;}
        .skip-link:focus{top:8px;}
        .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;}
        input[type=number]{-moz-appearance:textfield;}
        input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
        @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:0.01ms!important;transition-duration:0.01ms!important;}}
        @media(forced-colors:active){button{border:2px solid ButtonText!important;}}
        @media(max-width:640px){.vs-divider{display:none!important;}}
      `}</style>

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav aria-label="Main navigation" style={{borderBottom:`1px solid ${t.border}`,background:t.surface,position:"sticky",top:0,zIndex:100,boxShadow:t.navShadow}}>
        <div style={{maxWidth:960,margin:"0 auto",padding:"0 20px",display:"flex",alignItems:"center"}}>

          {/* Logo */}
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"13px 0",marginRight:"auto"}}>
            <div style={{width:32,height:32,borderRadius:8,background:t.accentGrad,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14,fontWeight:800,fontFamily:"Montserrat,Arial,sans-serif"}}>F</div>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:t.accent,fontFamily:"Montserrat,Arial,sans-serif",lineHeight:1}}>FinCal</div>
              <div style={{fontSize:9,color:t.textMuted,fontFamily:"Montserrat,Arial,sans-serif",letterSpacing:"0.5px"}}>TECHNEX '26</div>
            </div>
          </div>

          {/* Tabs */}
          <div role="tablist" aria-label="Page sections" style={{display:"flex"}}>
            {([{key:"calculator",label:"Calculator",icon:"🧮"},{key:"comparison",label:"Compare",icon:"⚖️"},{key:"learn",label:"Learn",icon:"📚"}] as {key:NavTab;label:string;icon:string}[]).map(t2=>(
              <button key={t2.key} role="tab" aria-selected={activeTab===t2.key} onClick={()=>setActiveTab(t2.key)}
                style={{padding:"15px 14px",fontSize:13,fontWeight:activeTab===t2.key?700:500,color:activeTab===t2.key?t.accent:t.textMuted,background:"none",border:"none",borderBottom:activeTab===t2.key?`3px solid ${t.accent}`:"3px solid transparent",cursor:"pointer",borderRadius:0,fontFamily:"Montserrat,Arial,sans-serif",marginBottom:-1,transition:"color 0.15s,border-color 0.15s",display:"flex",alignItems:"center",gap:5}}>
                <span aria-hidden="true">{t2.icon}</span>{t2.label}
              </button>
            ))}
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={()=>setDarkMode(v=>!v)}
            aria-label={darkMode?"Switch to light mode":"Switch to dark mode"}
            title={darkMode?"Light mode":"Dark mode"}
            style={{
              marginLeft:16,
              width:44,height:24,borderRadius:12,
              background:darkMode?"#4f7ec4":"#e5e7eb",
              border:"none",cursor:"pointer",
              position:"relative",transition:"background 0.2s",
              flexShrink:0,
            }}
          >
            <span style={{
              position:"absolute",top:3,
              left:darkMode?22:3,
              width:18,height:18,borderRadius:"50%",
              background:darkMode?"#fff":"#fff",
              transition:"left 0.2s",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:11,
              boxShadow:"0 1px 3px rgba(0,0,0,0.3)",
            }}>
              {darkMode?"🌙":"☀️"}
            </span>
          </button>

        </div>
      </nav>

      <main id="main-content" style={{maxWidth:960,margin:"0 auto",padding:"32px 20px 100px"}}>

        {activeTab==="calculator"&&(
          <>
            {/* Hero */}
            <header style={{marginBottom:36}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:16,flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:260}}>
                  <h1 style={{fontSize:28,fontWeight:800,color:t.text,fontFamily:"Montserrat,Arial,sans-serif",letterSpacing:"-0.5px",margin:0}}>
                    Retirement Planning Calculator
                  </h1>
                  <p style={{fontSize:13,color:t.textSub,marginTop:8,lineHeight:1.6,fontFamily:"Georgia,serif",maxWidth:560}}>
                    Estimate how much you need to save for a comfortable retirement — with inflation buckets, Monte Carlo simulations, and personalised SIP recommendations.
                  </p>
                  <p style={{fontSize:11,color:t.textMuted,marginTop:6,fontFamily:"Montserrat,Arial,sans-serif"}}>
                    ⓘ All values are <strong>illustrative estimates</strong> for educational purposes only. Not investment advice.
                  </p>
                </div>
                <div style={{background:t.surfaceAlt,borderRadius:12,padding:"14px 18px",border:`1px solid ${t.borderAccent}`,minWidth:180,fontSize:12,color:t.textSub,fontFamily:"Montserrat,Arial,sans-serif",lineHeight:1.7}}>
                  <div style={{fontWeight:700,marginBottom:6,color:t.accent}}>📋 What this calculates</div>
                  <div>✓ Required retirement corpus</div>
                  <div>✓ Monthly SIP amount</div>
                  <div>✓ Monte Carlo success %</div>
                  <div>✓ Inflation-adjusted expenses</div>
                  <div>✓ Cost of delaying by 5 years</div>
                </div>
              </div>
            </header>

            {/* Personas */}
            <section aria-labelledby="persona-heading" style={{marginBottom:28}}>
              <h2 id="persona-heading" style={{fontSize:14,fontWeight:700,color:t.textSub,marginBottom:12,fontFamily:"Montserrat,Arial,sans-serif"}}>
                Quick start — pick a profile
                <span style={{fontSize:11,color:t.textMuted,fontWeight:400,marginLeft:8}}>or fill your own details below</span>
              </h2>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}} role="group" aria-labelledby="persona-heading">
                {PERSONAS.map(p=>(
                  <button key={p.label} onClick={()=>applyPersona(p)} aria-pressed={persona===p.label}
                    style={{background:persona===p.label?t.accent:t.surface,color:persona===p.label?"#fff":t.text,border:persona===p.label?`2px solid ${t.accent}`:`2px solid ${t.border}`,borderRadius:10,padding:"10px 16px",fontWeight:600,cursor:"pointer",fontSize:13,textAlign:"left",transition:"all 0.15s",fontFamily:"Montserrat,Arial,sans-serif",boxShadow:persona===p.label?`0 4px 12px ${t.accent}33`:"none"}}>
                    <span style={{fontSize:16,marginRight:6}}>{p.icon}</span>{p.label}
                    <span style={{display:"block",fontSize:11,fontWeight:400,opacity:0.75,marginTop:1}}>{p.desc}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Scenarios */}
            <section aria-labelledby="scenario-heading" style={{marginBottom:28}}>
              <h2 id="scenario-heading" style={{fontSize:14,fontWeight:700,color:t.textSub,marginBottom:8,fontFamily:"Montserrat,Arial,sans-serif"}}>
                Investment scenario
                <span style={{fontSize:11,color:t.textMuted,fontWeight:400,marginLeft:8}}>sets assumed return rates</span>
              </h2>
              <div role="group" aria-labelledby="scenario-heading" style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {(Object.entries(SCENARIOS) as [keyof typeof SCENARIOS,typeof SCENARIOS[keyof typeof SCENARIOS]][]).map(([key,s])=>(
                  <button key={key} onClick={()=>applyScenario(key)} aria-pressed={scenario===key}
                    style={{background:scenario===key?t.accent:t.surface,color:scenario===key?"#fff":t.text,border:scenario===key?`2px solid ${t.accent}`:`2px solid ${t.border}`,borderRadius:10,padding:"10px 18px",fontWeight:scenario===key?700:500,cursor:"pointer",fontSize:13,fontFamily:"Montserrat,Arial,sans-serif",transition:"all 0.15s"}}>
                    <span style={{marginRight:5}}>{s.icon}</span>{s.label}
                    <span style={{display:"block",fontSize:10,fontWeight:400,opacity:0.75,marginTop:1}}>{s.desc}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Form */}
            <section aria-labelledby="form-heading" style={{background:t.surface,borderRadius:14,padding:"24px 28px",border:`1px solid ${t.border}`,boxShadow:t.cardShadow,marginBottom:28}}>
              <h2 id="form-heading" style={{fontSize:15,fontWeight:700,color:t.accent,marginBottom:4,fontFamily:"Montserrat,Arial,sans-serif"}}>Your details</h2>
              <p style={{fontSize:12,color:t.textMuted,marginBottom:20,fontFamily:"Montserrat,Arial,sans-serif"}}>
                Click the <strong style={{color:t.accent}}>?</strong> next to any field to learn why it matters.
              </p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:"20px 28px"}}>
                <Field label="Current age (years)"                name="currentAge"     value={form.currentAge}     onChange={handleChange} hint="Your age today"                          fieldKey="currentAge"     t={t}/>
                <Field label="Retirement age (years)"             name="retirementAge"  value={form.retirementAge}  onChange={handleChange} hint="Age you plan to stop working"           fieldKey="retirementAge"  t={t}/>
                <Field label="Life expectancy (years)"            name="lifeExpectancy" value={form.lifeExpectancy} onChange={handleChange} hint="Plan until this age as a safety buffer" fieldKey="lifeExpectancy" t={t}/>
                <Field label="Current monthly expenses (₹)"      name="monthlyExpense" value={form.monthlyExpense} onChange={handleChange} hint="Total monthly spending today"            fieldKey="monthlyExpense" t={t}/>
                <Field label="Existing savings / corpus (₹)"     name="existingCorpus" value={form.existingCorpus} onChange={handleChange} hint="EPF, FD, MF already saved — 0 if none" fieldKey="existingCorpus" t={t}/>
                <Field label="Assumed inflation rate (%)"         name="inflationRate"  value={form.inflationRate}  onChange={handleChange} hint="Typical 5–7%. Editable assumption."     fieldKey="inflationRate"  t={t}/>
                <Field label="Pre-retirement return (% p.a.)"    name="preReturn"      value={form.preReturn}      onChange={handleChange} hint="Expected return during working years"    fieldKey="preReturn"      t={t}/>
                <Field label="Post-retirement return (% p.a.)"   name="postReturn"     value={form.postReturn}     onChange={handleChange} hint="Expected return after retirement"        fieldKey="postReturn"     t={t}/>
                <Field label="Annual SIP step-up (%) — optional" name="stepUpRate"     value={form.stepUpRate}     onChange={handleChange} hint="% increase in SIP each year. 0 to skip." fieldKey="stepUpRate"    t={t}/>
              </div>
              {error&&<p role="alert" style={{color:t.red,fontSize:13,marginTop:16,padding:"10px 14px",background:`${t.red}15`,borderRadius:8,border:`1px solid ${t.red}40`}}>⚠ {error}</p>}
              <button onClick={calculate} disabled={loading} aria-busy={loading}
                style={{marginTop:24,background:loading?"#93afd0":t.accentGrad,color:"#fff",padding:"14px 44px",borderRadius:10,border:"none",fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:"Montserrat,Arial,sans-serif",boxShadow:loading?"none":`0 4px 16px ${t.accent}50`,transition:"all 0.15s",letterSpacing:"0.2px"}}>
                {loading?"⏳ Calculating…":"Calculate my retirement plan →"}
              </button>
            </section>

            {/* Results */}
            {result&&(
              <section id="results-section" aria-label="Retirement calculation results" aria-live="polite">
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,borderBottom:`3px solid ${t.accent}`,paddingBottom:16,marginBottom:28}}>
                  <div>
                    <h2 style={{fontSize:22,fontWeight:800,color:t.text,fontFamily:"Montserrat,Arial,sans-serif",margin:0}}>Your Retirement Plan</h2>
                    <p style={{fontSize:12,color:t.textMuted,marginTop:4,fontFamily:"Montserrat,Arial,sans-serif"}}>Based on assumed rates — illustrative projections only.</p>
                  </div>
                  <PDFExport results={result} inputs={numericInputs}/>
                </div>

                <ReadinessScore result={result} form={form}/>

                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(195px,1fr))",gap:14,marginBottom:28}}>
                  <ResultCard icon="📅" title="Future monthly expense"     value={fmtINR(result.futureMonthlyExpense)}         sub="Inflation-adjusted at retirement"  t={t}/>
                  <ResultCard icon="🏦" title="Required retirement corpus" value={fmtINR(result.requiredCorpus)}               sub="Total corpus needed" highlight      t={t}/>
                  <ResultCard icon="📈" title="Monthly SIP (flat)"          value={fmtINR(result.monthlySIP)}                   sub="Constant monthly investment"       t={t}/>
                  {result.monthlyStepUpSIP&&<ResultCard icon="⬆️" title={`SIP with ${form.stepUpRate}% step-up`} value={fmtINR(result.monthlyStepUpSIP)} sub="Lower start, rises yearly" highlight t={t}/>}
                  {result.existingCorpusAtRetirement>0&&<ResultCard icon="💰" title="Existing savings at retirement" value={fmtINR(result.existingCorpusAtRetirement)} sub="Current corpus compounded" color={t.green} t={t}/>}
                  <ResultCard icon="📆" title="Corpus duration"             value={`${result.yearsCorpusLasts} yrs`}            sub="Estimated years it lasts"          t={t}/>
                  <ResultCard icon="🎲" title="Success probability"         value={`${Math.round(result.successProbability)}%`} sub="1,000 Monte Carlo sims" color={risk!.color} t={t}/>
                </div>

                {/* Paycheck */}
                <div style={{padding:"22px 26px",background:t.surfaceAlt,borderRadius:14,border:`2px solid ${t.borderAccent}`,marginBottom:28}}>
                  <h3 style={{fontSize:15,fontWeight:800,color:t.accent,marginBottom:10,fontFamily:"Montserrat,Arial,sans-serif"}}>💵 Your estimated retirement paycheck</h3>
                  <p style={{fontSize:14,color:t.text,lineHeight:1.8,fontFamily:"Georgia,serif"}}>
                    A corpus of <strong style={{color:t.accent}}>{fmtINR(result.requiredCorpus)}</strong> could provide{" "}
                    <strong style={{color:t.accent,fontSize:22,fontFamily:"Montserrat,Arial,sans-serif"}}>{fmtINR(result.monthlyRetirementIncome)}</strong>/month at retirement.
                  </p>
                  <p style={{fontSize:12,color:t.textSub,marginTop:6,fontFamily:"Montserrat,Arial,sans-serif"}}>Equivalent to today's <strong>{fmtINR(result.monthlyIncomeInTodaysMoney)}</strong>/month in purchasing power.</p>
                  <p style={{fontSize:11,color:t.textMuted,marginTop:4,fontFamily:"Montserrat,Arial,sans-serif"}}>Illustrative only.</p>
                </div>

                {/* Buckets */}
                <section aria-labelledby="buckets-heading" style={{marginBottom:28}}>
                  <h3 id="buckets-heading" style={{fontSize:14,fontWeight:700,color:t.accent,marginBottom:4,fontFamily:"Montserrat,Arial,sans-serif"}}>Expense breakdown at retirement</h3>
                  <p style={{fontSize:12,color:t.textSub,marginBottom:14,fontFamily:"Montserrat,Arial,sans-serif"}}>Different expense types inflate at different rates. Medical costs inflate fastest.</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12}}>
                    <BucketCard label="General living"     value={fmtINR(result.expenseBuckets.general)}   rate="6%" color="#4f7ec4" pct="60% of expenses" icon="🛒" t={t}/>
                    <BucketCard label="Medical & health"   value={fmtINR(result.expenseBuckets.medical)}   rate="8%" color={t.red}   pct="25% of expenses" icon="🏥" t={t}/>
                    <BucketCard label="Lifestyle & travel" value={fmtINR(result.expenseBuckets.lifestyle)} rate="4%" color={t.green} pct="15% of expenses" icon="✈️" t={t}/>
                  </div>
                </section>

                {/* Risk */}
                <section aria-labelledby="risk-heading" style={{marginBottom:28}}>
                  <h3 id="risk-heading" style={{fontSize:14,fontWeight:700,color:t.accent,marginBottom:10,fontFamily:"Montserrat,Arial,sans-serif"}}>Retirement risk level</h3>
                  <div style={{display:"inline-flex",alignItems:"center",gap:12,background:risk!.bg,padding:"12px 20px",borderRadius:10,border:`1.5px solid ${risk!.border}`}}
                    aria-label={`Risk level: ${risk!.label} — ${Math.round(result.successProbability)}% success probability`}>
                    <span style={{fontSize:22,fontWeight:800,color:risk!.color,fontFamily:"Montserrat,Arial,sans-serif",letterSpacing:1}}>{risk!.label}</span>
                    <span style={{fontSize:20,fontWeight:700,color:risk!.color,fontFamily:"Montserrat,Arial,sans-serif"}}>{Math.round(result.successProbability)}%</span>
                    <span style={{fontSize:11,color:risk!.color,opacity:0.8,fontFamily:"Montserrat,Arial,sans-serif"}}>success probability</span>
                  </div>
                  <p style={{fontSize:11,color:t.textMuted,marginTop:8,fontFamily:"Montserrat,Arial,sans-serif"}}>SAFE ≥ 80% &nbsp;|&nbsp; MODERATE ≥ 50% &nbsp;|&nbsp; RISKY &lt; 50%</p>
                </section>

                {/* Regret */}
                <section aria-labelledby="regret-heading" style={{padding:"22px 26px",background:`${t.red}10`,borderRadius:14,border:`1.5px solid ${t.red}40`,marginBottom:28}}>
                  <h3 id="regret-heading" style={{fontSize:14,fontWeight:700,color:t.red,marginBottom:6,fontFamily:"Montserrat,Arial,sans-serif"}}>⏰ Cost of waiting {result.regret.delayYears} years</h3>
                  <p style={{fontSize:12,color:t.textMuted,marginBottom:14,fontFamily:"Montserrat,Arial,sans-serif"}}>What if you start {result.regret.delayYears} years from now instead of today?</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:14}}>
                    {[
                      {label:"Start today",            value:fmtINR(result.regret.sipIfStartNow),   color:t.green, suffix:"/mo"},
                      {label:`Start in ${result.regret.delayYears} years`, value:fmtINR(result.regret.sipIfDelayed), color:t.red, suffix:"/mo"},
                      {label:"Penalty per month",       value:fmtINR(result.regret.extraMonthlySIP), color:t.red, suffix:"/mo"},
                      {label:"Total extra you'd pay",   value:fmtINR(result.regret.extraTotalPaid),  color:t.red, suffix:""},
                    ].map(item=>(
                      <div key={item.label}>
                        <p style={{fontSize:11,color:t.textMuted,marginBottom:4,fontFamily:"Montserrat,Arial,sans-serif"}}>{item.label}</p>
                        <p style={{fontSize:21,fontWeight:800,color:item.color,fontFamily:"Montserrat,Arial,sans-serif"}}>
                          {item.value}<span style={{fontSize:12,fontWeight:400}}>{item.suffix}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                  <p style={{fontSize:11,color:t.textMuted,marginTop:12,fontFamily:"Montserrat,Arial,sans-serif"}}>Illustrative only.</p>
                </section>

                {/* Sensitivity */}
                <section aria-labelledby="sensitivity-heading" style={{marginBottom:28}}>
                  <h3 id="sensitivity-heading" style={{fontSize:14,fontWeight:700,color:t.accent,marginBottom:4,fontFamily:"Montserrat,Arial,sans-serif"}}>Sensitivity analysis — monthly SIP required</h3>
                  <p style={{fontSize:12,color:t.textSub,marginBottom:12,fontFamily:"Montserrat,Arial,sans-serif"}}>How your required SIP changes if returns or inflation differ slightly. Highlighted = your current rates.</p>
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}} aria-label="Sensitivity analysis">
                      <thead><tr>
                        <th scope="col" style={thS}>Return ↓ / Inflation →</th>
                        {result.sensitivity.inflationLabels.map((l:string)=><th scope="col" key={l} style={thS}>Inflation {l}</th>)}
                      </tr></thead>
                      <tbody>
                        {result.sensitivity.table.map((row:number[],i:number)=>(
                          <tr key={i}>
                            <th scope="row" style={{...tdS(false),fontWeight:700,background:t.surfaceAlt}}>Return {result.sensitivity.returnLabels[i]}</th>
                            {row.map((val,j)=>(
                              <td key={j} style={tdS(i===1&&j===1)}>
                                {fmtINR(val)}{i===1&&j===1&&<span className="sr-only"> (your current rates)</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p style={{fontSize:11,color:t.textMuted,marginTop:6,fontFamily:"Montserrat,Arial,sans-serif"}}>All values illustrative.</p>
                </section>

                {/* Chart */}
                <section aria-labelledby="chart-heading" style={{background:t.surface,borderRadius:14,padding:"24px",border:`1px solid ${t.border}`,boxShadow:t.cardShadow,marginBottom:28}}>
                  <h2 id="chart-heading" style={{fontSize:17,fontWeight:800,color:t.accent,marginBottom:4,fontFamily:"Montserrat,Arial,sans-serif"}}>Retirement wealth projection</h2>
                  <p style={{fontSize:12,color:t.textMuted,marginBottom:18,fontFamily:"Montserrat,Arial,sans-serif"}}>Corpus growth during working years, then drawdown during retirement.</p>
                  <RetirementChart timeline={result.timeline} monteCarloFan={result.monteCarloFan} yearsToRetirement={result.yearsToRetirement}/>
                </section>

                <WhatIfSliders results={result} inputs={numericInputs}/>

                <div role="note" style={{marginTop:24,padding:"14px 18px",fontSize:11,color:t.textMuted,borderTop:`1px solid ${t.border}`,lineHeight:1.7,fontFamily:"Montserrat,Arial,sans-serif"}}>
                  * All calculations are illustrative based on assumed rates of return and inflation. Returns are not guaranteed. All assumptions are user-editable and disclosed.
                </div>
              </section>
            )}
          </>
        )}

        {activeTab==="comparison"&&<ComparisonView/>}
        {activeTab==="learn"&&<LearnTab t={t}/>}

      </main>

      {result&&activeTab==="calculator"&&<RetirementChatbot result={result} form={form}/>}

      <div role="contentinfo" aria-label="Legal disclaimer" style={{position:"fixed",bottom:0,left:0,right:0,background:t.disclaimerBg,borderTop:`1px solid ${t.border}`,padding:"7px 24px",fontSize:10,color:t.textMuted,zIndex:998,lineHeight:1.7,fontFamily:"Montserrat,Arial,sans-serif"}}>
        This tool has been designed for information purposes only. Actual results may vary depending on various factors involved in capital market. Investor should not consider above as a recommendation for any schemes of HDFC Mutual Fund. Past performance may or may not be sustained in future and is not a guarantee of any future returns.
      </div>
    </>
  );
}
