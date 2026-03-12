const express = require("express");
const cors = require("cors");

const retirementRoutes = require("./routes/retirementRoutes");

const app = express();

/* Middleware */
app.use(cors());
app.use(express.json());

/* Test route */
app.get("/", (req, res) => {
  res.send("FinCal Backend Running");
});

/* Retirement Calculator API Route */
app.use("/api/retirement", retirementRoutes);

/* Start server */
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});