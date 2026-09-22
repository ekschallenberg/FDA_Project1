// Thin Chart.js helpers so report.js / dashboard.js stay declarative.

const PALETTE = ["#8a5a3c", "#3c6e71", "#c98a3e", "#6b5b95", "#a3423c", "#4d7ea8", "#9c8a3e"];

Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
Chart.defaults.color = "#625d54";
Chart.defaults.borderColor = "#e6e1d8";

function makeBarChart(canvas, { labels, data, axisLabel, horizontal = false }) {
  return new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length]),
          borderRadius: 4,
          maxBarThickness: 46,
        },
      ],
    },
    options: {
      indexAxis: horizontal ? "y" : "x",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        [horizontal ? "x" : "y"]: {
          beginAtZero: false,
          title: { display: !!axisLabel, text: axisLabel },
          grid: { color: "#efeae1" },
        },
        [horizontal ? "y" : "x"]: { grid: { display: false } },
      },
    },
  });
}

function makeLineChart(canvas, { labels, data, axisLabel }) {
  return new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          data,
          borderColor: PALETTE[0],
          backgroundColor: "rgba(138, 90, 60, 0.12)",
          pointBackgroundColor: PALETTE[0],
          tension: 0.25,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { title: { display: !!axisLabel, text: axisLabel }, grid: { color: "#efeae1" } },
        x: { grid: { display: false } },
      },
    },
  });
}

function makeMultiLineChart(canvas, { labels, series, axisLabel }) {
  return new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: series.map((s, i) => ({
        label: s.label,
        data: s.data,
        borderColor: PALETTE[i % PALETTE.length],
        backgroundColor: "transparent",
        tension: 0.25,
        pointRadius: 2,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true, position: "bottom" } },
      scales: {
        y: { title: { display: !!axisLabel, text: axisLabel }, grid: { color: "#efeae1" } },
        x: { grid: { display: false } },
      },
    },
  });
}
