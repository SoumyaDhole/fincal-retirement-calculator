"use client";

import { useState, useEffect, useMemo } from "react";
import RetirementChart   from "../components/RetirementChart";
import ComparisonView    from "../components/ComparisonView";
import RetirementChatbot from "../components/RetirementChatbot";
import ReadinessScore    from "../components/ReadinessScore";
import WhatIfSliders     from "../components/WhatIfSliders";

// ─── Theme tokens ─────────────────────────────────────────────
const LIGHT = {
  bg:"#f4f6fb", surface:"#ffffff", surfaceAlt:"#f0f4fb", surfaceCard:"#ffffff",
  border:"#e5e7eb", borderAccent:"#dbe6f5",
  text:"#111827", textSub:"#374151", textMuted:"#6b7280",
  accent:"#224c87", accentGrad:"linear-gradient(135deg,#224c87,#1a3a6b)",
  red:"#da3832", green:"#059669", yellow:"#d97706",
  navBg:"#ffffff", navShadow:"0 1px 12px rgba(0,0,0,0.07)",
  cardShadow:"0 2px 12px rgba(0,0,0,0.05)", inputBg:"#fafafa",
  disclaimerBg:"#f7f9fc", tableSub:"#f9fafb", tableHi:"#eef2ff",
};
const DARK = {
  bg:"#0b0d14", surface:"#131620", surfaceAlt:"#1a1d2a", surfaceCard:"#1a1d2a",
  border:"#252836", borderAccent:"#2c3a5a",
  text:"#f1f5f9", textSub:"#cbd5e1", textMuted:"#64748b",
  accent:"#4f7ec4", accentGrad:"linear-gradient(135deg,#2d5fa3,#224c87)",
  red:"#f87171", green:"#34d399", yellow:"#fbbf24",
  navBg:"#131620", navShadow:"0 1px 12px rgba(0,0,0,0.4)",
  cardShadow:"0 2px 16px rgba(0,0,0,0.35)", inputBg:"#0b0d14",
  disclaimerBg:"#0f1117", tableSub:"#1a1d2a", tableHi:"rgba(79,126,196,0.14)",
};
type Theme = typeof LIGHT;

interface FormState {
  currentAge:string; retirementAge:string; lifeExpectancy:string;
  monthlyExpense:string; inflationRate:string; preReturn:string;
  postReturn:string; stepUpRate:string; existingCorpus:string; lumpSumWithdrawal:string;
}

const PERSONAS = [
  {label:"Fresh Graduate",icon:"🎓",desc:"Age 22 · ₹30k/mo",values:{currentAge:"22",retirementAge:"60",lifeExpectancy:"85",monthlyExpense:"30000",inflationRate:"6",preReturn:"12",postReturn:"7",stepUpRate:"10",existingCorpus:"0",lumpSumWithdrawal:"0"}},
  {label:"Mid-career",    icon:"💼",desc:"Age 35 · ₹80k/mo",values:{currentAge:"35",retirementAge:"60",lifeExpectancy:"85",monthlyExpense:"80000",inflationRate:"6",preReturn:"10",postReturn:"7",stepUpRate:"8", existingCorpus:"500000",lumpSumWithdrawal:"0"}},
  {label:"Late Starter",  icon:"⏰",desc:"Age 45 · ₹1.5L/mo",values:{currentAge:"45",retirementAge:"62",lifeExpectancy:"85",monthlyExpense:"150000",inflationRate:"6",preReturn:"9",postReturn:"7",stepUpRate:"5",existingCorpus:"2000000",lumpSumWithdrawal:"0"}},
] as const;

const SCENARIOS = {
  conservative:{preReturn:"7", postReturn:"5",label:"Conservative",icon:"🛡",desc:"Lower risk"},
  moderate:    {preReturn:"10",postReturn:"7",label:"Moderate",     icon:"⚖",desc:"Balanced"},
  aggressive:  {preReturn:"12",postReturn:"9",label:"Aggressive",   icon:"🚀",desc:"High growth"},
} as const;

const FIELD_EDU:Record<string,{why:string;eg:string}> = {
  currentAge:    {why:"Earlier you start, less you need monthly — compounding works longer.",eg:"Starting at 25 vs 35 can halve your required SIP."},
  retirementAge: {why:"More working years = larger corpus, fewer retirement years to fund.",eg:"Retiring at 60 vs 55 reduces SIP by 30–40%."},
  lifeExpectancy:{why:"Plan long — running out of money is riskier than having surplus.",eg:"Planning to 90 vs 80 adds a 10-year safety buffer."},
  monthlyExpense:{why:"Your current lifestyle, inflated forward to estimate future needs.",eg:"₹50k/month today ≈ ₹1.6L/month in 30 years at 6% inflation."},
  existingCorpus:{why:"Savings already invested reduce new SIP needed.",eg:"₹5L today at 10% becomes ~₹87L in 30 years."},
  inflationRate: {why:"Inflation erodes purchasing power. India avg 5–7%.",eg:"At 6%, ₹1,000 today costs ₹1,791 in 10 years."},
  preReturn:     {why:"Return on your investments during working years.",eg:"Large-cap equity historically returned 10–14% over 10+ years."},
  postReturn:    {why:"Post-retirement investments are safer, lower returns.",eg:"Debt/balanced funds typically return 6–8%."},
  stepUpRate:    {why:"Raising SIP by 10–15%/year cuts starting SIP dramatically.",eg:"10% step-up reduces starting SIP by ~35% vs flat SIP."},
  lumpSumWithdrawal:{why:"A one-time amount you want to withdraw on retirement day — for a house purchase, child's wedding, travel etc.",eg:"If corpus is Rs.13 Cr and you withdraw Rs.3 Cr, remaining Rs.10 Cr funds your monthly expenses."},
};

// ─── Tour steps — split into pre-results and post-results ─────
// requiresResults:true steps only show after the user has calculated
const TOUR_ALL = [
  {anchor:"darkmode-btn", pos:"bl", icon:"🌓", title:"Light & Dark Mode",     desc:"Toggle the ☀️/🌙 switch in the top-right corner to switch themes anytime. Dark mode looks great for presentations!", requiresResults:false},
  {anchor:"tour-btn",     pos:"bl", icon:"❓", title:"Guided Tour Button",     desc:"Click this ❓ button anytime to restart this tour and revisit how each feature works.", requiresResults:false},
  {anchor:"persona-sec",  pos:"br", icon:"🎓", title:"Quick Start Profiles",  desc:"New here? Click a profile like \"Fresh Graduate\" or \"Mid-career\" to auto-fill all fields with realistic values instantly.", requiresResults:false},
  {anchor:"form-sec",     pos:"br", icon:"💡", title:"Learn As You Fill",      desc:"See the ? next to every input? Click it for a plain-English explanation of what that field means and a real-world example.", requiresResults:false},
  {anchor:"calc-btn",     pos:"tr", icon:"🧮", title:"Calculate Your Plan",   desc:"After filling your details, click this button. You'll get your corpus, SIP, Monte Carlo success %, journey timeline, and more.", requiresResults:false},
  {anchor:"compare-tab",  pos:"br", icon:"⚖", title:"Compare Scenarios",      desc:"Use the Compare tab to run two scenarios side-by-side — great for comparing Conservative vs Aggressive investment styles.", requiresResults:false},
  {anchor:"learn-tab",    pos:"br", icon:"📚", title:"Learn Tab",             desc:"Never heard of Monte Carlo or retirement corpus? Visit Learn for beginner-friendly explainers on every concept used here.", requiresResults:false},
  // These steps require results to be visible — shown only after Calculate is clicked
  {anchor:"results-section", pos:"br", icon:"📊", title:"Your Results",       desc:"Here's your full retirement plan — corpus, monthly SIP, Monte Carlo probability, journey timeline and more.", requiresResults:true},
  {anchor:"pdf-btn",      pos:"tr", icon:"⬇", title:"Download PDF Report",    desc:"Click here to save a branded, compliance-ready PDF of your full retirement plan that you can share or keep.", requiresResults:true},
];

type NavTab = "calculator"|"comparison"|"learn";

function fmtINR(n:number){if(n>=1e7)return"₹"+(n/1e7).toFixed(2)+" Cr";if(n>=1e5)return"₹"+(n/1e5).toFixed(1)+" L";return"₹"+Math.round(n).toLocaleString("en-IN");}
function getRisk(p:number){if(p>=80)return{label:"SAFE",bg:"rgba(52,211,153,0.12)",color:"#34d399",border:"rgba(52,211,153,0.3)"};if(p>=50)return{label:"MODERATE",bg:"rgba(251,191,36,0.12)",color:"#fbbf24",border:"rgba(251,191,36,0.3)"};return{label:"RISKY",bg:"rgba(248,113,113,0.12)",color:"#f87171",border:"rgba(248,113,113,0.3)"};}

// ─── Tooltip Tour ─────────────────────────────────────────────
function TourTooltip({step,onNext,onSkip,total,t,steps}:{step:number;onNext:()=>void;onSkip:()=>void;total:number;t:Theme;steps:typeof TOUR_ALL}) {
  const s = steps[step];
  const [rect, setRect] = useState<{top:number;left:number;width:number;height:number}|null>(null);

  useEffect(()=>{
    const update = () => {
      const el = document.getElementById(s.anchor);
      if(!el){setRect(null);return;}
      const r = el.getBoundingClientRect();
      const scrollY = window.scrollY;
      setRect({top:r.top+scrollY,left:r.left,width:r.width,height:r.height});
      el.scrollIntoView({behavior:"smooth",block:"nearest",inline:"nearest"});
    };
    update();
    const t2 = setTimeout(update, 300);
    return ()=>clearTimeout(t2);
  },[step, s.anchor]);

  const tooltipW = 290;
  let tipTop = 0, tipLeft = 0;
  if(rect){
    if(s.pos==="bl"||s.pos==="br"){
      tipTop = rect.top + rect.height + 12;
      tipLeft = s.pos==="bl" ? rect.left : Math.max(8, rect.left + rect.width - tooltipW);
    } else {
      tipTop = rect.top - 150;
      tipLeft = Math.max(8, rect.left + rect.width - tooltipW);
    }
    tipLeft = Math.max(8, Math.min(tipLeft, window.innerWidth - tooltipW - 8));
  }

  return (
    <>
      <div style={{position:"fixed",inset:0,zIndex:8990,background:"rgba(0,0,0,0.4)",pointerEvents:"none"}}/>
      {rect&&(
        <div style={{position:"absolute",top:rect.top-5,left:rect.left-5,width:rect.width+10,height:rect.height+10,borderRadius:10,border:"2.5px solid #4f7ec4",boxShadow:"0 0 0 5px rgba(79,126,196,0.25)",zIndex:8995,pointerEvents:"none",animation:"glowPulse 1.5s ease-in-out infinite"}}/>
      )}
      {rect&&(
        <div style={{position:"absolute",top:tipTop,left:tipLeft,zIndex:9000,width:tooltipW,background:t.surfaceCard,borderRadius:14,padding:"16px 18px",boxShadow:"0 8px 40px rgba(0,0,0,0.35)",border:`2px solid ${t.accent}`,animation:"tooltipPop 0.25s cubic-bezier(0.34,1.56,0.64,1)"}}>
          <div style={{position:"absolute",top:-9,left:18,width:16,height:16,background:t.surfaceCard,border:`2px solid ${t.accent}`,borderRight:"none",borderBottom:"none",transform:"rotate(45deg)"}}/>
          <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:10}}>
            <div style={{width:36,height:36,borderRadius:9,background:t.surfaceAlt,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{s.icon}</div>
            <div style={{flex:1}}>
              {/* FIX font size: was 14px, keeping at 12px */}
              <div style={{fontSize:12,color:t.textMuted,fontFamily:"Montserrat,Arial,sans-serif",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.5px",marginBottom:3}}>Step {step+1} of {total}</div>
              <div style={{fontSize:15,fontWeight:800,color:t.text,fontFamily:"Montserrat,Arial,sans-serif",lineHeight:1.2}}>{s.title}</div>
            </div>
          </div>
          {/* FIX: Georgia removed → Arial */}
          <p style={{fontSize:13,color:t.textSub,lineHeight:1.6,fontFamily:"Arial,sans-serif",marginBottom:14}}>{s.desc}</p>
          <div style={{height:3,background:t.border,borderRadius:2,marginBottom:14}}>
            <div style={{width:`${((step+1)/total)*100}%`,height:"100%",background:t.accentGrad,borderRadius:2,transition:"width 0.3s"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <button onClick={onSkip} style={{background:"transparent",border:"none",fontSize:13,color:t.textMuted,cursor:"pointer",fontFamily:"Montserrat,Arial,sans-serif"}}>Skip tour</button>
            <button onClick={onNext} style={{background:t.accentGrad,border:"none",borderRadius:8,padding:"8px 18px",fontSize:13,color:"#fff",cursor:"pointer",fontFamily:"Montserrat,Arial,sans-serif",fontWeight:700}}>
              {step===total-1?"Done ✓":"Next →"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Field ────────────────────────────────────────────────────
function Field({label,name,value,onChange,onBlurClamp,hint,fieldKey,min,t}:{
  label:string;name:string;value:string;
  onChange:(e:React.ChangeEvent<HTMLInputElement>)=>void;
  onBlurClamp?:(name:string,min:number)=>void;
  hint?:string;fieldKey?:string;min?:number;t:Theme
}) {
  const [showEdu,setShowEdu]=useState(false);
  const edu=fieldKey?FIELD_EDU[fieldKey]:null;
  return (
    <div style={{position:"relative"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
        {/* FIX font size: was 17px → 14px */}
        <label htmlFor={`f-${name}`} style={{fontSize:14,fontWeight:700,color:t.textSub,fontFamily:"Montserrat,Arial,sans-serif"}}>{label}</label>
        {edu&&<button type="button" onClick={()=>setShowEdu(v=>!v)} aria-expanded={showEdu} suppressHydrationWarning
          style={{background:showEdu?t.accent:"transparent",border:`1px solid ${t.borderAccent}`,borderRadius:"50%",width:22,height:22,fontSize:13,fontWeight:700,color:showEdu?"#fff":t.accent,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>?</button>}
      </div>
      {/* FIX font size: was 16px → 13px */}
      {hint&&<p style={{fontSize:13,color:t.textMuted,marginBottom:5,fontFamily:"Montserrat,Arial,sans-serif"}}>{hint}</p>}
      <input
        id={`f-${name}`}
        type="number"
        name={name}
        value={value}
        min={min ?? 0}
        onChange={onChange}
        onBlur={()=>{ if(onBlurClamp && min!==undefined) onBlurClamp(name, min); }}
        suppressHydrationWarning
        style={{width:"100%",padding:"11px 13px",border:`1.5px solid ${t.border}`,borderRadius:9,fontSize:15,color:t.text,fontFamily:"Montserrat,Arial,sans-serif",background:t.inputBg,outline:"none",transition:"border-color 0.15s",boxSizing:"border-box" as const}}
        onFocus={e=>e.target.style.borderColor=t.accent}
      />
      {showEdu&&edu&&(
        <div style={{position:"absolute",left:0,right:0,top:"100%",zIndex:30,background:"#1e293b",borderRadius:10,padding:"13px 15px",boxShadow:"0 8px 32px rgba(0,0,0,0.4)",marginTop:4,border:"1px solid #334155"}}>
          {/* FIX font size: was 16px → 13px */}
          <div style={{fontSize:13,fontWeight:700,color:"#93c5fd",marginBottom:6,fontFamily:"Montserrat,Arial,sans-serif"}}>Why this matters</div>
          {/* FIX: Georgia removed → Arial */}
          <p style={{fontSize:13,color:"#e2e8f0",marginBottom:8,lineHeight:1.6,fontFamily:"Arial,sans-serif"}}>{edu.why}</p>
          <div style={{fontSize:13,fontWeight:700,color:"#86efac",marginBottom:4,fontFamily:"Montserrat,Arial,sans-serif"}}>Example</div>
          {/* FIX: Georgia removed → Arial */}
          <p style={{fontSize:13,color:"#bbf7d0",lineHeight:1.6,fontFamily:"Arial,sans-serif"}}>{edu.eg}</p>
        </div>
      )}
    </div>
  );
}

// ─── ResultCard ───────────────────────────────────────────────
function ResultCard({title,value,sub,highlight,color,icon,t}:{title:string;value:string;sub?:string;highlight?:boolean;color?:string;icon?:string;t:Theme}) {
  return (
    <div style={{padding:"16px 18px",borderRadius:12,border:highlight?`2px solid ${t.accent}`:`1px solid ${t.border}`,background:highlight?t.surfaceAlt:t.surfaceCard,boxShadow:t.cardShadow,position:"relative",overflow:"hidden",transition:"transform 0.2s,box-shadow 0.2s"}}
      onMouseEnter={e=>{const d=e.currentTarget as HTMLDivElement;d.style.transform="translateY(-2px)";d.style.boxShadow="0 6px 20px rgba(0,0,0,0.15)";}}
      onMouseLeave={e=>{const d=e.currentTarget as HTMLDivElement;d.style.transform="translateY(0)";d.style.boxShadow=t.cardShadow;}}>
      {highlight&&<div style={{position:"absolute",top:0,left:0,right:0,height:3,background:t.accentGrad}}/>}
      {/* FIX font size: was 15px → 12px */}
      <p style={{fontSize:12,color:t.textMuted,marginBottom:6,fontFamily:"Montserrat,Arial,sans-serif",fontWeight:700,textTransform:"uppercase" as const,letterSpacing:"0.6px"}}>{icon&&<span style={{marginRight:5}}>{icon}</span>}{title}</p>
      {/* FIX font size: was 28px → 22px */}
      <p style={{fontSize:22,fontWeight:800,color:color??t.accent,lineHeight:1.2,fontFamily:"Montserrat,Arial,sans-serif"}}>{value}</p>
      {/* FIX font size: was 16px → 13px */}
      {sub&&<p style={{fontSize:13,color:t.textMuted,marginTop:5,fontFamily:"Montserrat,Arial,sans-serif"}}>{sub}</p>}
    </div>
  );
}

// ─── BucketCard ───────────────────────────────────────────────
function BucketCard({label,value,rate,color,pct,icon,t}:{label:string;value:string;rate:string;color:string;pct:string;icon:string;t:Theme}) {
  return (
    <div style={{padding:"16px 18px",borderRadius:12,border:`1.5px solid ${color}30`,background:t.surfaceCard,boxShadow:t.cardShadow,transition:"transform 0.2s"}}
      onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.transform="translateY(-2px)"}
      onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.transform="translateY(0)"}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <span style={{fontSize:22}}>{icon}</span>
        {/* FIX font size: was 15px → 12px */}
        <span style={{fontSize:12,fontWeight:700,color:"#fff",background:color,padding:"3px 10px",borderRadius:20,fontFamily:"Montserrat,Arial,sans-serif"}}>{pct}</span>
      </div>
      {/* FIX font size: was 18px → 14px */}
      <p style={{fontSize:14,fontWeight:700,color:t.text,marginBottom:5,fontFamily:"Montserrat,Arial,sans-serif"}}>{label}</p>
      {/* FIX font size: was 26px → 20px */}
      <p style={{fontSize:20,fontWeight:800,color,fontFamily:"Montserrat,Arial,sans-serif"}}>{value}</p>
      {/* FIX font size: was 16px → 13px */}
      <p style={{fontSize:13,color:t.textMuted,marginTop:4,fontFamily:"Montserrat,Arial,sans-serif"}}>Assumed {rate} p.a.</p>
    </div>
  );
}

// ─── Interactive Timeline ─────────────────────────────────────
function InteractiveTimeline({result,form,t}:{result:any;form:FormState;t:Theme}) {
  const currentAge=Number(form.currentAge),retireAge=Number(form.retirementAge),lifeExp=Number(form.lifeExpectancy);
  const [sliderAge,setSliderAge]=useState(currentAge+Math.round((retireAge-currentAge)/2));
  const timelineMap=useMemo(()=>{const m:Record<number,number>={};(result.timeline||[]).forEach((pt:any)=>{m[pt.age]=Math.max(0,pt.corpus);});return m;},[result.timeline]);
  const getCorpus=(age:number)=>{
    if(timelineMap[age]!==undefined)return timelineMap[age];
    const ages=Object.keys(timelineMap).map(Number).sort((a,b)=>a-b);
    const lo=ages.filter(a=>a<=age).pop();const hi=ages.find(a=>a>age);
    if(!lo)return timelineMap[ages[0]]??0;if(!hi)return timelineMap[ages[ages.length-1]]??0;
    return timelineMap[lo]+(age-lo)/(hi-lo)*(timelineMap[hi]-timelineMap[lo]);
  };
  const corpus=Math.max(0,getCorpus(sliderAge));
  const maxCorpus=Math.max(...Object.values(timelineMap));
  const phase=sliderAge<retireAge?"accumulation":"withdrawal";
  const phaseColor=phase==="accumulation"?"#4f7ec4":t.red;
  const pct=((sliderAge-currentAge)/(lifeExp-currentAge))*100;
  return (
    <section aria-labelledby="itl-h" style={{background:t.surfaceCard,borderRadius:14,padding:"22px 24px",border:`1px solid ${t.border}`,boxShadow:t.cardShadow,marginBottom:28}}>
      {/* FIX font size: was 20px → 16px */}
      <h3 id="itl-h" style={{fontSize:16,fontWeight:800,color:t.accent,marginBottom:4,fontFamily:"Montserrat,Arial,sans-serif"}}>📍 Your Retirement Journey</h3>
      {/* FIX font size: was 17px → 13px */}
      <p style={{fontSize:13,color:t.textMuted,marginBottom:18,fontFamily:"Montserrat,Arial,sans-serif"}}>Drag the slider to explore your estimated corpus at any age.</p>
      <div style={{background:t.surfaceAlt,borderRadius:12,padding:"16px 20px",marginBottom:18,border:`2px solid ${phaseColor}30`,display:"flex",flexWrap:"wrap" as const,gap:18,alignItems:"center"}}>
        <div style={{textAlign:"center" as const,minWidth:90}}>
          {/* FIX font size: was 34px → 26px */}
          <div style={{fontSize:26,fontWeight:800,color:phaseColor,fontFamily:"Montserrat,Arial,sans-serif",lineHeight:1}}>Age {sliderAge}</div>
          {/* FIX font size: was 15px → 12px */}
          <div style={{fontSize:12,color:t.textMuted,marginTop:4,fontFamily:"Montserrat,Arial,sans-serif",textTransform:"uppercase" as const,letterSpacing:"0.5px",fontWeight:600}}>{phase==="accumulation"?"Building wealth":"Drawing down"}</div>
        </div>
        <div style={{width:1,height:48,background:t.border,flexShrink:0}}/>
        <div style={{flex:1,minWidth:160}}>
          {/* FIX font size: was 16px → 13px */}
          <div style={{fontSize:13,color:t.textMuted,fontFamily:"Montserrat,Arial,sans-serif",marginBottom:3,fontWeight:600}}>Estimated corpus</div>
          {/* FIX font size: was 30px → 22px */}
          <div style={{fontSize:22,fontWeight:800,color:phaseColor,fontFamily:"Montserrat,Arial,sans-serif"}}>{fmtINR(Math.round(corpus))}</div>
        </div>
        {phase==="accumulation"&&<><div style={{width:1,height:48,background:t.border,flexShrink:0}}/><div>
          {/* FIX font size: was 16px → 13px */}
          <div style={{fontSize:13,color:t.textMuted,fontFamily:"Montserrat,Arial,sans-serif",marginBottom:3,fontWeight:600}}>{retireAge-sliderAge} years to retirement</div>
          {/* FIX font size: was 19px → 15px */}
          <div style={{fontSize:15,fontWeight:700,color:t.accent,fontFamily:"Montserrat,Arial,sans-serif"}}>SIP: {fmtINR(result.monthlySIP)}/mo</div>
        </div></>}
        {phase==="withdrawal"&&<><div style={{width:1,height:48,background:t.border,flexShrink:0}}/><div>
          <div style={{fontSize:13,color:t.textMuted,fontFamily:"Montserrat,Arial,sans-serif",marginBottom:3,fontWeight:600}}>Monthly withdrawal</div>
          <div style={{fontSize:15,fontWeight:700,color:t.red,fontFamily:"Montserrat,Arial,sans-serif"}}>{fmtINR(result.futureMonthlyExpense)}/mo</div>
        </div></>}
      </div>
      <div style={{marginBottom:10}}>
        {/* FIX font size: was 15px → 12px */}
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:t.textMuted,marginBottom:4,fontFamily:"Montserrat,Arial,sans-serif",fontWeight:600}}><span>₹0</span><span>Peak: {fmtINR(maxCorpus)}</span></div>
        <div style={{height:10,background:t.border,borderRadius:5,overflow:"hidden"}}><div style={{width:`${Math.min(100,(corpus/maxCorpus)*100)}%`,height:"100%",background:`linear-gradient(90deg,${phaseColor}88,${phaseColor})`,borderRadius:5,transition:"width 0.1s"}}/></div>
      </div>
      <div style={{position:"relative",marginTop:32,marginBottom:8}}>
        {[{age:currentAge,label:"Start",color:"#4f7ec4"},{age:retireAge,label:"Retirement",color:t.green},{age:lifeExp,label:"Life exp.",color:t.red}].map(m=>(
          <div key={m.age} style={{position:"absolute",top:-22,left:`${((m.age-currentAge)/(lifeExp-currentAge))*100}%`,transform:"translateX(-50%)",fontSize:12,color:m.color,fontWeight:700,fontFamily:"Montserrat,Arial,sans-serif",whiteSpace:"nowrap" as const}}>{m.label}</div>
        ))}
        <div style={{height:6,background:t.border,borderRadius:3}}><div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${t.accent},${t.green})`,borderRadius:3,transition:"width 0.05s"}}/></div>
        {[{age:currentAge,color:"#4f7ec4"},{age:retireAge,color:t.green},{age:lifeExp,color:t.red}].map(m=>(
          <div key={m.age} style={{position:"absolute",top:0,left:`${((m.age-currentAge)/(lifeExp-currentAge))*100}%`,transform:"translateX(-50%)",width:3,height:14,background:m.color,borderRadius:2,marginTop:-4}}/>
        ))}
        <input type="range" min={currentAge} max={lifeExp} step={1} value={sliderAge} onChange={e=>setSliderAge(Number(e.target.value))} aria-label="Explore corpus by age" suppressHydrationWarning
          style={{position:"absolute",left:0,top:-6,width:"100%",opacity:0,height:22,cursor:"pointer",margin:0}}/>
      </div>
      {/* FIX font size: was 16px → 13px */}
      <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:t.textMuted,fontFamily:"Montserrat,Arial,sans-serif",fontWeight:500}}><span>Age {currentAge}</span><span style={{color:t.accent,fontWeight:600}}>← Drag to explore →</span><span>Age {lifeExp}</span></div>
    </section>
  );
}

// ─── SIP vs Lumpsum ───────────────────────────────────────────
function SIPLumpsumToggle({result,form,t}:{result:any;form:FormState;t:Theme}) {
  const [mode,setMode]=useState<"sip"|"lumpsum">("sip");
  const preReturn=Number(form.preReturn)/100;
  const lumpsumNow=result.requiredCorpus/Math.pow(1+preReturn,result.yearsToRetirement);
  const totalInvested=result.monthlySIP*result.yearsToRetirement*12;
  const returns=Math.max(0,result.requiredCorpus-totalInvested);
  return (
    <div style={{background:t.surfaceCard,borderRadius:14,padding:"18px 22px",border:`1px solid ${t.border}`,boxShadow:t.cardShadow,marginBottom:28}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap" as const,gap:10}}>
        <div>
          {/* FIX font size: was 19px → 15px */}
          <h3 style={{fontSize:15,fontWeight:800,color:t.accent,fontFamily:"Montserrat,Arial,sans-serif",margin:0}}>SIP vs Lumpsum Comparison</h3>
          {/* FIX font size: was 16px → 13px */}
          <p style={{fontSize:13,color:t.textMuted,fontFamily:"Montserrat,Arial,sans-serif",marginTop:3}}>Two paths to the same retirement corpus</p>
        </div>
        <div style={{display:"flex",background:t.surfaceAlt,borderRadius:8,padding:3,gap:3}}>
          {(["sip","lumpsum"] as const).map(m=>(
            <button key={m} onClick={()=>setMode(m)} style={{padding:"6px 15px",borderRadius:6,border:"none",cursor:"pointer",fontSize:13,fontWeight:mode===m?700:500,background:mode===m?t.accent:"transparent",color:mode===m?"#fff":t.textSub,fontFamily:"Montserrat,Arial,sans-serif",transition:"all 0.15s"}}>
              {m==="sip"?"Monthly SIP":"Lumpsum Today"}
            </button>
          ))}
        </div>
      </div>
      {mode==="sip"?(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10}}>
          {[{label:"Monthly investment",value:fmtINR(result.monthlySIP),color:t.accent},{label:"Total invested",value:fmtINR(totalInvested),color:t.textSub},{label:"Estimated returns",value:fmtINR(returns),color:t.green},{label:"Final corpus",value:fmtINR(result.requiredCorpus),color:t.green}].map(c=>(
            <div key={c.label} style={{background:t.surfaceAlt,borderRadius:10,padding:"12px 14px",border:`1px solid ${t.border}`}}>
              {/* FIX font size: was 14px → 11px */}
              <div style={{fontSize:11,color:t.textMuted,textTransform:"uppercase" as const,letterSpacing:"0.6px",marginBottom:4,fontFamily:"Montserrat,Arial,sans-serif",fontWeight:600}}>{c.label}</div>
              {/* FIX font size: was 23px → 18px */}
              <div style={{fontSize:18,fontWeight:800,color:c.color,fontFamily:"Montserrat,Arial,sans-serif"}}>{c.value}</div>
            </div>
          ))}
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10}}>
          {[{label:"Lumpsum invest today",value:fmtINR(lumpsumNow),color:t.accent},{label:"Grows to (corpus)",value:fmtINR(result.requiredCorpus),color:t.green},{label:"Years to grow",value:`${result.yearsToRetirement} yrs`,color:t.textSub},{label:"Assumed return",value:`${form.preReturn}% p.a.`,color:t.textSub}].map(c=>(
            <div key={c.label} style={{background:t.surfaceAlt,borderRadius:10,padding:"12px 14px",border:`1px solid ${t.border}`}}>
              <div style={{fontSize:11,color:t.textMuted,textTransform:"uppercase" as const,letterSpacing:"0.6px",marginBottom:4,fontFamily:"Montserrat,Arial,sans-serif",fontWeight:600}}>{c.label}</div>
              <div style={{fontSize:18,fontWeight:800,color:c.color,fontFamily:"Montserrat,Arial,sans-serif"}}>{c.value}</div>
            </div>
          ))}
        </div>
      )}
      {/* FIX font size: was 15px → 12px */}
      <p style={{fontSize:12,color:t.textMuted,marginTop:10,fontFamily:"Montserrat,Arial,sans-serif"}}>* Illustrative only. Lumpsum uses same pre-retirement return assumption.</p>
    </div>
  );
}

// ─── PDF Export ───────────────────────────────────────────────
function PDFExportButton({result,inputs,t}:{result:any;inputs:any;t:Theme}) {
  const [loading,setLoading]=useState(false);
  const generate=async()=>{
    setLoading(true);
    try{
      const jsPDFModule=await import("jspdf");
      const jsPDF=jsPDFModule.default;
      const doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
      const W=210,M=14,PH=297; // page width, margin, page height
      const B:[number,number,number]=[34,76,135];
      const R:[number,number,number]=[218,56,50];
      const GR:[number,number,number]=[42,120,50];
      const SL:[number,number,number]=[100,116,139];
      const W3:[number,number,number]=[255,255,255];
      const BG:[number,number,number]=[245,248,253];
      const DK:[number,number,number]=[17,24,39];
      const rs=(s:string)=>s.replace(/₹/g,"Rs.");
      let y=0;

      // ── helper: add new page + mini header if content would overflow ──
      const need=(h:number)=>{
        if(y+h>PH-32){ // 32mm reserved for footer
          // draw footer on current page first
          drawFooter();
          doc.addPage();
          // mini header on continuation page
          doc.setFillColor(...B);doc.rect(0,0,W,12,"F");
          doc.setTextColor(...W3);doc.setFont("helvetica","bold");doc.setFontSize(7);
          doc.text("OPTIWEALTH  |  FinCal Retirement Report  |  Technex'26",M,8);
          y=18;
        }
      };

      // ── footer drawer (called before each new page and at end) ────────
      const drawFooter=()=>{
        const fy=PH-28;
        doc.setFillColor(...B);doc.rect(0,fy,W,28,"F");
        doc.setTextColor(...W3);doc.setFont("helvetica","normal");doc.setFontSize(6);
        doc.text(
          "This tool has been designed for information purposes only. Actual results may vary depending on various factors involved in "+
          "capital market. Investor should not consider above as a recommendation for any schemes of HDFC Mutual Fund. "+
          "Past performance may or may not be sustained in future and is not a guarantee of any future returns.",
          M,fy+7,{maxWidth:W-M*2}
        );
        doc.setFont("helvetica","bold");doc.setFontSize(7.5);
        doc.text("Optiwealth  |  FinCal  |  HDFC Mutual Fund  |  Technex'26, IIT (BHU) Varanasi",W/2,fy+21,{align:"center"});
      };

      // ── HEADER BAND ──────────────────────────────────────────────────
      doc.setFillColor(...B);doc.rect(0,0,W,44,"F");
      doc.setTextColor(...W3);
      doc.setFont("helvetica","bold");doc.setFontSize(8);doc.text("OPTIWEALTH",M,10);
      doc.setFontSize(22);doc.text("FinCal",M,24);
      doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.text("Retirement Planning Report",M,32);
      const dateStr=new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
      doc.text(`Generated: ${dateStr}`,W-M,10,{align:"right"});
      doc.text("Co-sponsored by HDFC Mutual Fund",W-M,18,{align:"right"});
      doc.text("Technex'26 | IIT (BHU) Varanasi",W-M,25,{align:"right"});
      y=50;

      // ── YOUR PROFILE BOX ─────────────────────────────────────────────
      need(34);
      doc.setFillColor(...BG);doc.roundedRect(M,y,W-M*2,34,3,3,"F");
      doc.setTextColor(...B);doc.setFont("helvetica","bold");doc.setFontSize(10);
      doc.text("Your Profile",M+6,y+8);
      doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(...DK);
      const c1=M+6,c2=M+50,c3=M+98,c4=M+148;
      doc.text(`Current Age: ${inputs.currentAge}`,c1,y+17);
      doc.text(`Retirement Age: ${inputs.retirementAge}`,c2,y+17);
      doc.text(`Life Expectancy: ${inputs.lifeExpectancy}`,c3,y+17);
      doc.text(`Inflation: ${(inputs.inflationRate*100).toFixed(1)}%`,c4,y+17);
      doc.text(`Monthly Exp: ${rs(fmtINR(inputs.monthlyExpense))}`,c1,y+26);
      doc.text(`Pre-ret Return: ${(inputs.preReturn*100).toFixed(1)}%`,c2,y+26);
      doc.text(`Post-ret Return: ${(inputs.postReturn*100).toFixed(1)}%`,c3,y+26);
      doc.text(`Years to Retire: ${result.yearsToRetirement}`,c4,y+26);
      y+=40;

      // ── KEY RESULTS ───────────────────────────────────────────────────
      need(70);
      doc.setTextColor(...B);doc.setFont("helvetica","bold");doc.setFontSize(10);
      doc.text("Key Results",M,y+7);y+=12;
      const cw=(W-M*2-12)/4;
      const drawCard=(x:number,cy:number,w:number,h:number,lbl:string,val:string,col:[number,number,number])=>{
        doc.setFillColor(252,252,255);
        doc.setDrawColor(...col);doc.setLineWidth(0.5);
        doc.roundedRect(x,cy,w,h,2,2,"FD");
        doc.setFillColor(...col);doc.rect(x,cy,3,h,"F");
        doc.setTextColor(...SL);doc.setFont("helvetica","normal");doc.setFontSize(6);
        doc.text(lbl.toUpperCase(),x+6,cy+7,{maxWidth:w-9});
        doc.setTextColor(...col);doc.setFont("helvetica","bold");doc.setFontSize(11);
        doc.text(rs(val),x+6,cy+16,{maxWidth:w-9});
      };
      const successCol:[number,number,number]=result.successProbability>=75?GR:R;
      [{lbl:"Required Corpus",val:fmtINR(result.requiredCorpus),col:B},
       {lbl:"Monthly SIP",val:fmtINR(result.monthlySIP),col:B},
       {lbl:"Success Prob.",val:`${result.successProbability.toFixed(1)}%`,col:successCol},
       {lbl:"Corpus Lasts",val:`${result.yearsCorpusLasts} yrs`,col:B}]
      .forEach((c,i)=>drawCard(M+i*(cw+4),y,cw,22,c.lbl,c.val,c.col));
      y+=27;
      if(result.monthlyStepUpSIP){
        need(27);
        [{lbl:"Step-Up SIP",val:fmtINR(result.monthlyStepUpSIP),col:B},
         {lbl:"Future Expense",val:fmtINR(result.futureMonthlyExpense),col:SL},
         {lbl:"Today's Equiv.",val:fmtINR(result.monthlyIncomeInTodaysMoney),col:SL},
         {lbl:"Yrs to Retire",val:`${result.yearsToRetirement} yrs`,col:B}]
        .forEach((c,i)=>drawCard(M+i*(cw+4),y,cw,22,c.lbl,c.val,c.col));
        y+=27;
      }

      // ── EXPENSE BREAKDOWN ─────────────────────────────────────────────
      need(62);
      doc.setTextColor(...B);doc.setFont("helvetica","bold");doc.setFontSize(10);
      doc.text("Expense Breakdown at Retirement",M,y+7);y+=12;
      [{lbl:"General Living (6%)",val:result.expenseBuckets.general,pct:60,col:B},
       {lbl:"Medical & Health (8%)",val:result.expenseBuckets.medical,pct:25,col:R},
       {lbl:"Lifestyle & Travel (4%)",val:result.expenseBuckets.lifestyle,pct:15,col:GR}]
      .forEach((b,i)=>{
        const by=y+i*15;
        doc.setTextColor(...DK);doc.setFont("helvetica","normal");doc.setFontSize(8.5);
        doc.text(b.lbl,M,by+5);
        doc.text(rs(fmtINR(b.val)),W-M,by+5,{align:"right"});
        doc.setFillColor(230,236,245);doc.rect(M,by+7,W-M*2,3.5,"F");
        doc.setFillColor(...b.col);doc.rect(M,by+7,(W-M*2)*(b.pct/100),3.5,"F");
      });
      y+=52;

      // ── COST OF WAITING ───────────────────────────────────────────────
      need(36);
      doc.setFillColor(255,245,245);doc.roundedRect(M,y,W-M*2,32,3,3,"F");
      doc.setDrawColor(...R);doc.setLineWidth(0.4);doc.roundedRect(M,y,W-M*2,32,3,3,"D");
      doc.setTextColor(...R);doc.setFont("helvetica","bold");doc.setFontSize(9.5);
      doc.text(`Cost of Waiting ${result.regret.delayYears} Years`,M+6,y+9);
      doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(...DK);
      doc.text(`SIP if start now:   ${rs(fmtINR(result.regret.sipIfStartNow))}/mo`,M+6,y+17);
      doc.text(`SIP if wait ${result.regret.delayYears} yrs: ${rs(fmtINR(result.regret.sipIfDelayed))}/mo`,M+6,y+24);
      doc.text(`Extra per month: ${rs(fmtINR(result.regret.extraMonthlySIP))}/mo`,W/2+6,y+17);
      doc.text(`Total extra paid: ${rs(fmtINR(result.regret.extraTotalPaid))}`,W/2+6,y+24);
      y+=37;

      // ── ASSUMPTIONS ───────────────────────────────────────────────────
      need(22);
      doc.setFillColor(...BG);doc.roundedRect(M,y,W-M*2,20,3,3,"F");
      doc.setTextColor(...SL);doc.setFont("helvetica","bold");doc.setFontSize(7);
      doc.text("ASSUMPTIONS DISCLOSED",M+6,y+7);
      doc.setFont("helvetica","normal");doc.setFontSize(6.5);doc.setTextColor(...DK);
      doc.text(
        `Pre-ret: ${(inputs.preReturn*100).toFixed(1)}%  |  Post-ret: ${(inputs.postReturn*100).toFixed(1)}%  |  ` +
        `General inflation: 6%  |  Medical inflation: 8%  |  Lifestyle inflation: 4%  |  Monte Carlo: 1,000 sims`,
        M+6,y+14,{maxWidth:W-M*2-12}
      );
      y+=24;

      // ── FOOTER (always at bottom of last page) ────────────────────────
      drawFooter();

      doc.save("Optiwealth_FinCal_Retirement_Report.pdf");
    }catch(e:any){
      alert("PDF error: jspdf is not installed.\n\nTo fix, open a terminal and run:\n  cd frontend\n  npm install jspdf\n\nThen click Download Report again.");
    }
    setLoading(false);
  };
  return (
    <button onClick={generate} disabled={loading} id="pdf-btn" aria-label="Download PDF"
      style={{display:"inline-flex",alignItems:"center",gap:8,background:loading?"#64748b":t.accentGrad,color:"#fff",border:"none",borderRadius:10,padding:"11px 20px",fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:"Montserrat,Arial,sans-serif",boxShadow:loading?"none":`0 4px 14px ${t.accent}40`,transition:"all 0.15s"}}>
      {loading?"⏳ Generating…":"⬇ Download Report (PDF)"}
    </button>
  );
}

// ─── Learn Tab ────────────────────────────────────────────────
function LearnTab({t}:{t:Theme}) {
  const [open,setOpen]=useState<string|null>("what");
  const sections=[
    {id:"what",title:"📚 What is retirement planning?",content:`Retirement planning means figuring out how much you need after you stop working — then building a savings plan to reach that goal.\n\nWhen you retire, your salary stops. But expenses don't. You need money for food, rent, healthcare, travel, and emergencies — for 20–30 years.\n\nThis calculator estimates:\n• How much monthly income you'll need at retirement (inflation-adjusted)\n• The total corpus (lump sum) needed\n• How much to invest monthly now (your SIP)`},
    {id:"sip",title:"💰 What is a SIP?",content:`SIP = Systematic Investment Plan. Invest a fixed amount monthly into mutual funds.\n\nWhy SIP works:\n• Rupee Cost Averaging: More units when markets fall, fewer when they rise.\n• Compounding: ₹5,000/month at 12% for 30 years → ₹1.76 Crore. You invested only ₹18L — the rest is compounding!\n• Discipline: Small regular investments beat sporadic large ones.\n\nStep-up SIP: Increase by a % each year. A 10% step-up reduces starting SIP by ~35%.`},
    {id:"infl",title:"📈 Why does inflation matter?",content:`At 6% annual inflation:\n• ₹50,000/month today → ₹1.6 Lakh/month in 30 years\n• ₹1 today → only ₹0.17 purchasing power in 30 years\n\nThis calculator uses three buckets:\n• General living: 6%\n• Medical: 8% (inflates faster)\n• Lifestyle/travel: 4%\n\nA savings account at 4% return vs 6% inflation actually loses money in real terms.`},
    {id:"monte",title:"🎲 What is Monte Carlo simulation?",content:`Real markets don't deliver smooth returns. Monte Carlo handles this uncertainty.\n\nHow:\n1. Run 1,000 different "what if" market scenarios\n2. Each uses a random return sequence with realistic volatility\n3. Count how many scenarios end with money still remaining\n\nResult: "78% success" = 780 of 1,000 scenarios end with money left.\n\nSafe ≥ 80% | Moderate 50–80% | Risky < 50%`},
    {id:"corp",title:"🏦 What is a retirement corpus?",content:`The total lump sum needed by retirement day.\n\nIt must:\n1. Generate monthly income from returns\n2. Cover rising expenses due to inflation\n3. Last until your life expectancy\n\nExample: Monthly expense ₹1L at 7% return → need ~₹1.5–2 Crore for 20 years.\n\nThis uses the Present Value of Annuity formula — used by financial planners globally.`},
    {id:"reg",title:"⏰ Why start now?",content:`Every year you delay, required SIP jumps:\n\n• Start at 25 → ₹3,460/month\n• Start at 30 → ₹6,280/month\n• Start at 35 → ₹11,600/month\n• Start at 40 → ₹22,450/month\n\nWaiting 5 years from 25 to 30 nearly doubles your SIP. The Regret Calculator shows exactly what a 5-year delay costs.`},
    {id:"sens",title:"📊 What is sensitivity analysis?",content:`Your plan depends on assumptions. Sensitivity shows how required SIP changes if those assumptions are slightly off.\n\nIf you assumed 10% returns but markets only give 8% — how much more SIP would you need?\n\nThe 3×3 grid shows 9 combinations of return × inflation. Each cell is calculated from scratch — so values differ across every row and column.\n\nAlways plan slightly conservatively.`},
    {id:"chat",title:"🤖 How to set up the AI Advisor chatbot",content:`The chatbot requires an Anthropic API key. Here are the complete steps:\n\n1. Go to console.anthropic.com and sign in (or create a free account)\n2. Click "API Keys" in the left sidebar\n3. Click "Create Key", give it a name, copy the key (starts with sk-ant-)\n4. In your project folder, open the backend/ folder\n5. Create a new file called .env (exactly that name, no extension)\n6. Paste this inside: ANTHROPIC_API_KEY=sk-ant-your-key-here\n7. Save the file\n8. Stop the backend if running (Ctrl+C in terminal)\n9. In the backend folder, run: npm install dotenv\n10. Restart: node server.js\n\nThe chatbot will now work. The key is kept secure on your server and never exposed to the browser.\n\nNote: Anthropic offers free credits for new accounts. No payment required for testing.`},
  ];
  return (
    <section style={{marginTop:32}} aria-labelledby="learn-h">
      <div style={{borderBottom:`3px solid ${t.accent}`,paddingBottom:14,marginBottom:24}}>
        {/* FIX font size: was 28px → 22px */}
        <h2 id="learn-h" style={{fontSize:22,fontWeight:800,color:t.text,fontFamily:"Montserrat,Arial,sans-serif",letterSpacing:"-0.3px"}}>Retirement Planning 101</h2>
        {/* FIX font size: was 18px → 14px; FIX: Georgia removed → Arial */}
        <p style={{fontSize:14,color:t.textSub,marginTop:5,fontFamily:"Arial,sans-serif"}}>New to retirement planning? These explainers decode every concept used in your report — including how to set up the AI chatbot.</p>
      </div>
      <div style={{display:"flex",flexDirection:"column" as const,gap:10}}>
        {sections.map(s=>(
          <div key={s.id} style={{border:`1.5px solid ${open===s.id?t.accent:t.border}`,borderRadius:12,overflow:"hidden",background:open===s.id?t.surfaceAlt:t.surfaceCard,transition:"border-color 0.15s"}}>
            <button onClick={()=>setOpen(open===s.id?null:s.id)} aria-expanded={open===s.id}
              style={{width:"100%",padding:"15px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"transparent",border:"none",cursor:"pointer",textAlign:"left" as const}}>
              {/* FIX font size: was 19px → 15px */}
              <span style={{fontSize:15,fontWeight:700,color:t.text,fontFamily:"Montserrat,Arial,sans-serif"}}>{s.title}</span>
              <span style={{fontSize:18,color:t.accent,fontWeight:700,transform:open===s.id?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}>⌄</span>
            </button>
            {open===s.id&&(
              <div style={{padding:"4px 20px 20px",borderTop:`1px solid ${t.border}`}}>
                {s.content.split("\n").map((line,i)=>(
                  line.trim()===""?<br key={i}/>:
                  line.startsWith("•")?(<div key={i} style={{display:"flex",gap:8,marginBottom:5}}><span style={{color:t.accent,fontWeight:700,flexShrink:0}}>•</span>
                    <span style={{fontSize:14,color:t.textSub,lineHeight:1.65,fontFamily:"Arial,sans-serif"}}>{line.slice(1).trim()}</span></div>):
                  /^\d+\./.test(line)?(<div key={i} style={{display:"flex",gap:8,marginBottom:5}}><span style={{color:t.accent,fontWeight:700,flexShrink:0,minWidth:18}}>{line.match(/^\d+/)?.[0]}.</span>
                    <span style={{fontSize:14,color:t.textSub,lineHeight:1.65,fontFamily:"Arial,sans-serif"}}>{line.replace(/^\d+\./,"").trim()}</span></div>):
                  (<p key={i} style={{fontSize:14,color:t.textSub,lineHeight:1.65,marginBottom:6,fontFamily:"Arial,sans-serif"}}>{line}</p>)
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {/* FIX font size: was 18px → 14px */}
      <div style={{marginTop:22,padding:"16px 20px",background:`${t.accent}15`,borderRadius:12,border:`1.5px solid ${t.accent}30`,fontSize:14,color:t.text,fontFamily:"Montserrat,Arial,sans-serif",lineHeight:1.6}}>
        <strong>💡 Key takeaway:</strong> The earlier you start, the smaller your monthly investment. Time is your most powerful financial asset.
      </div>
    </section>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────
export default function Home() {
  const [darkMode,setDarkMode]=useState(false);
  const [tourStep,setTourStep]=useState<number|null>(null);
  const t=darkMode?DARK:LIGHT;

  const [activeTab,setActiveTab]=useState<NavTab>("calculator");
  const [form,setForm]=useState<FormState>({currentAge:"25",retirementAge:"60",lifeExpectancy:"85",monthlyExpense:"40000",inflationRate:"6",preReturn:"10",postReturn:"7",stepUpRate:"0",existingCorpus:"0",lumpSumWithdrawal:"0"});
  const [result,setResult]=useState<any>(null);
  const [scenario,setScenario]=useState<keyof typeof SCENARIOS>("moderate");
  const [persona,setPersona]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [formError,setFormError]=useState<string|null>(null);

  // ── Tour: derive visible steps based on whether results exist ──
  // Pre-results steps always show; post-results steps only after Calculate
  const visibleTour = TOUR_ALL.filter(s => !s.requiresResults || result !== null);

  // ── Auto-show tour on every page load (pre-results steps only) ─
  useEffect(()=>{
    const timer = setTimeout(()=> setTourStep(0), 800);
    return ()=> clearTimeout(timer);
  },[]);

  const doneTour=()=>setTourStep(null);
  const nextTour=()=>{
    if(tourStep!==null && tourStep < visibleTour.length-1) setTourStep(tourStep+1);
    else doneTour();
  };

  const validateForm = (): string | null => {
    const age    = Number(form.currentAge);
    const retAge = Number(form.retirementAge);
    const lifeExp= Number(form.lifeExpectancy);
    const expense= Number(form.monthlyExpense);
    const inf    = Number(form.inflationRate);
    const preRet = Number(form.preReturn);
    const postRet= Number(form.postReturn);
    const stepUp = Number(form.stepUpRate);
    const corpus = Number(form.existingCorpus);

    if (!age    || age <= 0)           return "Current age must be greater than 0.";
    if (age > 100)                     return "Current age seems too high. Please check.";
    if (!retAge || retAge <= age)      return "Retirement age must be greater than your current age.";
    if (retAge > 100)                  return "Retirement age seems too high. Please check.";
    if (!lifeExp|| lifeExp <= retAge)  return "Life expectancy must be greater than retirement age.";
    if (!expense|| expense <= 0)       return "Monthly expense must be greater than ₹0.";
    if (!inf    || inf <= 0)           return "Inflation rate must be greater than 0%.";
    if (inf > 50)                      return "Inflation rate seems unrealistically high. Please check.";
    if (!preRet || preRet <= 0)        return "Pre-retirement return must be greater than 0%.";
    if (preRet > 50)                   return "Pre-retirement return seems unrealistically high. Please check.";
    if (!postRet|| postRet <= 0)       return "Post-retirement return must be greater than 0%.";
    if (stepUp < 0)                    return "Step-up rate cannot be negative.";
    if (corpus < 0)                    return "Existing corpus cannot be negative.";
    const lumpSum = Number(form.lumpSumWithdrawal);
    if (lumpSum < 0)                   return "Lumpsum withdrawal cannot be negative.";
    return null;
  };

  const handleBlurClamp = (name: string, min: number) => {
    setForm(prev => {
      const val = parseFloat(prev[name as keyof FormState]);
      if (isNaN(val) || val < min) return { ...prev, [name]: String(min) };
      return prev;
    });
  };

  const handleChange=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const {name,value}=e.target;
    const safe = value.startsWith("-") ? value.slice(1) : value;
    setForm(prev=>({...prev,[name]:safe}));
  };

  const applyScenario=(type:keyof typeof SCENARIOS)=>{setScenario(type);setForm(prev=>({...prev,preReturn:SCENARIOS[type].preReturn,postReturn:SCENARIOS[type].postReturn}));};
  const applyPersona=(p:typeof PERSONAS[number])=>{setPersona(p.label);setForm({...p.values});};

  const calculate=async()=>{
    setFormError(null);
    const validationError = validateForm();
    if (validationError) { setFormError(validationError); return; }

    setError("");setLoading(true);
    try{
      const payload={currentAge:Number(form.currentAge),retirementAge:Number(form.retirementAge),lifeExpectancy:Number(form.lifeExpectancy),monthlyExpense:Number(form.monthlyExpense),inflationRate:Number(form.inflationRate)/100,preReturn:Number(form.preReturn)/100,postReturn:Number(form.postReturn)/100,stepUpRate:Number(form.stepUpRate)/100,existingCorpus:Number(form.existingCorpus),lumpSumWithdrawal:Number(form.lumpSumWithdrawal)};
      const res=await fetch("http://localhost:5000/api/retirement/calculate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      if(!res.ok)throw new Error("Server error");
      const data=await res.json();
      setResult(data.data);
      setTimeout(()=>document.getElementById("results-section")?.scrollIntoView({behavior:"smooth",block:"start"}),100);
    }catch{setError("Could not connect to backend. Make sure it is running on port 5000.");}
    setLoading(false);
  };

  const numericInputs={currentAge:Number(form.currentAge),retirementAge:Number(form.retirementAge),lifeExpectancy:Number(form.lifeExpectancy),monthlyExpense:Number(form.monthlyExpense),inflationRate:Number(form.inflationRate)/100,preReturn:Number(form.preReturn)/100,postReturn:Number(form.postReturn)/100};
  const risk=result?getRisk(result.successProbability):null;
  const thS:React.CSSProperties={padding:"11px 13px",background:darkMode?"#1e3a6e":"#224c87",color:"#fff",fontWeight:700,fontSize:13,textAlign:"left" as const,whiteSpace:"nowrap" as const,fontFamily:"Montserrat,Arial,sans-serif"};
  const tdS=(hi:boolean):React.CSSProperties=>({padding:"11px 13px",fontSize:13,border:`1px solid ${t.border}`,background:hi?t.tableHi:t.surfaceCard,fontWeight:hi?800:400,color:hi?t.accent:t.textSub,fontFamily:"Montserrat,Arial,sans-serif"});

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Tour — uses visibleTour so post-results steps only appear after Calculate */}
      {tourStep!==null&&<TourTooltip step={tourStep} onNext={nextTour} onSkip={doneTour} total={visibleTour.length} t={t} steps={visibleTour}/>}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;}
        html,body{margin:0;background:${t.bg};transition:background 0.25s;}
        .skip-link{position:absolute;top:-100px;left:16px;z-index:9999;background:#224c87;color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;text-decoration:none;}
        .skip-link:focus{top:8px;}
        .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;}
        input[type=number]{-moz-appearance:textfield;}
        input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
        @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:0.01ms!important;transition-duration:0.01ms!important;}}
        @media(forced-colors:active){button{border:2px solid ButtonText!important;}}
        @media(max-width:640px){.vs-divider{display:none!important;}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes tooltipPop{from{opacity:0;transform:scale(0.88) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes glowPulse{0%,100%{box-shadow:0 0 0 4px rgba(79,126,196,0.25)}50%{box-shadow:0 0 0 9px rgba(79,126,196,0.1)}}
        .result-anim{animation:fadeInUp 0.35s ease-out both;}
        .result-anim:nth-child(1){animation-delay:.05s}.result-anim:nth-child(2){animation-delay:.1s}
        .result-anim:nth-child(3){animation-delay:.15s}.result-anim:nth-child(4){animation-delay:.2s}
        .result-anim:nth-child(5){animation-delay:.25s}.result-anim:nth-child(6){animation-delay:.3s}
        .result-anim:nth-child(7){animation-delay:.35s}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:${t.accent};border:3px solid ${t.surfaceCard};box-shadow:0 2px 8px rgba(34,76,135,0.4);cursor:pointer;}
        input[type=range]::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:${t.accent};border:3px solid ${t.surfaceCard};cursor:pointer;}
        input[type=range]{-webkit-appearance:none;background:transparent;}
      `}</style>

      {/* Nav */}
      <nav aria-label="Main navigation" style={{borderBottom:`1px solid ${t.border}`,background:t.navBg,position:"sticky",top:0,zIndex:100,boxShadow:t.navShadow,transition:"background 0.25s"}}>
        <div style={{maxWidth:960,margin:"0 auto",padding:"0 20px",display:"flex",alignItems:"center",gap:4}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 0",marginRight:"auto"}}>
            {/* Optiwealth logo mark — inline SVG, no external file needed */}
            <svg width="36" height="36" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style={{borderRadius:9,flexShrink:0}} aria-hidden="true">
              <rect width="120" height="120" rx="24" fill="#224c87"/>
              <rect x="22" y="62" width="16" height="34" rx="4" fill="rgba(255,255,255,0.35)"/>
              <rect x="44" y="44" width="16" height="52" rx="4" fill="rgba(255,255,255,0.6)"/>
              <rect x="66" y="28" width="16" height="68" rx="4" fill="#ffffff"/>
              <polyline points="66,28 74,18 82,28" fill="none" stroke="#da3832" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="30,62 52,44 74,28" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 3"/>
              <circle cx="30" cy="62" r="3.5" fill="rgba(255,255,255,0.5)"/>
              <circle cx="52" cy="44" r="3.5" fill="rgba(255,255,255,0.7)"/>
              <circle cx="74" cy="28" r="3.5" fill="#ffffff"/>
            </svg>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:t.accent,fontFamily:"Montserrat,Arial,sans-serif",lineHeight:1.1}}>Optiwealth</div>
              <div style={{fontSize:11,color:t.textMuted,fontFamily:"Montserrat,Arial,sans-serif",letterSpacing:"0.3px"}}>FinCal · Technex '26</div>
            </div>
          </div>
          <div role="tablist" aria-label="Page sections" style={{display:"flex"}}>
            {([{key:"calculator",label:"Calculator",icon:"🧮"},{key:"comparison",label:"Compare",icon:"⚖️",id:"compare-tab"},{key:"learn",label:"Learn",icon:"📚",id:"learn-tab"}] as {key:NavTab;label:string;icon:string;id?:string}[]).map(tb=>(
              <button key={tb.key} role="tab" aria-selected={activeTab===tb.key} onClick={()=>setActiveTab(tb.key)} id={tb.id}
                style={{padding:"13px 12px",fontSize:13,fontWeight:activeTab===tb.key?700:500,color:activeTab===tb.key?t.accent:t.textMuted,background:"none",border:"none",borderBottom:activeTab===tb.key?`3px solid ${t.accent}`:"3px solid transparent",cursor:"pointer",borderRadius:0,fontFamily:"Montserrat,Arial,sans-serif",marginBottom:-1,transition:"color 0.15s,border-color 0.15s",display:"flex",alignItems:"center",gap:5}}>
                <span aria-hidden="true">{tb.icon}</span>{tb.label}
              </button>
            ))}
          </div>
          <button id="tour-btn" onClick={()=>setTourStep(0)} aria-label="Start guided tour" title="Start tour"
            style={{width:30,height:30,borderRadius:8,background:t.surfaceAlt,border:`1px solid ${t.border}`,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>❓</button>
          <button id="darkmode-btn" onClick={()=>setDarkMode(v=>!v)} aria-label={darkMode?"Light mode":"Dark mode"}
            style={{width:46,height:26,borderRadius:13,background:darkMode?t.accent:"#e5e7eb",border:"none",cursor:"pointer",position:"relative" as const,transition:"background 0.2s",flexShrink:0}}>
            <span style={{position:"absolute",top:3,left:darkMode?22:3,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left 0.2s",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,boxShadow:"0 1px 4px rgba(0,0,0,0.25)"}}>
              {darkMode?"🌙":"☀️"}
            </span>
          </button>
        </div>
      </nav>

      <main id="main-content" style={{maxWidth:960,margin:"0 auto",padding:"28px 20px 100px"}}>

        {activeTab==="calculator"&&(
          <>
            <header style={{marginBottom:28}}>
              {/* FIX font size: was 32px → 26px */}
              <h1 style={{fontSize:26,fontWeight:800,color:t.text,fontFamily:"Montserrat,Arial,sans-serif",letterSpacing:"-0.5px",margin:0}}>Retirement Planning Calculator</h1>
              {/* FIX font size: was 18px → 14px; FIX: Georgia removed → Arial */}
              <p style={{fontSize:14,color:t.textSub,marginTop:7,lineHeight:1.65,fontFamily:"Arial,sans-serif",maxWidth:680}}>Estimate how much you need to save for a comfortable retirement — with inflation buckets, 1,000 Monte Carlo simulations, and personalised SIP recommendations.</p>
              {/* FIX font size: was 16px → 13px */}
              <p style={{fontSize:13,color:t.textMuted,marginTop:5,fontFamily:"Montserrat,Arial,sans-serif"}}>ⓘ All values are <strong>illustrative estimates</strong> for educational purposes only. Not investment advice.</p>
            </header>

            {/* Persona — heading then 3 buttons side by side */}
            <section aria-labelledby="persona-h" id="persona-sec" style={{marginBottom:16}}>
              <h2 id="persona-h" style={{fontSize:14,fontWeight:700,color:t.textSub,marginBottom:9,fontFamily:"Montserrat,Arial,sans-serif"}}>🚀 Quick start — pick a profile</h2>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                {PERSONAS.map(p=>(
                  <button key={p.label} onClick={()=>applyPersona(p)} aria-pressed={persona===p.label}
                    style={{background:persona===p.label?t.accent:t.surfaceCard,color:persona===p.label?"#fff":t.text,border:persona===p.label?`2px solid ${t.accent}`:`1.5px solid ${t.border}`,borderRadius:10,padding:"12px 14px",fontWeight:600,cursor:"pointer",fontSize:13,textAlign:"left" as const,transition:"all 0.15s",fontFamily:"Montserrat,Arial,sans-serif",display:"flex",alignItems:"center",gap:10,width:"100%"}}>
                    <span style={{fontSize:20,flexShrink:0}}>{p.icon}</span>
                    <span><span style={{display:"block",fontWeight:700}}>{p.label}</span><span style={{fontSize:12,fontWeight:400,opacity:0.75}}>{p.desc}</span></span>
                  </button>
                ))}
              </div>
            </section>

            {/* Scenario — heading then 3 buttons side by side */}
            <section aria-labelledby="scenario-h" style={{marginBottom:24}}>
              <h2 id="scenario-h" style={{fontSize:14,fontWeight:700,color:t.textSub,marginBottom:9,fontFamily:"Montserrat,Arial,sans-serif"}}>📈 Investment scenario</h2>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                {(Object.entries(SCENARIOS) as [keyof typeof SCENARIOS,typeof SCENARIOS[keyof typeof SCENARIOS]][]).map(([key,s])=>(
                  <button key={key} onClick={()=>applyScenario(key)} aria-pressed={scenario===key}
                    style={{background:scenario===key?t.accent:t.surfaceCard,color:scenario===key?"#fff":t.text,border:scenario===key?`2px solid ${t.accent}`:`1.5px solid ${t.border}`,borderRadius:10,padding:"12px 14px",fontWeight:scenario===key?700:500,cursor:"pointer",fontSize:13,fontFamily:"Montserrat,Arial,sans-serif",transition:"all 0.15s",textAlign:"left" as const,display:"flex",alignItems:"center",gap:10,width:"100%"}}>
                    <span style={{fontSize:20,flexShrink:0}}>{s.icon}</span>
                    <span><span style={{display:"block",fontWeight:700}}>{s.label}</span><span style={{fontSize:12,fontWeight:400,opacity:0.75}}>Pre: {s.preReturn}% / Post: {s.postReturn}% · {s.desc}</span></span>
                  </button>
                ))}
              </div>
            </section>

            {/* Form */}
            <section aria-labelledby="form-h" id="form-sec" style={{background:t.surfaceCard,borderRadius:14,padding:"24px 28px",border:`1px solid ${t.border}`,boxShadow:t.cardShadow,marginBottom:24}}>
              {/* FIX font size: was 20px → 16px */}
              <h2 id="form-h" style={{fontSize:16,fontWeight:700,color:t.accent,marginBottom:4,fontFamily:"Montserrat,Arial,sans-serif"}}>Your details</h2>
              {/* FIX font size: was 17px → 13px */}
              <p style={{fontSize:13,color:t.textMuted,marginBottom:20,fontFamily:"Montserrat,Arial,sans-serif"}}>Click <strong style={{color:t.accent}}>?</strong> next to any field to learn why it matters.</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:"18px 26px"}}>
                <Field label="Current age (years)"                name="currentAge"     value={form.currentAge}     onChange={handleChange} onBlurClamp={handleBlurClamp} min={1}   hint="Your age today"                           fieldKey="currentAge"     t={t}/>
                <Field label="Retirement age (years)"             name="retirementAge"  value={form.retirementAge}  onChange={handleChange} onBlurClamp={handleBlurClamp} min={1}   hint="Age you plan to stop working"            fieldKey="retirementAge"  t={t}/>
                <Field label="Life expectancy (years)"            name="lifeExpectancy" value={form.lifeExpectancy} onChange={handleChange} onBlurClamp={handleBlurClamp} min={1}   hint="Plan until this age as a safety buffer"  fieldKey="lifeExpectancy" t={t}/>
                <Field label="Current monthly expenses (₹)"      name="monthlyExpense" value={form.monthlyExpense} onChange={handleChange} onBlurClamp={handleBlurClamp} min={1}   hint="Total monthly spending today"             fieldKey="monthlyExpense" t={t}/>
                <Field label="Existing savings / corpus (₹)"     name="existingCorpus" value={form.existingCorpus} onChange={handleChange} onBlurClamp={handleBlurClamp} min={0}   hint="EPF, FD, MF already saved — 0 if none"  fieldKey="existingCorpus" t={t}/>
                <Field label="Lumpsum withdrawal at retirement (₹)" name="lumpSumWithdrawal" value={form.lumpSumWithdrawal} onChange={handleChange} onBlurClamp={handleBlurClamp} min={0} hint="One-time amount to withdraw on retirement day — 0 if not needed" fieldKey="lumpSumWithdrawal" t={t}/>
                <Field label="Assumed inflation rate (%)"         name="inflationRate"  value={form.inflationRate}  onChange={handleChange} onBlurClamp={handleBlurClamp} min={0.1} hint="Typical 5–7%. Editable assumption."       fieldKey="inflationRate"  t={t}/>
                <Field label="Pre-retirement return (% p.a.)"    name="preReturn"      value={form.preReturn}      onChange={handleChange} onBlurClamp={handleBlurClamp} min={0.1} hint="Expected return during working years"      fieldKey="preReturn"      t={t}/>
                <Field label="Post-retirement return (% p.a.)"   name="postReturn"     value={form.postReturn}     onChange={handleChange} onBlurClamp={handleBlurClamp} min={0.1} hint="Expected return after retirement"          fieldKey="postReturn"     t={t}/>
                <Field label="Annual SIP step-up (%) — optional" name="stepUpRate"     value={form.stepUpRate}     onChange={handleChange} onBlurClamp={handleBlurClamp} min={0}   hint="% increase in SIP each year. 0 to skip."  fieldKey="stepUpRate"     t={t}/>
              </div>

              {formError&&(
                <div role="alert" aria-live="assertive" style={{marginTop:16,padding:"11px 14px",background:`${t.red}12`,border:`1.5px solid ${t.red}50`,borderRadius:10,color:t.red,fontSize:13,fontWeight:500,fontFamily:"Montserrat,Arial,sans-serif",display:"flex",alignItems:"center",gap:8}}>
                  ⚠️ {formError}
                </div>
              )}

              {error&&<p role="alert" style={{color:t.red,fontSize:13,marginTop:14,padding:"10px 13px",background:`${t.red}15`,borderRadius:8,border:`1px solid ${t.red}40`}}>⚠ {error}</p>}
              <button onClick={calculate} disabled={loading} aria-busy={loading} id="calc-btn"
                style={{marginTop:22,background:loading?"#64748b":t.accentGrad,color:"#fff",padding:"13px 40px",borderRadius:10,border:"none",fontSize:15,fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:"Montserrat,Arial,sans-serif",boxShadow:loading?"none":`0 4px 16px ${t.accent}45`,transition:"all 0.15s"}}>
                {loading?"⏳ Calculating…":"Calculate my retirement plan →"}
              </button>
            </section>

            {/* Results — only rendered after calculation */}
            {result&&(
              <section id="results-section" aria-label="Retirement calculation results" aria-live="polite">
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap" as const,gap:12,borderBottom:`3px solid ${t.accent}`,paddingBottom:14,marginBottom:24}}>
                  <div>
                    {/* FIX font size: was 28px → 22px */}
                    <h2 style={{fontSize:22,fontWeight:800,color:t.text,fontFamily:"Montserrat,Arial,sans-serif",margin:0}}>Your Retirement Plan</h2>
                    {/* FIX font size: was 17px → 13px */}
                    <p style={{fontSize:13,color:t.textMuted,marginTop:3,fontFamily:"Montserrat,Arial,sans-serif"}}>Based on assumed rates — illustrative projections only.</p>
                  </div>
                  <PDFExportButton result={result} inputs={numericInputs} t={t}/>
                </div>

                <ReadinessScore result={result} form={form} darkMode={darkMode}/>

                {(()=>{
                  const cards = [
                    {icon:"📅",title:"Future monthly expense",    value:fmtINR(result.futureMonthlyExpense),        sub:"Inflation-adjusted at retirement",highlight:false,color:undefined},
                    {icon:"🏦",title:"Required retirement corpus", value:fmtINR(result.requiredCorpus),              sub:"Total corpus needed",highlight:true,color:undefined},
                    {icon:"📈",title:"Monthly SIP (flat)",          value:fmtINR(result.monthlySIP),                  sub:"Constant monthly investment",highlight:false,color:undefined},
                    ...(result.monthlyStepUpSIP?[{icon:"⬆️",title:`SIP with ${form.stepUpRate}% step-up`,value:fmtINR(result.monthlyStepUpSIP),sub:"Lower start, rises yearly",highlight:true,color:undefined}]:[]),
                    ...(result.existingCorpusAtRetirement>0?[{icon:"💰",title:"Existing savings at retirement",value:fmtINR(result.existingCorpusAtRetirement),sub:"Current corpus compounded",highlight:false,color:t.green}]:[]),
                    ...(result.lumpSumWithdrawal>0?[
                      {icon:"🏠",title:"Lumpsum at retirement",value:fmtINR(result.lumpSumWithdrawal),sub:"Withdrawn on day 1",highlight:false,color:t.yellow},
                      {icon:"📊",title:"Corpus for monthly use",value:fmtINR(result.corpusForIncome),sub:"Remaining after lumpsum",highlight:false,color:t.accent},
                    ]:[]),
                    {icon:"📆",title:"Corpus duration",             value:`${result.yearsCorpusLasts} yrs`,           sub:"Estimated years it lasts",highlight:false,color:undefined},
                    {icon:"🎲",title:"Success probability",         value:`${Math.round(result.successProbability)}%`,sub:"1,000 Monte Carlo sims",highlight:false,color:risk!.color},
                  ];
                  // Split into rows of 3 — last row gets equal-width cards spanning full row
                  const rows:typeof cards[] = [];
                  for(let i=0;i<cards.length;i+=3) rows.push(cards.slice(i,i+3));
                  return (
                    <div style={{display:"flex",flexDirection:"column" as const,gap:12,marginBottom:24}}>
                      {rows.map((row,ri)=>(
                        <div key={ri} style={{display:"grid",gridTemplateColumns:`repeat(${row.length},1fr)`,gap:12}}>
                          {row.map((card,i)=>(
                            <div key={i} className="result-anim" style={{animationDelay:`${(ri*3+i)*0.05+0.05}s`}}>
                              <ResultCard title={card.title} value={card.value} sub={card.sub} highlight={card.highlight} color={card.color} icon={card.icon} t={t}/>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <div style={{padding:"20px 24px",background:t.surfaceAlt,borderRadius:14,border:`2px solid ${t.borderAccent}`,marginBottom:24}}>
                  {/* FIX font size: was 20px → 16px */}
                  <h3 style={{fontSize:16,fontWeight:800,color:t.accent,marginBottom:8,fontFamily:"Montserrat,Arial,sans-serif"}}>💵 Your estimated retirement paycheck</h3>
                  {/* FIX font size: was 19px/28px → 14px/22px; FIX: Georgia removed → Arial */}
                  <p style={{fontSize:14,color:t.text,lineHeight:1.8,fontFamily:"Arial,sans-serif"}}>A corpus of <strong style={{color:t.accent}}>{fmtINR(result.requiredCorpus)}</strong> could provide <strong style={{color:t.accent,fontSize:22,fontFamily:"Montserrat,Arial,sans-serif"}}>{fmtINR(result.monthlyRetirementIncome)}</strong>/month at retirement.</p>
                  {/* FIX font size: was 17px → 13px */}
                  <p style={{fontSize:13,color:t.textSub,marginTop:5,fontFamily:"Montserrat,Arial,sans-serif"}}>Equivalent to today's <strong>{fmtINR(result.monthlyIncomeInTodaysMoney)}</strong>/month in purchasing power.</p>
                </div>

                <InteractiveTimeline result={result} form={form} t={t}/>

                {/* Lumpsum withdrawal breakdown — only shown when user set a lumpsum */}
                {result.lumpSumWithdrawal>0&&(
                  <section aria-labelledby="lumpsum-h" style={{background:t.surfaceCard,borderRadius:14,padding:"20px 24px",border:`2px solid ${t.yellow}40`,boxShadow:t.cardShadow,marginBottom:24}}>
                    <h3 id="lumpsum-h" style={{fontSize:15,fontWeight:800,color:t.yellow,marginBottom:4,fontFamily:"Montserrat,Arial,sans-serif"}}>🏠 Lumpsum Withdrawal Plan</h3>
                    <p style={{fontSize:13,color:t.textMuted,marginBottom:16,fontFamily:"Montserrat,Arial,sans-serif"}}>On retirement day you withdraw a lump sum first. The remaining corpus then funds your monthly expenses.</p>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:14}}>
                      <div style={{background:t.surfaceAlt,borderRadius:10,padding:"14px 16px",border:`1px solid ${t.border}`}}>
                        <p style={{fontSize:11,color:t.textMuted,fontFamily:"Montserrat,Arial,sans-serif",fontWeight:600,textTransform:"uppercase" as const,letterSpacing:"0.6px",marginBottom:4}}>Total corpus built</p>
                        <p style={{fontSize:20,fontWeight:800,color:t.accent,fontFamily:"Montserrat,Arial,sans-serif"}}>{fmtINR(result.requiredCorpus)}</p>
                        <p style={{fontSize:12,color:t.textMuted,fontFamily:"Montserrat,Arial,sans-serif",marginTop:3}}>What your SIP builds up to</p>
                      </div>
                      <div style={{background:t.surfaceAlt,borderRadius:10,padding:"14px 16px",border:`1.5px solid ${t.yellow}50`}}>
                        <p style={{fontSize:11,color:t.textMuted,fontFamily:"Montserrat,Arial,sans-serif",fontWeight:600,textTransform:"uppercase" as const,letterSpacing:"0.6px",marginBottom:4}}>Lumpsum withdrawn</p>
                        <p style={{fontSize:20,fontWeight:800,color:t.yellow,fontFamily:"Montserrat,Arial,sans-serif"}}>{fmtINR(result.lumpSumWithdrawal)}</p>
                        <p style={{fontSize:12,color:t.textMuted,fontFamily:"Montserrat,Arial,sans-serif",marginTop:3}}>Taken out on day 1</p>
                      </div>
                      <div style={{background:t.surfaceAlt,borderRadius:10,padding:"14px 16px",border:`1.5px solid ${t.green}50`}}>
                        <p style={{fontSize:11,color:t.textMuted,fontFamily:"Montserrat,Arial,sans-serif",fontWeight:600,textTransform:"uppercase" as const,letterSpacing:"0.6px",marginBottom:4}}>Remaining for income</p>
                        <p style={{fontSize:20,fontWeight:800,color:t.green,fontFamily:"Montserrat,Arial,sans-serif"}}>{fmtINR(result.corpusForIncome)}</p>
                        <p style={{fontSize:12,color:t.textMuted,fontFamily:"Montserrat,Arial,sans-serif",marginTop:3}}>Funds monthly withdrawals</p>
                      </div>
                    </div>
                    {/* Visual split bar */}
                    <div style={{marginTop:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:t.textMuted,marginBottom:4,fontFamily:"Montserrat,Arial,sans-serif"}}>
                        <span>Corpus split</span>
                        <span>Lumpsum {((result.lumpSumWithdrawal/result.requiredCorpus)*100).toFixed(1)}% · Income {((result.corpusForIncome/result.requiredCorpus)*100).toFixed(1)}%</span>
                      </div>
                      <div style={{height:10,borderRadius:5,background:t.border,overflow:"hidden",display:"flex"}}>
                        <div style={{width:`${(result.lumpSumWithdrawal/result.requiredCorpus)*100}%`,background:t.yellow,transition:"width 0.5s"}}/>
                        <div style={{flex:1,background:t.green,transition:"flex 0.5s"}}/>
                      </div>
                      <div style={{display:"flex",gap:16,marginTop:6,fontSize:11,fontFamily:"Montserrat,Arial,sans-serif"}}>
                        <span style={{color:t.yellow}}>■ Lumpsum withdrawal</span>
                        <span style={{color:t.green}}>■ Monthly income corpus</span>
                      </div>
                    </div>
                    <p style={{fontSize:11,color:t.textMuted,marginTop:12,fontFamily:"Montserrat,Arial,sans-serif"}}>* Your SIP is calculated to build the full corpus including the lumpsum. Illustrative only.</p>
                  </section>
                )}

                <SIPLumpsumToggle result={result} form={form} t={t}/>

                <section aria-labelledby="buckets-h" style={{marginBottom:24}}>
                  {/* FIX font size: was 19px → 15px */}
                  <h3 id="buckets-h" style={{fontSize:15,fontWeight:700,color:t.accent,marginBottom:5,fontFamily:"Montserrat,Arial,sans-serif"}}>Expense breakdown at retirement</h3>
                  {/* FIX font size: was 17px → 13px */}
                  <p style={{fontSize:13,color:t.textSub,marginBottom:12,fontFamily:"Montserrat,Arial,sans-serif"}}>Different expense types inflate at different rates. Medical costs inflate fastest.</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                    <BucketCard label="General living"     value={fmtINR(result.expenseBuckets.general)}   rate="6%" color="#4f7ec4" pct="60% of expenses" icon="🛒" t={t}/>
                    <BucketCard label="Medical & health"   value={fmtINR(result.expenseBuckets.medical)}   rate="8%" color={t.red}   pct="25% of expenses" icon="🏥" t={t}/>
                    <BucketCard label="Lifestyle & travel" value={fmtINR(result.expenseBuckets.lifestyle)} rate="4%" color={t.green} pct="15% of expenses" icon="✈️" t={t}/>
                  </div>
                </section>

                <section aria-labelledby="risk-h" style={{marginBottom:24}}>
                  {/* FIX font size: was 19px → 15px */}
                  <h3 id="risk-h" style={{fontSize:15,fontWeight:700,color:t.accent,marginBottom:8,fontFamily:"Montserrat,Arial,sans-serif"}}>Retirement risk level</h3>
                  <div style={{display:"inline-flex",alignItems:"center",gap:12,background:risk!.bg,padding:"14px 20px",borderRadius:12,border:`1.5px solid ${risk!.border}`}}>
                    {/* FIX font size: was 28px → 20px */}
                    <span style={{fontSize:20,fontWeight:800,color:risk!.color,fontFamily:"Montserrat,Arial,sans-serif",letterSpacing:1}}>{risk!.label}</span>
                    <span style={{fontSize:20,fontWeight:700,color:risk!.color,fontFamily:"Montserrat,Arial,sans-serif"}}>{Math.round(result.successProbability)}%</span>
                    {/* FIX font size: was 17px → 13px */}
                    <span style={{fontSize:13,color:risk!.color,opacity:0.85,fontFamily:"Montserrat,Arial,sans-serif"}}>success probability</span>
                  </div>
                  <p style={{fontSize:13,color:t.textMuted,marginTop:7,fontFamily:"Montserrat,Arial,sans-serif"}}>SAFE ≥ 80% &nbsp;|&nbsp; MODERATE ≥ 50% &nbsp;|&nbsp; RISKY &lt; 50%</p>
                </section>

                <section aria-labelledby="regret-h" style={{padding:"20px 24px",background:`${t.red}10`,borderRadius:14,border:`1.5px solid ${t.red}35`,marginBottom:24}}>
                  {/* FIX font size: was 19px → 15px */}
                  <h3 id="regret-h" style={{fontSize:15,fontWeight:700,color:t.red,marginBottom:5,fontFamily:"Montserrat,Arial,sans-serif"}}>⏰ Cost of waiting {result.regret.delayYears} years</h3>
                  {/* FIX font size: was 17px → 13px */}
                  <p style={{fontSize:13,color:t.textMuted,marginBottom:14,fontFamily:"Montserrat,Arial,sans-serif"}}>What if you start {result.regret.delayYears} years from now instead of today?</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                    {[
                      {label:"Start today",            value:fmtINR(result.regret.sipIfStartNow),   color:t.green,suffix:"/mo"},
                      {label:`Start in ${result.regret.delayYears} years`,value:fmtINR(result.regret.sipIfDelayed), color:t.red,  suffix:"/mo"},
                      {label:"Penalty per month",       value:fmtINR(result.regret.extraMonthlySIP), color:t.red,  suffix:"/mo"},
                      {label:"Total extra you'd pay",   value:fmtINR(result.regret.extraTotalPaid),  color:t.red,  suffix:""},
                    ].map(item=>(
                      <div key={item.label} style={{background:t.surfaceCard,borderRadius:10,padding:"12px 14px",border:`1px solid ${t.border}`}}>
                        {/* FIX font size: was 15px → 12px */}
                        <p style={{fontSize:12,color:t.textMuted,marginBottom:4,fontFamily:"Montserrat,Arial,sans-serif",fontWeight:600,textTransform:"uppercase" as const,letterSpacing:"0.5px"}}>{item.label}</p>
                        {/* FIX font size: was 24px → 18px */}
                        <p style={{fontSize:18,fontWeight:800,color:item.color,fontFamily:"Montserrat,Arial,sans-serif"}}>{item.value}<span style={{fontSize:13,fontWeight:400}}>{item.suffix}</span></p>
                      </div>
                    ))}
                  </div>
                  {/* FIX font size: was 16px → 12px */}
                  <p style={{fontSize:12,color:t.textMuted,marginTop:12,fontFamily:"Montserrat,Arial,sans-serif"}}>Illustrative only.</p>
                </section>

                <section aria-labelledby="sens-h" style={{marginBottom:24}}>
                  {/* FIX font size: was 19px → 15px */}
                  <h3 id="sens-h" style={{fontSize:15,fontWeight:700,color:t.accent,marginBottom:5,fontFamily:"Montserrat,Arial,sans-serif"}}>Sensitivity analysis — monthly SIP required</h3>
                  {/* FIX font size: was 17px → 13px */}
                  <p style={{fontSize:13,color:t.textSub,marginBottom:12,fontFamily:"Montserrat,Arial,sans-serif"}}>Each cell is recalculated from scratch for that exact combination of return and inflation. Highlighted = your current rates.</p>
                  <div style={{overflowX:"auto" as const}}>
                    <table style={{width:"100%",borderCollapse:"collapse" as const,fontSize:13}} aria-label="Sensitivity analysis">
                      <thead><tr>
                        <th scope="col" style={thS}>Return ↓ / Inflation →</th>
                        {result.sensitivity.inflationLabels.map((l:string)=><th scope="col" key={l} style={thS}>Inflation {l}</th>)}
                      </tr></thead>
                      <tbody>
                        {result.sensitivity.table.map((row:number[],i:number)=>(
                          <tr key={i}>
                            <th scope="row" style={{...tdS(false),fontWeight:700,background:t.tableSub}}>Return {result.sensitivity.returnLabels[i]}</th>
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
                  {/* FIX font size: was 16px → 12px */}
                  <p style={{fontSize:12,color:t.textMuted,marginTop:7,fontFamily:"Montserrat,Arial,sans-serif"}}>All values illustrative. Not a guarantee of returns.</p>
                </section>

                <section aria-labelledby="chart-h" style={{borderRadius:14,padding:"22px",border:`1px solid ${t.border}`,boxShadow:t.cardShadow,marginBottom:24,background:t.surfaceCard}}>
                  {/* FIX font size: was 22px → 17px */}
                  <h2 id="chart-h" style={{fontSize:17,fontWeight:800,color:t.accent,marginBottom:3,fontFamily:"Montserrat,Arial,sans-serif"}}>Retirement wealth projection</h2>
                  {/* FIX font size: was 17px → 13px */}
                  <p style={{fontSize:13,color:t.textMuted,marginBottom:16,fontFamily:"Montserrat,Arial,sans-serif"}}>Corpus growth during working years, then drawdown during retirement.</p>
                  <RetirementChart timeline={result.timeline} monteCarloFan={result.monteCarloFan} yearsToRetirement={result.yearsToRetirement} darkMode={darkMode}/>
                </section>

                {/* FIX: pass darkMode prop so WhatIfSliders adapts to theme */}
                <WhatIfSliders results={result} inputs={numericInputs} darkMode={darkMode}/>

                <div role="note" style={{marginTop:22,padding:"14px 18px",fontSize:12,color:t.textMuted,borderTop:`1px solid ${t.border}`,lineHeight:1.8,fontFamily:"Montserrat,Arial,sans-serif",background:t.surfaceAlt,borderRadius:10}}>
                  * All calculations are illustrative based on assumed rates of return and inflation.<br/>
                  * Returns are assumed annual rates and are not guaranteed in any way.<br/>
                  * All assumptions are user-editable and transparently disclosed.
                </div>
              </section>
            )}
          </>
        )}

        {activeTab==="comparison"&&<ComparisonView darkMode={darkMode}/>}
        {activeTab==="learn"&&<LearnTab t={t}/>}

      </main>

      {result&&activeTab==="calculator"&&<RetirementChatbot result={result} form={form}/>}

      {/* FIX font size: was 16px → 12px (disclaimer should be small but readable per rules) */}
      <div role="contentinfo" aria-label="Legal disclaimer" style={{position:"fixed" as const,bottom:0,left:0,right:0,background:t.disclaimerBg,borderTop:`1px solid ${t.border}`,padding:"8px 24px",fontSize:12,color:t.textSub,zIndex:998,lineHeight:1.7,fontFamily:"Arial,sans-serif",transition:"background 0.25s"}}>
        This tool has been designed for information purposes only. Actual results may vary depending on various factors involved in capital market. Investor should not consider above as a recommendation for any schemes of HDFC Mutual Fund. Past performance may or may not be sustained in future and is not a guarantee of any future returns.
      </div>
    </>
  );
}
