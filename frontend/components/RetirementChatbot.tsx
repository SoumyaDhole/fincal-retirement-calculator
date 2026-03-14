"use client";

import { useState, useRef, useEffect } from "react";

interface ChatbotProps { result: any; form: any; }
interface Message { role: "user" | "assistant"; content: string; }

function fmtINR(n: number) {
  if (n >= 1e7) return "₹" + (n / 1e7).toFixed(2) + " Cr";
  if (n >= 1e5) return "₹" + (n / 1e5).toFixed(1) + " L";
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

const SUGGESTED = [
  "How can I improve my success probability?",
  "What if I retire 5 years later?",
  "Is my SIP realistic for my income?",
  "Explain the Monte Carlo result simply",
];

export default function RetirementChatbot({ result, form }: ChatbotProps) {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const bottomRef               = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLInputElement>(null);

  const systemPrompt = `You are FinCal Advisor, a friendly educational retirement planning assistant for FinCal at Technex'26 IIT (BHU) Varanasi, co-sponsored by HDFC Mutual Fund.

User's retirement numbers:
- Current age: ${form.currentAge}, Retirement age: ${form.retirementAge}, Life expectancy: ${form.lifeExpectancy}
- Years to retirement: ${result.yearsToRetirement}, Years in retirement: ${result.retirementYears}
- Current monthly expense: ${fmtINR(Number(form.monthlyExpense))}
- Future monthly expense at retirement: ${fmtINR(result.futureMonthlyExpense)}
- Required corpus: ${fmtINR(result.requiredCorpus)}
- Monthly SIP (flat): ${fmtINR(result.monthlySIP)}
${result.monthlyStepUpSIP ? `- Monthly SIP with ${form.stepUpRate}% step-up: ${fmtINR(result.monthlyStepUpSIP)}` : ""}
- Existing savings: ${fmtINR(Number(form.existingCorpus))}, at retirement: ${fmtINR(result.existingCorpusAtRetirement)}
- Monte Carlo success: ${result.successProbability.toFixed(1)}%, Corpus duration: ${result.yearsCorpusLasts} years
- Pre-retirement return: ${form.preReturn}%, Post-retirement return: ${form.postReturn}%, Inflation: ${form.inflationRate}%
- Cost of 5-year delay: Extra ${fmtINR(result.regret.extraMonthlySIP)}/month

Rules:
1. Use the exact numbers above when answering
2. Explain concepts simply for beginners
3. Be honest about risks, never guarantee returns
4. Keep responses under 150 words unless detailed explanation needed
5. Use INR format and Indian financial context
6. End EVERY response with: 📌 Illustrative only — not investment advice or a recommendation for any HDFC Mutual Fund scheme.`;

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: `Hi! I can see you've just calculated your retirement plan. Your required corpus is **${fmtINR(result.requiredCorpus)}** with a success probability of **${result.successProbability.toFixed(0)}%**.\n\nWhat would you like to understand better about your plan?`
      }]);
    }
  }, [open]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); }, [open]);

  const send = async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;
    setInput(""); setError("");
    const newMessages: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);
    try {
      // ── Uses /api/chat proxy on backend (fixes 404 + CORS) ──────
      // Make sure backend/server.js has the POST /api/chat route.
      // Make sure backend/.env has ANTHROPIC_API_KEY=sk-ant-...
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 400,
          system: systemPrompt,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error || `Server error ${res.status}`);
      }
      const data = await res.json();
      const reply = data?.content?.[0]?.text || data?.data?.content?.[0]?.text || "Sorry, couldn't generate a response.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err: any) {
      const m = err?.message ?? "";
      setError(m.includes("fetch") || m.includes("Failed")
        ? "Cannot reach backend — make sure it's running on port 5000 with ANTHROPIC_API_KEY set in .env"
        : m || "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const renderMsg = (text: string) =>
    text.split("\n").map((line, i, arr) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return <span key={i}>{parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}{i < arr.length - 1 && <br />}</span>;
    });

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Open FinCal AI Advisor"
          style={{ position:"fixed",bottom:72,right:24,zIndex:999,width:56,height:56,borderRadius:"50%",background:"linear-gradient(135deg,#224c87,#1a3a6b)",color:"#fff",border:"none",cursor:"pointer",boxShadow:"0 4px 20px rgba(34,76,135,0.45)",fontSize:22,display:"flex",alignItems:"center",justifyContent:"center",transition:"transform 0.2s" }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.1)"}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"}
        >
          💬
          <span style={{ position:"absolute",inset:-4,borderRadius:"50%",border:"2px solid #224c87",animation:"chatPulse 2s ease-out infinite",opacity:0.6 }} aria-hidden="true" />
        </button>
      )}

      {open && (
        <div role="dialog" aria-label="FinCal AI Retirement Advisor" aria-modal="true"
          style={{ position:"fixed",bottom:72,right:24,zIndex:1000,width:380,height:560,background:"#1a1d27",borderRadius:16,boxShadow:"0 8px 48px rgba(0,0,0,0.5)",display:"flex",flexDirection:"column",overflow:"hidden",border:"1px solid #2c3a5a",animation:"chatSlideUp 0.25s ease-out" }}
        >
          {/* Header */}
          <div style={{ background:"linear-gradient(135deg,#224c87,#1a3a6b)",padding:"14px 16px",display:"flex",alignItems:"center",gap:12,flexShrink:0 }}>
            <div style={{ width:38,height:38,borderRadius:"50%",background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>🤖</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14,fontWeight:700,color:"#fff",fontFamily:"Montserrat,Arial,sans-serif" }}>FinCal Advisor</div>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.7)" }}>Knows your retirement numbers</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close advisor"
              style={{ background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",cursor:"pointer",borderRadius:6,width:28,height:28,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
          </div>

          {/* Messages */}
          <div style={{ flex:1,overflowY:"auto",padding:"16px 14px",display:"flex",flexDirection:"column",gap:12,background:"#12151f" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display:"flex",gap:8,flexDirection:m.role==="user"?"row-reverse":"row",alignItems:"flex-end" }}>
                {m.role === "assistant" && (
                  <div style={{ width:28,height:28,borderRadius:"50%",background:"#224c87",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0 }}>FC</div>
                )}
                <div style={{ maxWidth:"78%",padding:"10px 13px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?"linear-gradient(135deg,#224c87,#1a3a6b)":"#1e2235",color:m.role==="user"?"#fff":"#e2e8f0",fontSize:13,lineHeight:1.55,boxShadow:m.role==="user"?"0 2px 8px rgba(34,76,135,0.4)":"0 1px 4px rgba(0,0,0,0.3)",border:m.role==="assistant"?"1px solid #2c3a5a":"none",fontFamily:"Georgia,'Times New Roman',serif" }}>
                  {renderMsg(m.content)}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display:"flex",gap:8,alignItems:"flex-end" }}>
                <div style={{ width:28,height:28,borderRadius:"50%",background:"#224c87",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0 }}>FC</div>
                <div style={{ padding:"12px 16px",borderRadius:"16px 16px 16px 4px",background:"#1e2235",border:"1px solid #2c3a5a",display:"flex",gap:4,alignItems:"center" }}>
                  {[0,1,2].map(i => <span key={i} style={{ width:7,height:7,borderRadius:"50%",background:"#4f7ec4",display:"inline-block",animation:`typingDot 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}
                </div>
              </div>
            )}
            {error && (
              <div style={{ padding:"10px 13px",borderRadius:8,background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.3)",color:"#f87171",fontSize:12 }}>⚠ {error}</div>
            )}
            {messages.length <= 1 && !loading && (
              <div style={{ marginTop:4 }}>
                <p style={{ fontSize:11,color:"#64748b",marginBottom:8,fontFamily:"Montserrat,Arial,sans-serif" }}>Suggested questions:</p>
                <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                  {SUGGESTED.map(q => (
                    <button key={q} onClick={() => send(q)}
                      style={{ background:"#1e2235",border:"1px solid #2c3a5a",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#93c5fd",cursor:"pointer",textAlign:"left",fontFamily:"Montserrat,Arial,sans-serif",transition:"background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#252a3d")}
                      onMouseLeave={e => (e.currentTarget.style.background = "#1e2235")}
                    >{q}</button>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding:"10px 12px",borderTop:"1px solid #2c3a5a",background:"#1a1d27",flexShrink:0 }}>
            <div style={{ display:"flex",gap:8,alignItems:"center" }}>
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Ask about your retirement plan…"
                disabled={loading} aria-label="Message to FinCal Advisor"
                suppressHydrationWarning
                style={{ flex:1,border:"1.5px solid #2c3a5a",borderRadius:10,padding:"9px 13px",fontSize:13,outline:"none",fontFamily:"Georgia,'Times New Roman',serif",background:"#12151f",color:"#e2e8f0" }}
                onFocus={e => e.target.style.borderColor = "#4f7ec4"}
                onBlur={e => e.target.style.borderColor = "#2c3a5a"}
              />
              <button onClick={() => send()} disabled={loading || !input.trim()} aria-label="Send message"
                style={{ width:38,height:38,borderRadius:"50%",background:loading||!input.trim()?"#2c3a5a":"linear-gradient(135deg,#224c87,#1a3a6b)",color:"#fff",border:"none",cursor:loading||!input.trim()?"not-allowed":"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>▶</button>
            </div>
            <p style={{ fontSize:10,color:"#475569",marginTop:7,textAlign:"center",fontFamily:"Montserrat,Arial,sans-serif" }}>
              For education only. Not investment advice. Not a recommendation for any HDFC Mutual Fund scheme.
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatPulse { 0%{transform:scale(1);opacity:0.6}100%{transform:scale(1.7);opacity:0} }
        @keyframes chatSlideUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
        @keyframes typingDot { 0%,60%,100%{transform:translateY(0);opacity:0.4}30%{transform:translateY(-5px);opacity:1} }
      `}</style>
    </>
  );
}
