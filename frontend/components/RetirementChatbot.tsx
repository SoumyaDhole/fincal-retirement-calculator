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

const DIRECT_API_KEY: string = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

export default function RetirementChatbot({ result, form }: ChatbotProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const systemPrompt = `You are FinCal Advisor by Optiwealth, a friendly educational retirement planning assistant built for FinCal at Technex'26 IIT (BHU) Varanasi, co-sponsored by HDFC Mutual Fund. Team: Optiwealth (Soumya Dhole, Shashwat Deshpande, Niraj Bhakte).

User's exact retirement numbers:
- Current age: ${form.currentAge}, Retirement age: ${form.retirementAge}, Life expectancy: ${form.lifeExpectancy}
- Years to retirement: ${result.yearsToRetirement}, Years in retirement: ${result.retirementYears}
- Current monthly expense: ${fmtINR(Number(form.monthlyExpense))}
- Future monthly expense at retirement: ${fmtINR(result.futureMonthlyExpense)}
- Required corpus: ${fmtINR(result.requiredCorpus)}
- Monthly SIP (flat): ${fmtINR(result.monthlySIP)}
${result.monthlyStepUpSIP ? `- Monthly SIP with ${form.stepUpRate}% step-up: ${fmtINR(result.monthlyStepUpSIP)}` : ""}
- Existing savings: ${fmtINR(Number(form.existingCorpus))}, at retirement: ${fmtINR(result.existingCorpusAtRetirement)}
- Monte Carlo success: ${result.successProbability.toFixed(1)}%, Corpus duration: ${result.yearsCorpusLasts} years
- Pre-retirement return: ${form.preReturn}%, Post-retirement: ${form.postReturn}%, Inflation: ${form.inflationRate}%
- Cost of 5-year delay: Extra ${fmtINR(result.regret.extraMonthlySIP)}/month

Rules: Use numbers above. Explain simply for beginners. Never guarantee returns. Under 150 words unless detailed explanation needed. Use INR format.
Always end EVERY response with exactly: 📌 Illustrative only — not investment advice or a recommendation for any HDFC Mutual Fund scheme.`;

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: `Hi! I'm your FinCal Advisor by **Optiwealth**. I can see you've calculated your retirement plan.\n\nYour required corpus is **${fmtINR(result.requiredCorpus)}** with a success probability of **${result.successProbability.toFixed(0)}%**.\n\nWhat would you like to understand better?`
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

    const apiBody = {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: systemPrompt,
      messages: newMessages.map(m => ({ role: m.role, content: m.content })),
    };

    // ── Try 1: Backend proxy ──────────────────────────────────────────────
    try {
      const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${BACKEND}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiBody),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        const reply = data?.content?.[0]?.text;
        if (reply) {
          setMessages(prev => [...prev, { role: "assistant", content: reply }]);
          setLoading(false);
          return;
        }
        const errMsg: string = data?.error || "";
        if (!errMsg.includes("ANTHROPIC_API_KEY") && !errMsg.includes("not set")) {
          throw new Error(errMsg || "Backend returned unexpected response");
        }
      } else {
        const data = await res.json().catch(() => ({}));
        const errMsg: string = data?.error || "";
        if (!errMsg.includes("ANTHROPIC_API_KEY")) throw new Error(errMsg || `Backend returned ${res.status}`);
      }
    } catch (e: any) {
      const msg: string = e?.message || "";
      const isNetworkError = msg.includes("abort") || msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("ECONNREFUSED");
      const isKeyError = msg.includes("ANTHROPIC_API_KEY") || msg.includes("not set");
      if (!isNetworkError && !isKeyError) {
        setError(msg || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
    }

    // ── Try 2: Direct Gemini API fallback ─────────────────────────────────
    try {
      const geminiMessages = newMessages.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${DIRECT_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: geminiMessages,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Gemini API error ${res.status}`);
      }
      const data = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I could not generate a response.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (e: any) {
      setError(e?.message || "Network error. Please check your connection and try again.");
    }
    setLoading(false);
  };

  const renderMsg = (text: string) =>
    text.split("\n").map((line, i, arr) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={i}>
          {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
          {i < arr.length - 1 && <br />}
        </span>
      );
    });

  // ── Mobile: full screen. Desktop: 384px popup ──
  const windowStyle: React.CSSProperties = isMobile ? {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    width: "100%",
    height: "100%",
    borderRadius: 0,
    bottom: 0,
    right: 0,
    background: "#1a1d27",
    boxShadow: "none",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    border: "none",
    animation: "chatSlideUp 0.28s cubic-bezier(0.34,1.56,0.64,1)",
  } : {
    position: "fixed",
    bottom: 80,
    right: 24,
    zIndex: 1000,
    width: 384,
    height: 580,
    background: "#1a1d27",
    borderRadius: 18,
    boxShadow: "0 12px 60px rgba(0,0,0,0.55)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    border: "1px solid #2c3a5a",
    animation: "chatSlideUp 0.28s cubic-bezier(0.34,1.56,0.64,1)",
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Open Optiwealth FinCal AI Advisor"
          style={{ position: "fixed", bottom: 72, right: 24, zIndex: 999, width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#224c87,#1a3a6b)", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 20px rgba(34,76,135,0.5)", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.2s,box-shadow 0.2s" }}
          onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "scale(1.12)"; b.style.boxShadow = "0 6px 28px rgba(34,76,135,0.65)"; }}
          onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = "scale(1)"; b.style.boxShadow = "0 4px 20px rgba(34,76,135,0.5)"; }}
        >
          💬
          <span style={{ position: "absolute", inset: -4, borderRadius: "50%", border: "2px solid rgba(34,76,135,0.5)", animation: "chatPulse 2s ease-out infinite" }} aria-hidden="true" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div role="dialog" aria-label="Optiwealth FinCal AI Retirement Advisor" aria-modal="true" style={windowStyle}>

          {/* Header */}
          <div style={{ background: "linear-gradient(135deg,#224c87,#1a3a6b)", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <svg width="38" height="38" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 9, flexShrink: 0 }} aria-hidden="true">
              <rect width="120" height="120" rx="24" fill="rgba(255,255,255,0.15)"/>
              <rect x="22" y="62" width="16" height="34" rx="4" fill="rgba(255,255,255,0.35)"/>
              <rect x="44" y="44" width="16" height="52" rx="4" fill="rgba(255,255,255,0.6)"/>
              <rect x="66" y="28" width="16" height="68" rx="4" fill="#ffffff"/>
              <polyline points="66,28 74,18 82,28" fill="none" stroke="#da3832" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="30" cy="62" r="3.5" fill="rgba(255,255,255,0.5)"/>
              <circle cx="52" cy="44" r="3.5" fill="rgba(255,255,255,0.7)"/>
              <circle cx="74" cy="28" r="3.5" fill="#ffffff"/>
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: "Montserrat,Arial,sans-serif", lineHeight: 1.1 }}>Optiwealth</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "Montserrat,Arial,sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", display: "inline-block" }} />
                FinCal Advisor · Technex '26
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat"
              style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer", borderRadius: 8, width: 34, height: 34, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>

          {/* Messages */}
          <div aria-live="polite" style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 12, background: "#0f1117" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 8, flexDirection: m.role === "user" ? "row-reverse" : "row", alignItems: "flex-end" }}>
                {m.role === "assistant" && (
                  <svg width="28" height="28" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: "50%", flexShrink: 0 }} aria-hidden="true">
                    <rect width="120" height="120" rx="60" fill="url(#grad)"/>
                    <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#224c87"/><stop offset="100%" stopColor="#1a3a6b"/></linearGradient></defs>
                    <rect x="28" y="66" width="14" height="30" rx="3" fill="rgba(255,255,255,0.4)"/>
                    <rect x="48" y="50" width="14" height="46" rx="3" fill="rgba(255,255,255,0.65)"/>
                    <rect x="68" y="34" width="14" height="62" rx="3" fill="#ffffff"/>
                    <polyline points="68,34 75,24 82,34" fill="none" stroke="#da3832" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: m.role === "user" ? "linear-gradient(135deg,#224c87,#1a3a6b)" : "#1e2235", color: m.role === "user" ? "#fff" : "#e2e8f0", fontSize: 13, lineHeight: 1.6, border: m.role === "assistant" ? "1px solid #2c3a5a" : "none", fontFamily: "Arial,sans-serif" }}>
                  {renderMsg(m.content)}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <svg width="28" height="28" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: "50%", flexShrink: 0 }} aria-hidden="true">
                  <rect width="120" height="120" rx="60" fill="url(#grad)"/>
                  <rect x="28" y="66" width="14" height="30" rx="3" fill="rgba(255,255,255,0.4)"/>
                  <rect x="48" y="50" width="14" height="46" rx="3" fill="rgba(255,255,255,0.65)"/>
                  <rect x="68" y="34" width="14" height="62" rx="3" fill="#ffffff"/>
                  <polyline points="68,34 75,24 82,34" fill="none" stroke="#da3832" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div style={{ padding: "12px 18px", borderRadius: "18px 18px 18px 4px", background: "#1e2235", border: "1px solid #2c3a5a", display: "flex", gap: 5, alignItems: "center" }}>
                  {[0, 1, 2].map(i => <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#4f7ec4", display: "inline-block", animation: `typingDot 1.4s ease-in-out ${i * 0.18}s infinite` }} />)}
                </div>
              </div>
            )}

            {error && (
              <div role="alert" style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", color: "#fca5a5", fontSize: 13, lineHeight: 1.6 }}>
                {error.split("\n").map((line, i) => (
                  line.startsWith("Fix") || line.startsWith("cd ") || line.startsWith("node ") || line.includes("ANTHROPIC_API_KEY=") || line.includes("backend/.env") || line.includes("RetirementChatbot")
                    ? <code key={i} style={{ display: "block", background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: 4, marginTop: 4, fontFamily: "monospace", fontSize: 12 }}>{line}</code>
                    : <span key={i} style={{ display: "block", marginTop: i > 0 ? 3 : 0 }}>{i === 0 ? "⚠ " : ""}{line}</span>
                ))}
              </div>
            )}

            {messages.length <= 1 && !loading && (
              <div style={{ marginTop: 4 }}>
                <p style={{ fontSize: 12, color: "#475569", marginBottom: 8, fontFamily: "Montserrat,Arial,sans-serif" }}>Suggested questions:</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {SUGGESTED.map(q => (
                    <button key={q} onClick={() => send(q)}
                      style={{ background: "#1e2235", border: "1px solid #2c3a5a", borderRadius: 10, padding: "9px 13px", fontSize: 13, color: "#93c5fd", cursor: "pointer", textAlign: "left", fontFamily: "Montserrat,Arial,sans-serif", transition: "all 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#252a3d"; e.currentTarget.style.borderColor = "#4f7ec4"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "#1e2235"; e.currentTarget.style.borderColor = "#2c3a5a"; }}
                    >{q}</button>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div style={{ padding: "12px 14px", borderTop: "1px solid #1e2235", background: "#1a1d27", flexShrink: 0 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#0f1117", borderRadius: 12, padding: "6px 6px 6px 14px", border: "1.5px solid #2c3a5a", transition: "border-color 0.15s" }}
              onFocusCapture={e => e.currentTarget.style.borderColor = "#4f7ec4"}
              onBlurCapture={e => e.currentTarget.style.borderColor = "#2c3a5a"}
            >
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Ask about your retirement plan…"
                disabled={loading} aria-label="Message" suppressHydrationWarning
                style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, outline: "none", fontFamily: "Arial,sans-serif", color: "#e2e8f0", padding: 0 }}
              />
              <button onClick={() => send()} disabled={loading || !input.trim()} aria-label="Send"
                style={{ width: 34, height: 34, borderRadius: 9, background: loading || !input.trim() ? "#1e2235" : "linear-gradient(135deg,#224c87,#1a3a6b)", color: "#fff", border: "none", cursor: loading || !input.trim() ? "not-allowed" : "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: loading || !input.trim() ? 0.4 : 1 }}>▶</button>
            </div>
            <p style={{ fontSize: 11, color: "#334155", marginTop: 8, textAlign: "center", fontFamily: "Montserrat,Arial,sans-serif" }}>
              Optiwealth · For education only · Not investment advice · Not a recommendation for any HDFC Mutual Fund scheme.
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatPulse { 0%{transform:scale(1);opacity:0.7}100%{transform:scale(1.8);opacity:0} }
        @keyframes chatSlideUp { from{opacity:0;transform:translateY(24px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes typingDot { 0%,60%,100%{transform:translateY(0);opacity:0.35}30%{transform:translateY(-6px);opacity:1} }
      `}</style>
    </>
  );
}
