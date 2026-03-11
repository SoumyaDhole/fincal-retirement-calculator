"use client";

import { useState } from "react";

export default function Home() {

  const [currentAge, setCurrentAge] = useState("");
  const [retirementAge, setRetirementAge] = useState("");
  const [expense, setExpense] = useState("");
  const [inflation, setInflation] = useState("");
  const [preReturn, setPreReturn] = useState("");
  const [postReturn, setPostReturn] = useState("");
  const [years, setYears] = useState("");

  const [result, setResult] = useState<any>(null);

  const calculateRetirement = async () => {

    const response = await fetch("http://localhost:5000/retirement", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        currentAge: Number(currentAge),
        retirementAge: Number(retirementAge),
        currentExpense: Number(expense),
        inflationRate: Number(inflation),
        preReturn: Number(preReturn),
        postReturn: Number(postReturn),
        retirementYears: Number(years)
      })
    });

    const data = await response.json();
    setResult(data);
  };

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>

      <h1>Retirement Planning Calculator</h1>

      <div style={{ display: "grid", gap: "10px", maxWidth: "400px" }}>

        <input placeholder="Current Age"
          value={currentAge}
          onChange={(e) => setCurrentAge(e.target.value)}
        />

        <input placeholder="Retirement Age"
          value={retirementAge}
          onChange={(e) => setRetirementAge(e.target.value)}
        />

        <input placeholder="Current Annual Expenses"
          value={expense}
          onChange={(e) => setExpense(e.target.value)}
        />

        <input placeholder="Inflation Rate (%)"
          value={inflation}
          onChange={(e) => setInflation(e.target.value)}
        />

        <input placeholder="Pre-Retirement Return (%)"
          value={preReturn}
          onChange={(e) => setPreReturn(e.target.value)}
        />

        <input placeholder="Post-Retirement Return (%)"
          value={postReturn}
          onChange={(e) => setPostReturn(e.target.value)}
        />

        <input placeholder="Years After Retirement"
          value={years}
          onChange={(e) => setYears(e.target.value)}
        />

        <button onClick={calculateRetirement}>
          Calculate
        </button>

      </div>

      {result && (
        <div style={{ marginTop: "30px" }}>

          <h2>Results</h2>

          <p>
            Future Annual Expense:
            <b> ₹ {Math.round(result.futureExpense)}</b>
          </p>

          <p>
            Required Retirement Corpus:
            <b> ₹ {Math.round(result.corpus)}</b>
          </p>

          <p>
            Required Monthly SIP:
            <b> ₹ {Math.round(result.monthlySIP)}</b>
          </p>

        </div>
      )}

    </main>
  );
}