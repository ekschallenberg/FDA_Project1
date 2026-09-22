// Generic group-by / measure aggregation shared by the report and the
// dashboard, so every number on both pages is computed the same way.

function sum(nums) {
  return nums.reduce((a, b) => a + b, 0);
}

function mean(nums) {
  const clean = nums.filter((v) => v !== null && v !== undefined && !Number.isNaN(v));
  if (clean.length === 0) return null;
  return sum(clean) / clean.length;
}

function median(nums) {
  const clean = nums.filter((v) => v !== null && v !== undefined && !Number.isNaN(v)).slice().sort((a, b) => a - b);
  if (clean.length === 0) return null;
  const mid = Math.floor(clean.length / 2);
  return clean.length % 2 ? clean[mid] : (clean[mid - 1] + clean[mid]) / 2;
}

function stdev(nums) {
  const clean = nums.filter((v) => v !== null && v !== undefined && !Number.isNaN(v));
  if (clean.length < 2) return null;
  const m = mean(clean);
  const variance = sum(clean.map((v) => (v - m) ** 2)) / (clean.length - 1);
  return Math.sqrt(variance);
}

function groupBy(rows, keyFn) {
  const map = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return map;
}

const MEASURES = {
  count: {
    label: "Number of books",
    compute: (rows) => rows.length,
    format: (v) => fmt.int(v),
  },
  total_ratings: {
    label: "Total ratings (sum)",
    compute: (rows) => sum(rows.map((r) => r.numRatings || 0)),
    format: (v) => fmt.compact(v),
  },
  avg_rating: {
    label: "Average rating",
    compute: (rows) => mean(rows.map((r) => r.rating)),
    format: (v) => fmt.decimal(v, 2),
  },
  median_rating: {
    label: "Median rating",
    compute: (rows) => median(rows.map((r) => r.rating)),
    format: (v) => fmt.decimal(v, 2),
  },
  liked_rate: {
    label: "% liked (average)",
    compute: (rows) => mean(rows.map((r) => r.likedPercent)),
    format: (v) => fmt.percent(v, 1),
  },
};

const BREAKDOWNS = {
  genre: { label: "Genre", key: (r) => r.genre },
  decade: {
    label: "Decade",
    key: (r) => `${decadeOf(r.year)}s`,
    sortByLabel: true,
  },
  language: { label: "Language", key: (r) => r.language || "Unknown" },
  bookFormat: { label: "Format", key: (r) => r.bookFormat || "Unknown" },
  publisher: { label: "Publisher", key: (r) => r.publisher || "Unknown", topN: 12 },
};

// Aggregates `rows` by BREAKDOWNS[breakdownKey], computing MEASURES[measureKey]
// for each group. Returns [{ key, value, n }], sorted descending by value
// (or ascending by label for the "decade" breakdown), optionally limited to
// the breakdown's topN groups by row count.
function aggregate(rows, breakdownKey, measureKey) {
  const breakdown = BREAKDOWNS[breakdownKey];
  const measure = MEASURES[measureKey];
  const groups = groupBy(rows, breakdown.key);

  let entries = Array.from(groups.entries()).map(([key, groupRows]) => ({
    key,
    n: groupRows.length,
    value: measure.compute(groupRows),
  }));

  if (breakdown.topN) {
    entries = entries.sort((a, b) => b.n - a.n).slice(0, breakdown.topN);
  }

  if (breakdown.sortByLabel) {
    entries.sort((a, b) => (a.key > b.key ? 1 : -1));
  } else {
    entries.sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));
  }

  return entries;
}
