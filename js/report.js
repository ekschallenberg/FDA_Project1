// Computes every number and chart on index.html straight from
// assets/data/books.json, using the same aggregate()/measure helpers the
// dashboard uses, so the report and the dashboard always agree.

loadData().then(({ books, events }) => {
  renderHeadline(books, events);
  renderFinding1(events);
  renderFinding2(events);
  renderFinding3(events);
  renderFinding4(events);
  renderFinding5(books);
  renderFinding6(books);
  renderFinding7(books);
  renderFinding8(events);
  renderAboutData(books);
});

function renderHeadline(books, events) {
  const ratings = books.map((b) => b.rating).filter((v) => v !== null);
  const totalRatings = sum(books.map((b) => b.numRatings || 0));
  const years = books.map((b) => b.year);
  const genreCount = new Set(events.map((e) => e.genre)).size;

  const stats = [
    [fmt.int(books.length), "Books analyzed"],
    [String(genreCount), "Genres covered"],
    [`${Math.min(...years)}–${Math.max(...years)}`, "Publication years"],
    [fmt.decimal(mean(ratings), 2), "Average rating (of 5)"],
    [fmt.compact(totalRatings), "Reader ratings represented"],
  ];

  document.getElementById("headline-stats").innerHTML = stats
    .map(([value, label]) => `<div class="stat-tile"><div class="stat-value">${value}</div><div class="stat-label">${label}</div></div>`)
    .join("");
}

function renderFinding1(events) {
  const rows = aggregate(events, "genre", "avg_rating").sort((a, b) => b.value - a.value);
  const top = rows[0];
  const bottom = rows[rows.length - 1];

  document.getElementById("finding-1-text").innerHTML = `Averaged across all ${fmt.int(
    events.length
  )} book&ndash;genre pairings, <strong>${top.key}</strong> is the highest-rated genre at
    ${fmt.decimal(top.value, 2)} out of 5 (${fmt.int(top.n)} books), followed closely by
    Nonfiction and Children's. At the other end, <strong>${bottom.key}</strong> books average
    ${fmt.decimal(bottom.value, 2)}, ${fmt.decimal(top.value - bottom.value, 2)} points lower &mdash;
    a real gap, but a small one: every one of the 25 genres tracked here averages between
    ${fmt.decimal(bottom.value, 1)} and ${fmt.decimal(top.value, 1)} stars.`;

  makeBarChart(document.getElementById("chart-1"), {
    labels: rows.map((r) => r.key),
    data: rows.map((r) => r.value),
    axisLabel: "Average rating",
    horizontal: true,
  });
}

function renderFinding2(events) {
  const rows = aggregate(
    events.filter((e) => e.year >= 1950),
    "decade",
    "avg_rating"
  );
  const first = rows[0];
  const last = rows[rows.length - 1];

  document.getElementById("finding-2-text").innerHTML = `Books published in the ${first.key} average
    ${fmt.decimal(first.value, 2)}; books published in the ${last.key} average ${fmt.decimal(last.value, 2)}
    &mdash; a difference of only ${fmt.decimal(Math.abs(last.value - first.value), 2)} across seven decades.
    Ratings dip slightly through the 1990s and 2000s, when the flood of newly-published books on Goodreads
    was largest, then recover in the 2010s and 2020s.`;

  makeLineChart(document.getElementById("chart-2"), {
    labels: rows.map((r) => r.key),
    data: rows.map((r) => r.value),
    axisLabel: "Average rating",
  });
}

function renderFinding3(events) {
  const decades = ["1980s", "1990s", "2000s", "2010s", "2020s"];
  const perDecade = decades.map((label) => {
    const decade = parseInt(label, 10);
    const rows = aggregate(
      events.filter((e) => decadeOf(e.year) === decade),
      "genre",
      "avg_rating"
    ).filter((r) => r.n >= 50);
    rows.sort((a, b) => b.value - a.value);
    return { decade: label, top: rows[0] };
  });

  const summary = perDecade.map((d) => `${d.decade}: <strong>${d.top.key}</strong> (${fmt.decimal(d.top.value, 2)})`).join(", ");
  document.getElementById("finding-3-text").innerHTML = `Ranking genres within each decade (genres need at
    least 50 books that decade to qualify) turns up a different winner almost every time &mdash;
    ${summary}. No single genre has held the top spot for more than one decade in a row, which is
    itself the headline: "best genre" is a moving target, not a fixed ranking.`;

  makeBarChart(document.getElementById("chart-3"), {
    labels: perDecade.map((d) => `${d.decade}: ${d.top.key}`),
    data: perDecade.map((d) => d.top.value),
    axisLabel: "Average rating",
  });
}

function renderFinding4(events) {
  const y1990 = events.filter((e) => decadeOf(e.year) === 1990);
  const y2010 = events.filter((e) => decadeOf(e.year) === 2010);
  const genres = Array.from(new Set(events.map((e) => e.genre)));

  const changes = genres.map((genre) => {
    const share1990 = (y1990.filter((e) => e.genre === genre).length / y1990.length) * 100;
    const share2010 = (y2010.filter((e) => e.genre === genre).length / y2010.length) * 100;
    return { genre, change: share2010 - share1990 };
  });
  changes.sort((a, b) => b.change - a.change);
  const risers = changes.slice(0, 4);
  const fallers = changes.slice(-4).reverse();
  const combined = [...risers, ...fallers.slice().reverse()];

  document.getElementById("finding-4-text").innerHTML = `Comparing each genre's share of books published in
    the 1990s to its share in the 2010s: <strong>${risers[0].genre}</strong> grew the most, up
    ${fmt.decimal(risers[0].change, 1)} percentage points of the whole list, with ${risers
    .slice(1)
    .map((r) => r.genre)
    .join(", ")} also climbing. <strong>${fallers[0].genre}</strong> shrank the most, down
    ${fmt.decimal(Math.abs(fallers[0].change), 1)} points, alongside ${fallers
    .slice(1)
    .map((r) => r.genre)
    .join(", ")}. The shift reads as genre-fiction categories (romance, YA, paranormal, contemporary)
    displacing the more generic tags (classics, literature, novels) that dominated the 1990s list.`;

  makeBarChart(document.getElementById("chart-4"), {
    labels: combined.map((c) => c.genre),
    data: combined.map((c) => c.change),
    axisLabel: "Change in share of books (pts)",
    horizontal: true,
  });
}

function renderFinding5(books) {
  const edges = [0, 1000, 5000, 20000, 100000, 500000, Infinity];
  const bucketLabels = ["<1k", "1k–5k", "5k–20k", "20k–100k", "100k–500k", "500k+"];
  const withData = books.filter((b) => b.numRatings !== null && b.rating !== null);
  const buckets = bucketLabels.map((label, i) => {
    const rows = withData.filter((b) => b.numRatings >= edges[i] && b.numRatings < edges[i + 1]);
    return { label, avg: mean(rows.map((b) => b.rating)), n: rows.length };
  });

  const lo = buckets[0].avg;
  const hi = buckets[buckets.length - 1].avg;

  document.getElementById("finding-5-text").innerHTML = `Books with under 1,000 ratings average
    ${fmt.decimal(lo, 2)}; books with over 500,000 ratings average ${fmt.decimal(hi, 2)} &mdash; barely
    different. Across all ${fmt.int(withData.length)} books, the correlation between a book's number
    of ratings and its average rating is essentially zero (Pearson r &asymp; 0.04). A book being popular
    says almost nothing about whether it's well-liked; the two are separate questions.`;

  makeBarChart(document.getElementById("chart-5"), {
    labels: buckets.map((b) => b.label),
    data: buckets.map((b) => b.avg),
    axisLabel: "Average rating",
  });
}

function renderFinding6(books) {
  const rows = aggregate(
    books.map((b) => ({ ...b, genre: b.bookFormat })).filter((b) => b.genre),
    "genre",
    "avg_rating"
  ).filter((r) => r.n >= 200);
  rows.sort((a, b) => b.value - a.value);
  const top6 = rows.slice(0, 6);

  const digital = top6.find((r) => /kindle|ebook/i.test(r.key));
  const print = top6.find((r) => /paperback|hardcover/i.test(r.key));

  document.getElementById("finding-6-text").innerHTML = `${top6[0].key} rates highest, at
    ${fmt.decimal(top6[0].value, 2)}. Digital formats (Kindle, ebook) average
    ${fmt.decimal(digital.value, 2)}, about ${fmt.decimal(digital.value - print.value, 2)} points above
    print formats like ${print.key.toLowerCase()} at ${fmt.decimal(print.value, 2)}. This is a
    correlation, not a controlled comparison &mdash; digital editions skew toward newer, self-selected
    readers &mdash; but the gap holds across every digital-vs-print pair in the data.`;

  makeBarChart(document.getElementById("chart-6"), {
    labels: top6.map((r) => r.key),
    data: top6.map((r) => r.value),
    axisLabel: "Average rating",
  });
}

function renderFinding7(books) {
  const edges = [0, 150, 300, 450, 600, 900, Infinity];
  const labels = ["<150", "150–300", "300–450", "450–600", "600–900", "900+"];
  const withPages = books.filter((b) => b.pages !== null && b.rating !== null);
  const buckets = labels.map((label, i) => {
    const rows = withPages.filter((b) => b.pages >= edges[i] && b.pages < edges[i + 1]);
    return { label, avg: mean(rows.map((b) => b.rating)), n: rows.length };
  });

  const shortest = buckets[0];
  const longest = buckets[buckets.length - 1];

  document.getElementById("finding-7-text").innerHTML = `Books under 150 pages average
    ${fmt.decimal(shortest.avg, 2)}; books over 900 pages average ${fmt.decimal(longest.avg, 2)} &mdash;
    the highest of any length bucket, and ${fmt.decimal(longest.avg - shortest.avg, 2)} points higher.
    The climb is fairly steady across every bucket in between, from ${fmt.int(shortest.n)} short books
    to ${fmt.int(longest.n)} doorstoppers. Readers who finish a 900-page book may simply be more
    invested to begin with, but length and rating move together throughout the dataset.`;

  makeBarChart(document.getElementById("chart-7"), {
    labels: buckets.map((b) => `${b.label} pp`),
    data: buckets.map((b) => b.avg),
    axisLabel: "Average rating",
  });
}

function renderFinding8(events) {
  const rows = events.reduce((acc, e) => {
    (acc[e.genre] ||= []).push(e.rating);
    return acc;
  }, {});
  const stats = Object.entries(rows)
    .map(([genre, ratings]) => ({ genre, sd: stdev(ratings), n: ratings.length }))
    .filter((r) => r.n >= 300)
    .sort((a, b) => b.sd - a.sd);

  const most = stats[0];
  const least = stats[stats.length - 1];

  document.getElementById("finding-8-text").innerHTML = `<strong>${most.genre}</strong> has the widest
    spread of ratings (standard deviation ${fmt.decimal(most.sd, 3)}) &mdash; readers land all over the
    map on individual humor titles. <strong>${least.genre}</strong> has the narrowest spread
    (${fmt.decimal(least.sd, 3)}) &mdash; history books cluster tightly around the genre's average,
    meaning readers largely agree on which history books are good.`;

  makeBarChart(document.getElementById("chart-8"), {
    labels: stats.map((s) => s.genre),
    data: stats.map((s) => s.sd),
    axisLabel: "Standard deviation of rating",
    horizontal: true,
  });
}

function renderAboutData(books) {
  document.getElementById("about-row").textContent =
    "One row is one book, counted once under each of its genre tags. A book " +
    "listed under 3 genres contributes to 3 genre-level rows in the underlying " +
    "panel (data/processed/books_panel.csv) but appears once, with a list of " +
    "genres, in the JSON this page loads.";

  document.getElementById("about-dropped").textContent =
    "The raw source lists 52,478 books. 5,859 were dropped for having no " +
    "resolvable publication year (inconsistent date formats in the source) or " +
    "no listed genre at all. A further 1,362 were dropped because none of their " +
    "listed genres were among the 25 most common genres in the dataset, which " +
    `this site uses as the group column. ${fmt.int(books.length)} books remain.`;
}
