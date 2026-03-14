// frontend/components/PDFExport.tsx
"use client";
import { useState } from "react";

interface PDFExportProps {
  results: {
    requiredCorpus: number;
    monthlySIP: number;
    monthlyStepUpSIP: number | null;
    futureMonthlyExpense: number;
    monthlyIncomeInTodaysMoney: number;
    successProbability: number;
    yearsCorpusLasts: number;
    yearsToRetirement: number;
    retirementYears: number;
    regret: {
      sipIfStartNow: number;
      sipIfDelayed: number;
      extraMonthlySIP: number;
    };
    expenseBuckets: {
      general: number;
      medical: number;
      lifestyle: number;
    };
  };
  inputs: {
    currentAge: number;
    retirementAge: number;
    lifeExpectancy: number;
    monthlyExpense: number;
    preReturn: number;
    postReturn: number;
    inflationRate: number;
  };
}

function formatINR(val: number): string {
  if (val >= 1e7) return `₹${(val / 1e7).toFixed(2)} Cr`;
  if (val >= 1e5) return `₹${(val / 1e5).toFixed(2)} L`;
  return `₹${Math.round(val).toLocaleString("en-IN")}`;
}

export default function PDFExport({ results, inputs }: PDFExportProps) {
  const [loading, setLoading] = useState(false);

  const generatePDF = async () => {
    setLoading(true);
    try {
      // Dynamically import to keep bundle lean
      const jsPDFModule = await import("jspdf");
      const jsPDF = jsPDFModule.default;
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const W = 210; // A4 width mm
      const BLUE  = [34, 76, 135]  as [number,number,number];
      const RED   = [218, 56, 50]  as [number,number,number];
      const GREY  = [145, 144, 144] as [number,number,number];
      const WHITE = [255, 255, 255] as [number,number,number];
      const LIGHT = [245, 248, 253] as [number,number,number];

      let y = 0;

      // ── Header bar ─────────────────────────────────────────────
      doc.setFillColor(...BLUE);
      doc.rect(0, 0, W, 36, "F");
      doc.setTextColor(...WHITE);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("FinCal", 14, 16);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Retirement Planning Report", 14, 24);
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}`, W - 14, 16, { align: "right" });
      doc.text("Co-sponsored by HDFC Mutual Fund | Technex'26", W - 14, 24, { align: "right" });

      y = 46;

      // ── Section: Your Profile ───────────────────────────────────
      doc.setFillColor(...LIGHT);
      doc.rect(14, y, W - 28, 22, "F");
      doc.setTextColor(...BLUE);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Your Profile", 20, y + 8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const profileItems = [
        `Current Age: ${inputs.currentAge}`,
        `Retirement Age: ${inputs.retirementAge}`,
        `Life Expectancy: ${inputs.lifeExpectancy}`,
        `Monthly Expense: ${formatINR(inputs.monthlyExpense)}`,
        `Pre-ret. Return: ${(inputs.preReturn*100).toFixed(1)}%`,
        `Post-ret. Return: ${(inputs.postReturn*100).toFixed(1)}%`,
        `Inflation: ${(inputs.inflationRate*100).toFixed(1)}%`,
      ];
      profileItems.forEach((item, i) => {
        doc.text(item, 20 + (i % 4) * 46, y + 16 + Math.floor(i / 4) * 6);
      });

      y += 30;

      // ── Section: Key Results ────────────────────────────────────
      const drawCard = (x: number, cy: number, w: number, h: number, label: string, value: string, color: [number,number,number]) => {
        doc.setFillColor(...WHITE);
        doc.setDrawColor(...color);
        doc.setLineWidth(0.5);
        doc.roundedRect(x, cy, w, h, 2, 2, "FD");
        doc.setFillColor(...color);
        doc.rect(x, cy, 3, h, "F");
        doc.setTextColor(...GREY);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.text(label.toUpperCase(), x + 7, cy + 8);
        doc.setTextColor(...color);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(value, x + 7, cy + 17);
      };

      doc.setTextColor(...BLUE);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Key Results", 14, y + 6);
      y += 10;

      const cardW = (W - 28 - 12) / 4;
      const cards = [
        { label: "Required Corpus",       value: formatINR(results.requiredCorpus),           color: BLUE },
        { label: "Monthly SIP Needed",    value: formatINR(results.monthlySIP),                color: BLUE },
        { label: "Success Probability",   value: `${results.successProbability.toFixed(1)}%`,  color: results.successProbability >= 75 ? [42,107,30] as [number,number,number] : RED },
        { label: "Corpus Lasts",          value: `${results.yearsCorpusLasts} yrs`,            color: BLUE },
      ];
      cards.forEach((c, i) => drawCard(14 + i * (cardW + 4), y, cardW, 24, c.label, c.value, c.color));
      y += 32;

      if (results.monthlyStepUpSIP) {
        const cards2 = [
          { label: "Step-Up SIP (10% p.a.)", value: formatINR(results.monthlyStepUpSIP), color: BLUE },
          { label: "Future Monthly Expense",  value: formatINR(results.futureMonthlyExpense), color: GREY },
          { label: "Today's Money Equiv.",    value: formatINR(results.monthlyIncomeInTodaysMoney), color: GREY },
          { label: "Years to Retirement",     value: `${results.yearsToRetirement} yrs`, color: BLUE },
        ];
        cards2.forEach((c, i) => drawCard(14 + i * (cardW + 4), y, cardW, 24, c.label, c.value, c.color));
        y += 32;
      }

      // ── Section: Inflation Buckets ──────────────────────────────
      doc.setTextColor(...BLUE);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Future Monthly Expense Breakdown", 14, y + 6);
      y += 10;

      const buckets = [
        { label: "General (6% inflation)",   val: results.expenseBuckets.general,   pct: 60 },
        { label: "Medical (8% inflation)",   val: results.expenseBuckets.medical,   pct: 25 },
        { label: "Lifestyle (4% inflation)", val: results.expenseBuckets.lifestyle, pct: 15 },
      ];
      const barW = W - 28;
      buckets.forEach((b, i) => {
        doc.setTextColor(60, 60, 60);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(b.label, 14, y + i * 12 + 5);
        doc.text(formatINR(b.val), W - 14, y + i * 12 + 5, { align: "right" });
        doc.setFillColor(230, 236, 245);
        doc.rect(14, y + i * 12 + 7, barW, 3, "F");
        doc.setFillColor(...BLUE);
        doc.rect(14, y + i * 12 + 7, barW * (b.pct / 100), 3, "F");
      });
      y += 44;

      // ── Section: Regret Calculator ──────────────────────────────
      doc.setFillColor(255, 245, 245);
      doc.rect(14, y, W - 28, 28, "F");
      doc.setDrawColor(...RED);
      doc.setLineWidth(0.3);
      doc.rect(14, y, W - 28, 28, "D");
      doc.setTextColor(...RED);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Cost of Waiting 5 Years", 20, y + 8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(`SIP if you start now: ${formatINR(results.regret.sipIfStartNow)}/mo`, 20, y + 16);
      doc.text(`SIP if you wait 5 years: ${formatINR(results.regret.sipIfDelayed)}/mo`, 20, y + 22);
      doc.text(`Extra SIP penalty: ${formatINR(results.regret.extraMonthlySIP)}/mo`, 110, y + 16);
      y += 36;

      // ── Assumptions box ─────────────────────────────────────────
      doc.setFillColor(...LIGHT);
      doc.rect(14, y, W - 28, 22, "F");
      doc.setTextColor(...GREY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("ASSUMPTIONS DISCLOSED", 20, y + 7);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text(
        `Pre-retirement return: ${(inputs.preReturn*100).toFixed(1)}% p.a. | Post-retirement return: ${(inputs.postReturn*100).toFixed(1)}% p.a. | ` +
        `General inflation: 6% | Medical inflation: 8% | Lifestyle inflation: 4% | ` +
        `Monte Carlo: 1,000 simulations, volatility = 50% of mean return`,
        20, y + 14, { maxWidth: W - 40 }
      );
      y += 30;

      // ── Mandatory HDFC Disclaimer ───────────────────────────────
      doc.setFillColor(...BLUE);
      doc.rect(0, y, W, 24, "F");
      doc.setTextColor(...WHITE);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(
        "This tool has been designed for information purposes only. Actual results may vary depending on various factors involved in capital market. " +
        "Investor should not consider above as a recommendation for any schemes of HDFC Mutual Fund. " +
        "Past performance may or may not be sustained in future and is not a guarantee of any future returns.",
        14, y + 8, { maxWidth: W - 28 }
      );
      doc.setFont("helvetica", "bold");
      doc.text("HDFC Mutual Fund | FinCal Innovation Hackathon | Technex'26, IIT (BHU) Varanasi", W / 2, y + 20, { align: "center" });

      doc.save("FinCal_Retirement_Report.pdf");
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("PDF generation failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <button
      onClick={generatePDF}
      disabled={loading}
      aria-label="Download retirement report as PDF"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: loading ? "#919090" : "#224c87",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: "12px 24px",
        fontSize: 14,
        fontWeight: 700,
        fontFamily: "Montserrat, Arial, sans-serif",
        cursor: loading ? "not-allowed" : "pointer",
        transition: "background 0.2s",
        boxShadow: "0 2px 8px rgba(34,76,135,0.25)"
      }}
    >
      {loading ? "Generating PDF…" : "⬇ Download Report (PDF)"}
    </button>
  );
}