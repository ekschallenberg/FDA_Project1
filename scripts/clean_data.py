"""
Cleans the raw Goodreads Best Books Ever CSV into a genre x year panel.

Input:  data/raw/books_1.Best_Books_Ever.csv  (from scripts/download_data.py)
Output: data/processed/books_panel.csv

Each output row is one (book, genre) pair: books are exploded across their
listed genres so that a genre column repeats across years (the panel's
"group"), letting the same genre be aggregated/ranked year over year.

Cleaning steps:
- publishDate is inconsistently formatted ("09/14/08", "November 2nd 2011",
  "1989"). A 4-digit year is extracted directly where present; the
  remaining two-digit "MM/DD/YY" values are parsed with pandas' %y rule
  (00-68 -> 2000s, 69-99 -> 1900s). Years outside [1500, current year] are
  dropped as scrape artifacts (e.g. a handful of "2064" typos).
- genres is a stringified Python list per book; it's parsed and exploded
  into one row per (book, genre).
- pages ("1 page") and price (a few malformed multi-dot values like
  "1.189.88") are coerced to numeric, invalid values becoming NaN.
- Rows with no resolvable year or no genre are dropped, since both are
  required for the genre-by-year panel.
"""

import ast
import pathlib

import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW_PATH = ROOT / "data" / "raw" / "books_1.Best_Books_Ever.csv"
OUT_PATH = ROOT / "data" / "processed" / "books_panel.csv"

KEEP_COLS = [
    "bookId", "title", "author", "year", "rating", "numRatings", "pages",
    "price", "likedPercent", "bbeScore", "bbeVotes", "language",
    "bookFormat", "publisher", "genre_list",
]


def parse_year(publish_date: pd.Series) -> pd.Series:
    s = publish_date.astype(str).str.strip()
    year_4digit = s.str.extract(r"(\b(?:1[5-9]\d{2}|20[0-2]\d)\b)", expand=False).astype(float)
    year_2digit = pd.to_datetime(s, format="%m/%d/%y", errors="coerce").dt.year.astype(float)
    year = year_4digit.combine_first(year_2digit)
    current_year = pd.Timestamp.now().year
    return year.where((year >= 1500) & (year <= current_year))


def parse_genres(raw: str) -> list:
    try:
        genres = ast.literal_eval(raw)
    except (ValueError, SyntaxError):
        return []
    return [g.strip() for g in genres if isinstance(g, str) and g.strip()]


def main() -> None:
    if not RAW_PATH.exists():
        raise FileNotFoundError(f"{RAW_PATH} not found — run scripts/download_data.py first")

    df = pd.read_csv(RAW_PATH, low_memory=False)

    df["year"] = parse_year(df["publishDate"])
    df["genre_list"] = df["genres"].apply(parse_genres)
    df["pages"] = df["pages"].astype(str).str.extract(r"(\d+)").astype(float)
    df["price"] = pd.to_numeric(df["price"], errors="coerce")

    panel = df[KEEP_COLS].explode("genre_list").rename(columns={"genre_list": "genre"})
    panel = panel.dropna(subset=["year", "genre"])
    panel["year"] = panel["year"].astype(int)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    panel.to_csv(OUT_PATH, index=False)

    print(f"Wrote {len(panel):,} rows x {panel.shape[1]} cols to {OUT_PATH}")
    print(f"Distinct books: {panel['bookId'].nunique():,}")
    print(f"Distinct years: {panel['year'].nunique()} ({panel['year'].min()}-{panel['year'].max()})")
    print(f"Distinct genres: {panel['genre'].nunique()}")
    print("Top 10 genres by row count:")
    print(panel["genre"].value_counts().head(10).to_string())


if __name__ == "__main__":
    main()
