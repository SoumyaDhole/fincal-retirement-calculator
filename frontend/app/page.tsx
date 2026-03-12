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

  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]: Number(e.target.value)
    });
  };

  const calculateRetirement = async () => {

    const res = await fetch(
      "http://localhost:5000/api/retirement/calculate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      }
    );

    const data = await res.json();

    setResult(data.data);
  };

  return (
    <div style={{ padding: 40 }}>

      <h1>FinCal Retirement Calculator</h1>

      <input
        name="currentAge"
        placeholder="Current Age"
        onChange={handleChange}
      />
      <br /><br />

      <input
        name="retirementAge"
        placeholder="Retirement Age"
        onChange={handleChange}
      />
      <br /><br />

      <input
        name="lifeExpectancy"
        placeholder="Life Expectancy (e.g. 90)"
        onChange={handleChange}
      />
      <br /><br />

      <input
        name="monthlyExpense"
        placeholder="Monthly Expense"
        onChange={handleChange}
      />
      <br /><br />

      <input
        name="inflationRate"
        placeholder="Inflation Rate (0.06)"
        onChange={handleChange}
      />
      <br /><br />

      <input
        name="preReturn"
        placeholder="Pre-Retirement Return (0.10)"
        onChange={handleChange}
      />
      <br /><br />

      <input
        name="postReturn"
        placeholder="Post-Retirement Return (0.07)"
        onChange={handleChange}
      />
      <br /><br />

      <button onClick={calculateRetirement}>
        Calculate Retirement
      </button>

      {result && (
        <div style={{ marginTop: 30 }}>

          <h2>Results</h2>

          <p>
            Future Monthly Expense: ₹
            {Math.round(result.futureMonthlyExpense)}
          </p>

          <p>
            Required Corpus: ₹
            {Math.round(result.requiredCorpus)}
          </p>

          <p>
            Monthly SIP Needed: ₹
            {Math.round(result.monthlySIP)}
          </p>

          <p>
            Corpus Lasts: {result.yearsCorpusLasts} years
          </p>

          <p>
            Retirement Success Probability: 
            {Math.round(result.successProbability)}%
          </p>

          {/* Timeline Chart */}
          <RetirementChart timeline={result.timeline} />

        </div>
      )}

    </div>
  );
}