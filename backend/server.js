const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

/* Test route */
app.get("/", (req, res) => {
  res.send("FinCal Backend Running");
});

/* Retirement Calculator API */
app.post("/retirement", (req, res) => {
  const {
    currentAge,
    retirementAge,
    currentExpense,
    inflationRate,
    preReturn,
    postReturn,
    retirementYears
  } = req.body;

  const yearsToRetirement = retirementAge - currentAge;

  /* Step 1: Inflate expense */
  const futureExpense =
    currentExpense * Math.pow(1 + inflationRate / 100, yearsToRetirement);

  /* Step 2: Retirement corpus */
  const r = postReturn / 100;

  const corpus =
    futureExpense * ((1 - Math.pow(1 + r, -retirementYears)) / r);

  /* Step 3: SIP needed */
  const monthlyRate = preReturn / 100 / 12;
  const months = yearsToRetirement * 12;

  const sip =
    (corpus * monthlyRate) /
    ((Math.pow(1 + monthlyRate, months) - 1) * (1 + monthlyRate));

  res.json({
    futureExpense,
    corpus,
    monthlySIP: sip
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});