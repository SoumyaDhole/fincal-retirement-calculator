"use client";

import { useState } from "react";
import RetirementChart from "../components/RetirementChart";

export default function Home() {

  const [form, setForm] = useState({
    currentAge: "",
    retirementAge: "",
    lifeExpectancy: "",
    monthlyExpense: "",
    inflationRate: "",
    preReturn: "",
    postReturn: ""
  });

  const [result, setResult] = useState<any>(null);
  const [scenario, setScenario] = useState("moderate");

  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]: Number(e.target.value)
    });
  };

  const applyScenario = (type: string) => {

    setScenario(type);

    if (type === "conservative") {
      setForm({ ...form, preReturn: 0.07, postReturn: 0.05 });
    }

    if (type === "moderate") {
      setForm({ ...form, preReturn: 0.10, postReturn: 0.07 });
    }

    if (type === "aggressive") {
      setForm({ ...form, preReturn: 0.12, postReturn: 0.09 });
    }
  };

  const calculateRetirement = async () => {

    const res = await fetch(
      "http://localhost:5000/api/retirement/calculate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      }
    );

    const data = await res.json();
    setResult(data.data);
  };

  const getRiskLevel = (prob: number) => {
    if (prob >= 80) return "SAFE";
    if (prob >= 50) return "MODERATE";
    return "RISKY";
  };

  const riskColor = (prob: number) => {
    if (prob >= 80) return "#e6f4ea";
    if (prob >= 50) return "#fff4e5";
    return "#fdecea";
  };

  return (

    <div className="max-w-5xl mx-auto p-10 bg-white rounded-xl shadow-md">

      <h1 className="text-3xl font-bold text-[var(--primary-blue)]">
        FinCal Retirement Calculator
      </h1>

      {/* SCENARIO */}

      <div className="mt-6">
        <h3 className="font-semibold mb-2">Investment Scenario</h3>

        {["conservative","moderate","aggressive"].map((type) => (

          <button
            key={type}
            onClick={() => applyScenario(type)}
            style={{
              marginRight: 10,
              backgroundColor:
                scenario === type ? "#224c87" : "#f1f1f1",
              color:
                scenario === type ? "white" : "#333"
            }}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>

        ))}
      </div>

      {/* FORM */}

      <div className="mt-8 space-y-4">

        <Input label="Current Age" name="currentAge" onChange={handleChange} />
        <Input label="Retirement Age" name="retirementAge" onChange={handleChange} />
        <Input label="Life Expectancy" name="lifeExpectancy" onChange={handleChange} />
        <Input label="Monthly Expense" name="monthlyExpense" onChange={handleChange} />
        <Input label="Inflation Rate" name="inflationRate" onChange={handleChange} />
        <Input label="Pre-Retirement Return" name="preReturn" onChange={handleChange} />
        <Input label="Post-Retirement Return" name="postReturn" onChange={handleChange} />

        <button onClick={calculateRetirement}>
          Calculate Retirement
        </button>

      </div>

      {/* RESULTS */}

      {result && (

        <div className="mt-10">

          <h2 className="text-xl font-semibold mb-4">
            Retirement Results
          </h2>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5">

            <Card title="Future Monthly Expense" value={result.futureMonthlyExpense} />
            <Card title="Required Corpus" value={result.requiredCorpus} />
            <Card title="Monthly SIP Needed" value={result.monthlySIP} />

            <div className="card">
              <h3>Corpus Duration</h3>
              <p>{result.yearsCorpusLasts} years</p>
            </div>

            <div className="card">
              <h3>Success Probability</h3>
              <p>{Math.round(result.successProbability)}%</p>
            </div>

          </div>

          {/* RISK */}

          <div className="mt-6">

            <h3 className="font-semibold mb-2">
              Retirement Risk Level
            </h3>

            <div
              style={{
                background: riskColor(result.successProbability),
                padding: 12,
                borderRadius: 6,
                fontWeight: "bold"
              }}
            >
              {getRiskLevel(result.successProbability)}
            </div>

          </div>

          {/* CHART */}

          <div className="mt-10">
            <h2 className="text-xl font-semibold mb-4">
              Retirement Wealth Timeline
            </h2>

            <RetirementChart timeline={result.timeline} />

          </div>

        </div>

      )}

      {/* DISCLAIMER */}

      <div className="mt-10 text-sm text-gray-500 border-t pt-5">

        <p>
          This tool has been designed for information purposes only.
          Actual results may vary depending on various factors involved in capital market.
        </p>

        <p>
          Investor should not consider above as a recommendation for any schemes of HDFC Mutual Fund.
          Past performance may or may not be sustained in future and is not a guarantee of any future returns.
        </p>

      </div>

    </div>

  );
}

function Input({ label, name, onChange }: any) {

  return (
    <div>
      <label className="block font-medium mb-1">{label}</label>
      <input type="number" name={name} onChange={onChange} />
    </div>
  );

}

function Card({ title, value }: any) {

  return (
    <div className="card">
      <h3>{title}</h3>
      <p>₹ {Math.round(value)}</p>
    </div>
  );

}