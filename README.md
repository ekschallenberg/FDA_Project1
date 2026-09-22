# ShelfLife &mdash; Best-Rated Books, By Genre and By Decade

Data Website Project, Financial Data Analytics. A two-page site: a scrollable
report of findings (`index.html`) and an interactive dashboard
(`dashboard.html`), both built on a panel of Goodreads books.

**Live site:** _add the GitHub Pages URL here once published_

## The question

Which book genres actually earn the highest reader ratings, has that answer
changed over time, and what else (format, length, popularity) moves a book's
rating?

## The data

**Goodreads "Best Books Ever" dataset** &mdash; 52,478 books scraped from
Goodreads' Best Books Ever list by Lorena Casanova Lozano and Sergio Costa
Planells (Fall 2020), published under CC BY-NC 4.0. Source:
[github.com/scostap/goodreads_bbe_dataset](https://github.com/scostap/goodreads_bbe_dataset)
(identical to the Kaggle mirrors, e.g. `thedevastator/comprehensive-overview-of-52478-goodreads-best-b`).

One row is one book, published in one year, tagged with one or more genres
(a book counts as an "event" under each genre it lists &mdash; see
`data/processed/books_panel.csv`). The site's dataset (`assets/data/books.json`)
restricts genres to the 25 most common (979 raw genre tags include a lot of
noisy, near-duplicate shelf tags like "Novels" or "Adult"), which leaves
**45,203 books, 25 genres, and 113 distinct publication years (1873&ndash;2021)**
&mdash; comfortably meeting the assignment's panel-data requirements (&ge;50,000
source rows, &ge;5 time periods, &ge;10 groups, &ge;8 columns, &ge;2 categorical
and &ge;2 numeric variables). Full accounting of dropped rows is in the
report's closing section.

## Files

| Path | What it does |
|---|---|
| `index.html` | The report page: title, headline stats, 8 findings (each with a chart), and a closing methodology section. |
| `dashboard.html` | The interactive dashboard: filters, summary stats, 4 switchable charts, and a sortable/paginated table. |
| `css/style.css` | Shared styling for both pages (nav bar, stat tiles, charts, filters, table). |
| `js/data.js` | Fetches `assets/data/books.json` and builds the book&times;genre "events" array used for genre-level aggregation. |
| `js/agg.js` | Shared group-by/measure helpers (`MEASURES`, `BREAKDOWNS`, `aggregate()`) used by both pages, so every number is computed the same way. |
| `js/charts.js` | Thin Chart.js wrappers (bar/line chart builders) with the site's color palette. |
| `js/report.js` | Computes and renders every headline stat, finding paragraph, and chart on `index.html`. |
| `js/dashboard.js` | Filter state, panel rendering, table sorting/pagination, and the reset button on `dashboard.html`. |
| `js/vendor/chart.umd.js` | [Chart.js](https://www.chartjs.org/) v4.4.4, vendored locally (no CDN dependency, no external runtime requests). |
| `assets/data/books.json` | The compact dataset the site loads: one row per book, with a `genres` array, restricted to the top 25 genres. Built by `scripts/build_site_data.py`. |
| `data/raw/` | Raw downloaded CSV (gitignored &mdash; regenerate with `scripts/download_data.py`). |
| `data/processed/books_panel.csv` | The full cleaned panel: one row per (book, genre) pair, 400,136 rows, before the top-25-genre restriction used for the website. |
| `scripts/download_data.py` | Downloads the raw source CSV into `data/raw/`. |
| `scripts/clean_data.py` | Parses publish dates and explodes genres to produce `data/processed/books_panel.csv`. |
| `scripts/build_site_data.py` | Restricts to the top 25 genres and writes the browser-sized `assets/data/books.json`. |
| `FDA Data Website Project.pdf` | The assignment instructions. |

## Reproducing the data pipeline

```
python scripts/download_data.py    # -> data/raw/books_1.Best_Books_Ever.csv
python scripts/clean_data.py       # -> data/processed/books_panel.csv
python scripts/build_site_data.py  # -> assets/data/books.json
```

## Running the site locally

No build step &mdash; it's static HTML/CSS/JS. From the repository root:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000/index.html`.
