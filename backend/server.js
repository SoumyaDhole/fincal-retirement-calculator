require('dotenv').config();
const express = require("express");
const cors    = require("cors");
const retirementRoutes = require("./routes/retirementRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("FinCal Backend Running"));
app.use("/api/retirement", retirementRoutes);

// ── Claude API Proxy ─────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "ANTHROPIC_API_KEY not set in backend .env file" });
    }
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || "Anthropic API error" });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || "Proxy error" });
  }
});

app.listen(5000, () => console.log("✅ FinCal Backend running on port 5000"));
