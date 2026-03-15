"use client";

import { useState, useMemo } from "react";

interface WhatIfProps {
  results: { requiredCorpus:number; monthlySIP:number; yearsToRetirement:number; retirementYears:number; };
  inputs:  { currentAge:number; retirementAge:number; lifeExpectancy:number; monthlyExpense:number; inflationRate:number; preReturn:number; postReturn:number; };
  darkMode?: boolean;
}

function calcCorpus(e:number,inf:number,pr:number,ytr:number,ry:number):number{
  const fe=e*Math.pow(1+inf,ytr); let c=0,ae=fe*12;
  for(let i=0;i<ry;i++){c+=ae/Math.pow(1+pr,i);ae*=(1+inf);}
  return c;
}
function calcSIP(corpus:number,r:number,yrs:number):number{
  const mr=r/12,n=yrs*12; if(mr===0||n===0)return corpus/Math.max(n,1);
  return(corpus*mr)/(Math.pow(1+mr,n)-1);
}
function fmtINR(v:number):string{
  if(v>=1e7)return"₹"+(v/1e7).toFixed(2)+" Cr";
  if(v>=1e5)return"₹"+(v/1e5).toFixed(2)+" L";
  return"₹"+Math.round(v).toLocaleString("en-IN");
}

function Track({value,min,max,color,trackBg}:{value:number;min:number;max:number;color:string;trackBg:string}){
  const pct=((value-min)/(max-min))*100;
  return(
    <div style={{position:"relative",height:6,borderRadius:3,background:trackBg,marginBottom:2}}>
      <div style={{position:"absolute",left:0,width:`${pct}%`,height:"100%",borderRadius:3,background:`linear-gradient(90deg,${color}66,${color})`,transition:"width 0.03s"}}/>
    </div>
  );
}

function SliderRow({label,hint,value,setValue,min,max,step,display,color,trackBg,labelColor,hintColor,minMaxColor}:{
  label:string;hint:string;value:number;setValue:(v:number)=>void;
  min:number;max:number;step:number;display:string;color:string;
  trackBg:string;labelColor:string;hintColor:string;minMaxColor:string;
}){
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <div>
          <span style={{fontSize:12,fontWeight:700,color:labelColor,fontFamily:"Montserrat,Arial,sans-serif"}}>{label}</span>
          <span style={{fontSize:10,color:hintColor,marginLeft:6,fontFamily:"Montserrat,Arial,sans-serif"}}>{hint}</span>
        </div>
        <span style={{fontSize:13,fontWeight:800,color,background:`${color}15`,padding:"2px 9px",borderRadius:6,border:`1px solid ${color}25`,fontFamily:"Montserrat,Arial,sans-serif"}}>{display}</span>
      </div>
      <div style={{position:"relative"}}>
        <Track value={value} min={min} max={max} color={color} trackBg={trackBg}/>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e=>setValue(parseFloat(e.target.value))}
          aria-label={label} suppressHydrationWarning
          style={{position:"absolute",left:0,top:-7,width:"100%",opacity:0,height:22,cursor:"pointer",margin:0}}
        />
      </div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:minMaxColor,fontFamily:"Montserrat,Arial,sans-serif"}}>
        <span>{min}{label.includes("Age")||label.includes("Expense")?"":"%"}</span>
        <span>{max}{label.includes("Age")||label.includes("Expense")?"":"%"}</span>
      </div>
    </div>
  );
}

export default function WhatIfSliders({results,inputs,darkMode=false}:WhatIfProps){

  // ── Theme tokens derived from darkMode prop ────────────────────────────────
  const sectionBg    = darkMode ? "#1a1d27"              : "#ffffff";
  const sectionBorder= darkMode ? "#2a2d3e"              : "#e5e7eb";
  const sectionShadow= darkMode ? "0 2px 20px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.05)";
  const headingColor = darkMode ? "#e2e8f0"              : "#111827";
  const subTextColor = darkMode ? "#64748b"              : "#6b7280";
  const labelColor   = darkMode ? "#94a3b8"              : "#374151";
  const hintColor    = darkMode ? "#475569"              : "#9ca3af";
  const minMaxColor  = darkMode ? "#334155"              : "#d1d5db";
  const trackBg      = darkMode ? "rgba(255,255,255,0.1)": "rgba(0,0,0,0.08)";
  const resetBtnBg   = darkMode ? "#252a3d"              : "#f3f4f6";
  const resetBtnBorder= darkMode? "#2a2d3e"              : "#e5e7eb";
  const resetBtnColor= darkMode ? "#64748b"              : "#6b7280";
  const resultCardBg = (colorHex:string, isWorse:boolean, isSip:boolean) => {
    if(darkMode) return isWorse ? "rgba(248,113,113,0.1)" : "rgba(52,211,153,0.1)";
    return isWorse ? "rgba(220,38,38,0.06)" : "rgba(5,150,105,0.06)";
  };
  const metaLabelColor = darkMode ? "#475569" : "#6b7280";
  const insightBgWorse  = darkMode ? "rgba(248,113,113,0.08)" : "rgba(220,38,38,0.06)";
  const insightBgBetter = darkMode ? "rgba(52,211,153,0.08)"  : "rgba(5,150,105,0.06)";
  const insightTxtWorse = darkMode ? "#fca5a5" : "#991b1b";
  const insightTxtBetter= darkMode ? "#6ee7b7" : "#065f46";
  const neutralCardBg   = darkMode ? "rgba(79,126,196,0.1)"   : "rgba(34,76,135,0.06)";
  const footerColor     = darkMode ? "#334155"                 : "#9ca3af";

  const[preReturn, setPreReturn] =useState(+(inputs.preReturn *100).toFixed(1));
  const[postReturn,setPostReturn]=useState(+(inputs.postReturn*100).toFixed(1));
  const[inflation, setInflation] =useState(+(inputs.inflationRate*100).toFixed(1));
  const[expense,   setExpense]   =useState(Math.round(inputs.monthlyExpense/1000)*1000);
  const[retireAge, setRetireAge] =useState(inputs.retirementAge);

  // Pure sync math — instant, no API, no debounce needed
  const calc=useMemo(()=>{
    const ytr=retireAge-inputs.currentAge, ry=inputs.lifeExpectancy-retireAge;
    if(ytr<=0||ry<=0)return null;
    const corpus=calcCorpus(expense,inflation/100,postReturn/100,ytr,ry);
    const sip=calcSIP(corpus,preReturn/100,ytr);
    return{corpus,sip,corpusDelta:corpus-results.requiredCorpus,sipDelta:sip-results.monthlySIP};
  },[preReturn,postReturn,inflation,expense,retireAge,inputs,results]);

  const isWorse=(calc?.corpusDelta??0)>0;
  const BLUE  = darkMode ? "#4f7ec4" : "#224c87";
  const RED   = darkMode ? "#f87171" : "#dc2626";
  const GREEN = darkMode ? "#34d399" : "#059669";
  const PURPLE= darkMode ? "#a78bfa" : "#7c3aed";
  const CYAN  = darkMode ? "#22d3ee" : "#0891b2";

  const reset=()=>{
    setPreReturn( +(inputs.preReturn *100).toFixed(1));
    setPostReturn(+(inputs.postReturn*100).toFixed(1));
    setInflation( +(inputs.inflationRate*100).toFixed(1));
    setExpense(Math.round(inputs.monthlyExpense/1000)*1000);
    setRetireAge(inputs.retirementAge);
  };

  const sliderProps = { trackBg, labelColor, hintColor, minMaxColor };

  return(
    <section aria-label="What-if scenario sliders" style={{background:sectionBg,border:`1px solid ${sectionBorder}`,borderRadius:14,padding:"24px 28px",marginTop:32,boxShadow:sectionShadow}}>
      <style>{`
        input[type=range]{-webkit-appearance:none;appearance:none;background:transparent;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:${BLUE};border:2.5px solid ${sectionBg};box-shadow:0 0 0 2px ${BLUE}44;cursor:pointer;margin-top:-5px;}
        input[type=range]::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:${BLUE};border:2.5px solid ${sectionBg};cursor:pointer;}
      `}</style>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,gap:12}}>
        <div>
          <h2 style={{fontSize:15,fontWeight:800,color:headingColor,fontFamily:"Montserrat,Arial,sans-serif",margin:0,letterSpacing:"-0.3px"}}>What-If Sliders</h2>
          <p style={{fontSize:12,color:subTextColor,marginTop:4,fontFamily:"Montserrat,Arial,sans-serif"}}>Drag to instantly see how changes affect your plan — results update in real time, no recalculation needed.</p>
        </div>
        <button onClick={reset} aria-label="Reset sliders"
          style={{background:resetBtnBg,border:`1px solid ${resetBtnBorder}`,borderRadius:8,padding:"6px 12px",fontSize:11,color:resetBtnColor,cursor:"pointer",fontFamily:"Montserrat,Arial,sans-serif",fontWeight:600,whiteSpace:"nowrap",flexShrink:0}}>
          ↺ Reset
        </button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"18px 40px",marginBottom:24}}>
        <SliderRow label="Pre-retirement Return"  hint="working years"      value={preReturn}  setValue={setPreReturn}  min={4}     max={18}    step={0.5}  display={`${preReturn.toFixed(1)}%`}  color={BLUE}   {...sliderProps}/>
        <SliderRow label="Post-retirement Return" hint="after retirement"   value={postReturn} setValue={setPostReturn} min={3}     max={12}    step={0.5}  display={`${postReturn.toFixed(1)}%`} color={GREEN}  {...sliderProps}/>
        <SliderRow label="Inflation Rate"         hint="general price rise" value={inflation}  setValue={setInflation}  min={3}     max={12}    step={0.5}  display={`${inflation.toFixed(1)}%`}  color={RED}    {...sliderProps}/>
        <SliderRow label="Monthly Expense"        hint="today's spending"   value={expense}    setValue={setExpense}    min={10000} max={300000} step={5000} display={fmtINR(expense)}              color={PURPLE} {...sliderProps}/>
        <SliderRow label="Retirement Age"         hint="when you stop"      value={retireAge}  setValue={setRetireAge}  min={45}    max={70}    step={1}    display={`${retireAge} yrs`}           color={CYAN}   {...sliderProps}/>
      </div>

      {calc?(
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:12,marginBottom:14}}>
            {[
              {label:"Required Corpus", value:fmtINR(calc.corpus),                                                         color:BLUE,                      bg:neutralCardBg},
              {label:"Monthly SIP",     value:fmtINR(calc.sip),                                                            color:BLUE,                      bg:neutralCardBg},
              {label:"Corpus vs Base",  value:(calc.corpusDelta>=0?"+":"")+fmtINR(Math.abs(calc.corpusDelta)),              color:isWorse?RED:GREEN,         bg:isWorse?(darkMode?"rgba(248,113,113,0.1)":"rgba(220,38,38,0.06)"):(darkMode?"rgba(52,211,153,0.1)":"rgba(5,150,105,0.06)")},
              {label:"SIP vs Base",     value:(calc.sipDelta>=0?"+":"")+fmtINR(Math.abs(calc.sipDelta)),                    color:calc.sipDelta>0?RED:GREEN, bg:calc.sipDelta>0?(darkMode?"rgba(248,113,113,0.1)":"rgba(220,38,38,0.06)"):(darkMode?"rgba(52,211,153,0.1)":"rgba(5,150,105,0.06)")},
            ].map(c=>(
              <div key={c.label} style={{background:c.bg,border:`1px solid ${c.color}20`,borderRadius:10,padding:"12px 15px"}}>
                <div style={{fontSize:10,color:metaLabelColor,textTransform:"uppercase",letterSpacing:"0.7px",marginBottom:5,fontFamily:"Montserrat,Arial,sans-serif",fontWeight:600}}>{c.label}</div>
                <div style={{fontSize:15,fontWeight:800,color:c.color,fontFamily:"Montserrat,Arial,sans-serif",lineHeight:1.2}}>{c.value}</div>
              </div>
            ))}
          </div>
          <div style={{padding:"11px 16px",borderRadius:9,background:isWorse?insightBgWorse:insightBgBetter,border:`1px solid ${isWorse?RED:GREEN}30`,fontSize:12,color:isWorse?insightTxtWorse:insightTxtBetter,fontFamily:"Montserrat,Arial,sans-serif",lineHeight:1.6}}>
            {isWorse
              ?`⚠️ With these assumptions, you need ${fmtINR(Math.abs(calc.sipDelta))}/month MORE in SIP. Consider retiring later or targeting higher returns.`
              :`✅ With these assumptions, you need ${fmtINR(Math.abs(calc.sipDelta))}/month LESS in SIP. Your plan looks more comfortable.`
            }
          </div>
        </>
      ):(
        <div style={{padding:16,textAlign:"center",color:subTextColor,fontSize:13}}>Retirement age must be greater than current age.</div>
      )}

      <p style={{fontSize:10,color:footerColor,marginTop:14,fontFamily:"Montserrat,Arial,sans-serif"}}>
        * Illustrative projections using PV of annuity formula. Not a guarantee of returns or investment advice.
      </p>
    </section>
  );
}
