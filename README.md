# FDA_Project1

Panel-data project on books: what were the best-rated genres over time?

## Dataset

**Goodreads "Best Books Ever" dataset** — 52,478 books scraped from
Goodreads' Best Books Ever list (Lorena Casanova Lozano & Sergio Costa
Planells, Fall 2020), CC BY-NC 4.0. Source repo:
https://github.com/scostap/goodreads_bbe_dataset (identical to the Kaggle
mirrors, e.g. `thedevastator/comprehensive-overview-of-52478-goodreads-best-b`).

Each book lists several genres (Goodreads shelf tags), so the cleaned data
explodes each book into one row per (book, genre) pair — genre is the
panel's group column, publication year is the time column.

## Reproducing the data

```
python scripts/download_data.py   # fetches data/raw/books_1.Best_Books_Ever.csv (~71MB, gitignored)
python scripts/clean_data.py      # writes data/processed/books_panel.csv
```

## data/processed/books_panel.csv

400,136 rows x 15 columns, one row = one (book, genre) pair.

| column | description |
|---|---|
| `bookId` | Goodreads book identifier (repeats across genre rows for the same book) |
| `title`, `author` | book title and author |
| `year` | publication year, parsed from Goodreads' `publishDate` field (1873-2021) |
| `rating` | average Goodreads rating (0-5) |
| `numRatings` | number of ratings the book received |
| `pages` | page count |
| `price` | listed price (19.9% missing — sparse in the source data) |
| `likedPercent` | % of raters who liked the book |
| `bbeScore`, `bbeVotes` | Goodreads "Best Books Ever" list score/vote count |
| `language` | book language |
| `bookFormat` | edition format (Hardcover, Paperback, Kindle Edition, ...) |
| `publisher` | publisher |
| `genre` | one genre tag for this book (979 distinct values; the top ones — Fiction, Romance, Fantasy, Young Adult, ... — are the most reliable for filtering, since the long tail is noisy user shelf tags) |

Requirements check: 400,136 rows (>50k), 15 columns (>8), 114 distinct
years (>5), 979 distinct genres (>10), categorical columns to filter on
(`genre`, `language`, `bookFormat`, `publisher`), numeric columns to
total/average/rank (`rating`, `numRatings`, `pages`, `price`).

## Known data quality notes

- `publishDate` in the raw source mixes formats (`"09/14/08"`,
  `"November 2nd 2011"`, `"1989"`); `clean_data.py` parses these and drops
  a handful of scrape artifacts (e.g. `"2064"`).
- ~8.8% of books have no genre tag and are dropped from the panel.
- The genre field is Goodreads' user-assigned shelf tags, not a curated
  taxonomy — expect some noisy/overlapping tags (e.g. "Novels", "Adult")
  alongside real genres.
