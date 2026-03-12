"use client";

import { useState } from "react";

export default function Home() {
  const [form, setForm] = useState({
    currentAge: "",
    retirementAge: "",
    currentExpense: "",
    inflationRate: "",
    preReturn: "",
    postReturn: "",
    retirementYears: "",
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const calculateRetirement = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/retirement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentAge: Number(form.currentAge),
          retirementAge: Number(form.retirementAge),
          currentExpense: Number(form.currentExpense),
          inflationRate: Number(form.inflationRate),
          preReturn: Number(form.preReturn),
          postReturn: Number(form.postReturn),
          retirementYears: Number(form.retirementYears),
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Calculation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Retirement Planning Calculator
        </h1>
        <p className="mb-8 text-gray-600">
          Estimate future expenses, required retirement corpus, and monthly SIP.
        </p>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">Enter Details</h2>

            <div className="grid gap-4">
              <input
                type="number"
                name="currentAge"
                placeholder="Current Age"
                value={form.currentAge}
                onChange={handleChange}
                className="rounded-lg border p-3"
              />
              <input
                type="number"
                name="retirementAge"
                placeholder="Retirement Age"
                value={form.retirementAge}
                onChange={handleChange}
                className="rounded-lg border p-3"
              />
              <input
                type="number"
                name="currentExpense"
                placeholder="Current Annual Expenses"
                value={form.currentExpense}
                onChange={handleChange}
                className="rounded-lg border p-3"
              />
              <input
                type="number"
                name="inflationRate"
                placeholder="Inflation Rate (%)"
                value={form.inflationRate}
                onChange={handleChange}
                className="rounded-lg border p-3"
              />
              <input
                type="number"
                name="preReturn"
                placeholder="Pre-Retirement Return (%)"
                value={form.preReturn}
                onChange={handleChange}
                className="rounded-lg border p-3"
              />
              <input
                type="number"
                name="postReturn"
                placeholder="Post-Retirement Return (%)"
                value={form.postReturn}
                onChange={handleChange}
                className="rounded-lg border p-3"
              />
              <input
                type="number"
                name="retirementYears"
                placeholder="Years After Retirement"
                value={form.retirementYears}
                onChange={handleChange}
                className="rounded-lg border p-3"
              />

              <button
                onClick={calculateRetirement}
                className="rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700"
              >
                {loading ? "Calculating..." : "Calculate"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">Results</h2>

            {result ? (
              <div className="grid gap-4">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Future Annual Expense</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹ {Math.round(result.futureExpense).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Required Retirement Corpus</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹ {Math.round(result.corpus).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Required Monthly SIP</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹ {Math.round(result.monthlySIP).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">
                Enter your details and click calculate to see retirement estimates.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}