"""
Builds the compact dataset shipped to the browser for the dashboard/report.

Input:  data/processed/books_panel.csv (one row per book x genre)
Output: site/data/books.json — one row per BOOK (not exploded), with a
        `genres` array. The dashboard explodes book x genre client-side
        when it needs genre-level aggregation; shipping one row per book
        instead of one row per book-genre pair avoids repeating every
        other column for each of a book's ~4-5 genres, keeping the
        payload small enough to load in a browser.

Genres are restricted to the top N by book count — the raw `genres` field
is Goodreads' free-text shelf tags (979 distinct values after exploding),
and the long tail is noisy, near-duplicate, or not really a genre (e.g.
"Novels", "Adult"). Keeping the top N keeps the group column meaningful
for filtering while still comfortably exceeding the 10-distinct-value
requirement.
"""

import json
import pathlib

import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parent.parent
PANEL_PATH = ROOT / "data" / "processed" / "books_panel.csv"
OUT_PATH = ROOT / "assets" / "data" / "books.json"

TOP_N_GENRES = 25

NUMERIC_COLS = ["rating", "numRatings", "pages", "price", "likedPercent"]
CATEGORICAL_COLS = ["language", "bookFormat", "publisher"]
BOOK_COLS = ["id", "title", "author", "year", *NUMERIC_COLS, *CATEGORICAL_COLS]


def main() -> None:
    panel = pd.read_csv(PANEL_PATH)

    top_genres = panel["genre"].value_counts().head(TOP_N_GENRES).index.tolist()
    panel = panel[panel["genre"].isin(top_genres)].copy()

    panel["id"] = panel["bookId"].str.extract(r"^(\d+)").fillna("0").astype(int)

    genres_by_book = panel.groupby("id")["genre"].apply(lambda s: sorted(set(s))).rename("genres")

    books = panel.drop_duplicates(subset="id")[BOOK_COLS].set_index("id").join(genres_by_book)
    books = books.reset_index()

    for col in NUMERIC_COLS:
        books[col] = pd.to_numeric(books[col], errors="coerce")
    for col in NUMERIC_COLS + CATEGORICAL_COLS + ["title", "author"]:
        books[col] = books[col].astype(object).where(books[col].notna(), None)

    records = books.to_dict(orient="records")

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump(
            {
                "generatedFrom": "data/processed/books_panel.csv",
                "topNGenres": TOP_N_GENRES,
                "genres": top_genres,
                "books": records,
            },
            f,
            separators=(",", ":"),
        )

    size_mb = OUT_PATH.stat().st_size / (1024 * 1024)
    print(f"Wrote {len(records):,} books, {len(top_genres)} genres, {size_mb:.1f}MB to {OUT_PATH}")
    years = books["year"]
    print(f"Year range: {years.min()}-{years.max()} ({years.nunique()} distinct years)")


if __name__ == "__main__":
    main()
