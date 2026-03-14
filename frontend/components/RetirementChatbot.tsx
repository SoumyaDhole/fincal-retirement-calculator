"use client";

import { useState, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────
interface Message {
    role:    "user" | "assistant";
    content: string;
}

interface ChatbotProps {
    result: any;   // the full result object from calculateRetirement
    form:   any;   // the form values the user entered
}

// ─── Helpers ──────────────────────────────────────────────────────
const BLUE  = "#224c87";
const RED   = "#da3832";
const GREY  = "#919090";

function fmtINR(n: number) {
    if (n >= 1e7) return "₹" + (n / 1e7).toFixed(2) + " Cr";
    if (n >= 1e5) return "₹" + (n / 1e5).toFixed(1) + " L";
    return "₹ " + Math.round(n).toLocaleString("en-IN");
}

// ─── Suggested questions ──────────────────────────────────────────
const SUGGESTIONS = [
    "Is my retirement plan on track?",
    "What happens if I increase my SIP by ₹5,000?",
    "How does inflation affect my corpus?",
    "What is my biggest retirement risk?",
    "Explain my Monte Carlo result",
    "How much corpus will I have if I retire 5 years early?",
];

// ─── Build system prompt from result data ─────────────────────────
function buildSystemPrompt(result: any, form: any): string {
    const risk = result.successProbability >= 80 ? "SAFE"
        : result.successProbability >= 50 ? "MODERATE" : "RISKY";

    return `You are FinCal, a friendly and knowledgeable retirement planning advisor built for HDFC Mutual Fund's FinCal Innovation Hackathon.

You are having a conversation with an investor who has just calculated their retirement plan. Here are their exact numbers:

INVESTOR PROFILE:
- Current age: ${form.currentAge} years
- Planned retirement age: ${form.retirementAge} years
- Life expectancy: ${form.lifeExpectancy} years
- Years to retirement: ${Number(form.retirementAge) - Number(form.currentAge)} years
- Years in retirement: ${Number(form.lifeExpectancy) - Number(form.retirementAge)} years
- Current monthly expenses: ${fmtINR(Number(form.monthlyExpense))}
- Existing corpus / savings: ${fmtINR(Number(form.existingCorpus))}
- Assumed pre-retirement return: ${form.preReturn}% per year
- Assumed post-retirement return: ${form.postReturn}% per year
- Assumed inflation rate: ${form.inflationRate}% per year
- Annual SIP step-up rate: ${form.stepUpRate}% per year

CALCULATION RESULTS:
- Future monthly expense at retirement: ${fmtINR(result.futureMonthlyExpense)}
- Required retirement corpus: ${fmtINR(result.requiredCorpus)}
- Monthly SIP required (flat): ${fmtINR(result.monthlySIP)}
${result.monthlyStepUpSIP ? `- Monthly SIP with ${form.stepUpRate}% step-up: ${fmtINR(result.monthlyStepUpSIP)}` : ""}
${result.existingCorpusAtRetirement > 0 ? `- Existing savings at retirement (compounded): ${fmtINR(result.existingCorpusAtRetirement)}` : ""}
- Corpus may last: ${result.yearsCorpusLasts} years in retirement
- Monte Carlo success probability: ${Math.round(result.successProbability)}%
- Risk level: ${risk}
- Expense at retirement — General living: ${fmtINR(result.expenseBuckets.general)}, Medical: ${fmtINR(result.expenseBuckets.medical)}, Lifestyle: ${fmtINR(result.expenseBuckets.lifestyle)}

If they start now: ${fmtINR(result.regret.sipIfStartNow)}/month
If they delay ${result.regret.delayYears} years: ${fmtINR(result.regret.sipIfDelayed)}/month
Extra cost of delay: ${fmtINR(result.regret.extraTotalPaid)}

IMPORTANT RULES — follow these strictly:
1. Always refer to their ACTUAL numbers — never make up figures
2. Be warm, clear, and encouraging — not robotic
3. Always frame projections as ILLUSTRATIVE ESTIMATES based on assumed rates
4. Never guarantee returns or make performance commitments
5. Never recommend specific mutual fund schemes
6. If asked about specific funds or schemes, say: "I can help you understand retirement planning concepts, but for specific scheme recommendations please consult a SEBI-registered financial advisor."
7. Keep responses concise — 3 to 5 sentences unless a detailed explanation is needed
8. End every response with a brief disclaimer when discussing projections: "(Illustrative only — actual results may vary)"
9. This calculator is for Investor Education and Awareness purposes only`;
}

// ─── Message bubble ───────────────────────────────────────────────
function Bubble({ msg }: { msg: Message }) {
    const isUser = msg.role === "user";
    return (
        <div style={{
            display: "flex",
            justifyContent: isUser ? "flex-end" : "flex-start",
            marginBottom: 12
        }}>
            {!isUser && (
                <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: BLUE, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                    marginRight: 8, alignSelf: "flex-end"
                }}
                    aria-hidden="true"
                >
                    FC
                </div>
            )}
            <div style={{
                maxWidth: "78%",
                padding: "11px 14px",
                borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background:   isUser ? BLUE : "#f0f4fb",
                color:        isUser ? "#fff" : "#222",
                fontSize:     13,
                lineHeight:   1.65,
                fontFamily:   "Montserrat,Arial,sans-serif",
                whiteSpace:   "pre-wrap",
                wordBreak:    "break-word"
            }}>
                {msg.content}
            </div>
        </div>
    );
}

// ─── Typing indicator ─────────────────────────────────────────────
function TypingIndicator() {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: BLUE, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, flexShrink: 0
            }}
                aria-hidden="true"
            >FC</div>
            <div style={{
                padding: "12px 16px", borderRadius: "16px 16px 16px 4px",
                background: "#f0f4fb", display: "flex", gap: 5, alignItems: "center"
            }}
                aria-label="FinCal is typing"
                role="status"
            >
                {[0, 1, 2].map(i => (
                    <span key={i} style={{
                        width: 7, height: 7, borderRadius: "50%",
                        background: BLUE, display: "inline-block",
                        animation: "bounce 1.2s infinite",
                        animationDelay: `${i * 0.2}s`
                    }} />
                ))}
            </div>
        </div>
    );
}

// ─── Main Chatbot Component ───────────────────────────────────────
export default function RetirementChatbot({ result, form }: ChatbotProps) {
    const [messages,  setMessages]  = useState<Message[]>([
        {
            role: "assistant",
            content: `Hi! I'm FinCal, your retirement planning advisor. 👋\n\nI can see you've just calculated your retirement plan. Your required corpus is ${fmtINR(result.requiredCorpus)} with a success probability of ${Math.round(result.successProbability)}%.\n\nWhat would you like to understand better about your plan?`
        }
    ]);
    const [input,     setInput]     = useState("");
    const [loading,   setLoading]   = useState(false);
    const [isOpen,    setIsOpen]    = useState(false);
    const bottomRef   = useRef<HTMLDivElement>(null);
    const inputRef    = useRef<HTMLInputElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    const send = async (text?: string) => {
        const userText = (text ?? input).trim();
        if (!userText || loading) return;

        const newMessages: Message[] = [...messages, { role: "user", content: userText }];
        setMessages(newMessages);
        setInput("");
        setLoading(true);

        try {
            const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model:      "claude-sonnet-4-20250514",
                    max_tokens: 1000,
                    system:     buildSystemPrompt(result, form),
                    messages:   newMessages.map(m => ({
                        role:    m.role,
                        content: m.content
                    }))
                })
            });

            const data = await response.json();
            const reply = data.content?.[0]?.text ?? "I'm sorry, I couldn't process that. Please try again.";

            setMessages(prev => [...prev, { role: "assistant", content: reply }]);
        } catch {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "I'm having trouble connecting right now. Please try again in a moment."
            }]);
        }

        setLoading(false);
    };

    const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    };

    return (
        <>
            {/* Bounce keyframe */}
            <style>{`
                @keyframes bounce {
                    0%, 80%, 100% { transform: translateY(0); }
                    40%           { transform: translateY(-6px); }
                }
                @media (prefers-reduced-motion: reduce) {
                    @keyframes bounce { 0%, 100% { transform: none; } }
                }
            `}</style>

            {/* Floating button */}
            <button
                onClick={() => setIsOpen(o => !o)}
                aria-label={isOpen ? "Close retirement advisor chat" : "Open retirement advisor chat"}
                aria-expanded={isOpen}
                aria-controls="chatbot-panel"
                style={{
                    position:     "fixed",
                    bottom:       80,
                    right:        24,
                    width:        56,
                    height:       56,
                    borderRadius: "50%",
                    background:   BLUE,
                    color:        "#fff",
                    border:       "none",
                    cursor:       "pointer",
                    fontSize:     24,
                    zIndex:       1000,
                    boxShadow:    "0 4px 16px rgba(34,76,135,0.35)",
                    display:      "flex",
                    alignItems:   "center",
                    justifyContent: "center",
                    transition:   "transform 0.2s, background 0.2s"
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#1b3c6e")}
                onMouseLeave={e => (e.currentTarget.style.background = BLUE)}
            >
                {isOpen ? "✕" : "💬"}
            </button>

            {/* Chat panel */}
            <div
                id="chatbot-panel"
                role="dialog"
                aria-label="FinCal retirement advisor chat"
                aria-modal="false"
                style={{
                    position:     "fixed",
                    bottom:       148,
                    right:        24,
                    width:        360,
                    maxWidth:     "calc(100vw - 32px)",
                    height:       520,
                    borderRadius: 16,
                    background:   "#fff",
                    boxShadow:    "0 8px 40px rgba(0,0,0,0.18)",
                    display:      isOpen ? "flex" : "none",
                    flexDirection: "column",
                    zIndex:       999,
                    border:       `1px solid ${BLUE}22`,
                    overflow:     "hidden"
                }}
            >
                {/* Header */}
                <div style={{
                    background:  BLUE, color: "#fff",
                    padding:     "14px 16px",
                    display:     "flex", alignItems: "center", gap: 10,
                    flexShrink:  0
                }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "rgba(255,255,255,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16
                    }}>
                        🤖
                    </div>
                    <div>
                        <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>FinCal Advisor</p>
                        <p style={{ fontSize: 11, margin: 0, opacity: 0.8 }}>
                            Knows your retirement numbers
                        </p>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        aria-label="Close chat"
                        style={{
                            marginLeft:   "auto",
                            background:   "transparent",
                            border:       "none",
                            color:        "#fff",
                            fontSize:     18,
                            cursor:       "pointer",
                            padding:      "4px 8px",
                            borderRadius: 4
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Messages */}
                <div style={{
                    flex:       1,
                    overflowY:  "auto",
                    padding:    "14px 12px",
                    display:    "flex",
                    flexDirection: "column"
                }}
                    role="log"
                    aria-live="polite"
                    aria-label="Chat messages"
                >
                    {messages.map((m, i) => <Bubble key={i} msg={m} />)}
                    {loading && <TypingIndicator />}
                    <div ref={bottomRef} />
                </div>

                {/* Suggestions */}
                {messages.length <= 2 && !loading && (
                    <div style={{
                        padding:    "8px 12px",
                        borderTop:  "1px solid #f0f0f0",
                        display:    "flex",
                        flexWrap:   "wrap",
                        gap:        6,
                        flexShrink: 0
                    }}>
                        {SUGGESTIONS.slice(0, 4).map(s => (
                            <button
                                key={s}
                                onClick={() => send(s)}
                                style={{
                                    fontSize:     11,
                                    padding:      "5px 10px",
                                    borderRadius: 20,
                                    border:       `1px solid ${BLUE}44`,
                                    background:   "#f0f4fb",
                                    color:        BLUE,
                                    cursor:       "pointer",
                                    fontFamily:   "Montserrat,Arial,sans-serif",
                                    fontWeight:   500,
                                    lineHeight:   1.4,
                                    textAlign:    "left"
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input */}
                <div style={{
                    padding:    "10px 12px",
                    borderTop:  "1px solid #f0f0f0",
                    display:    "flex",
                    gap:        8,
                    flexShrink: 0,
                    background: "#fafafa"
                }}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="Ask about your retirement plan…"
                        disabled={loading}
                        aria-label="Type your question"
                        style={{
                            flex:         1,
                            padding:      "9px 12px",
                            border:       "1.5px solid #e0e0e0",
                            borderRadius: 20,
                            fontSize:     13,
                            fontFamily:   "Montserrat,Arial,sans-serif",
                            outline:      "none",
                            background:   "#fff",
                            color:        "#1a1a1a"
                        }}
                        onFocus={e => e.target.style.borderColor = BLUE}
                        onBlur={e  => e.target.style.borderColor = "#e0e0e0"}
                    />
                    <button
                        onClick={() => send()}
                        disabled={!input.trim() || loading}
                        aria-label="Send message"
                        style={{
                            width:        38,
                            height:       38,
                            borderRadius: "50%",
                            background:   !input.trim() || loading ? "#e0e0e0" : BLUE,
                            border:       "none",
                            color:        "#fff",
                            cursor:       !input.trim() || loading ? "not-allowed" : "pointer",
                            fontSize:     16,
                            display:      "flex",
                            alignItems:   "center",
                            justifyContent: "center",
                            flexShrink:   0,
                            transition:   "background 0.15s"
                        }}
                    >
                        ➤
                    </button>
                </div>

                {/* Compliance footer */}
                <div style={{
                    padding:    "6px 12px",
                    background: "#f7f9fc",
                    borderTop:  "1px solid #f0f0f0",
                    fontSize:   9,
                    color:      GREY,
                    lineHeight: 1.5,
                    flexShrink: 0
                }}>
                    For education only. Not investment advice. Not a recommendation for any HDFC Mutual Fund scheme.
                </div>
            </div>
        </>
    );
}
