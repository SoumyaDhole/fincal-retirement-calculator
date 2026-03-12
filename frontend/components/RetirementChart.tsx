"use client";

import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

export default function RetirementChart({ corpus }: any) {

  const years = Array.from({ length: 30 }, (_, i) => i + 1);

  const corpusGrowth = years.map(year =>
    corpus * Math.pow(1.08, year)
  );

  const data = {
    labels: years,
    datasets: [
      {
        label: "Corpus Growth",
        data: corpusGrowth
      }
    ]
  };

  return (
    <div style={{ width: 600, marginTop: 40 }}>
      <Line data={data} />
    </div>
  );
}