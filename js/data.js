// Loads assets/data/books.json and derives the book x genre "events" table
// used by both the report and the dashboard. One event = one book counted
// under one of its genres for one publication year (see README for why the
// data is shaped this way).

const DATA_URL = "assets/data/books.json";

let _dataPromise = null;

function loadData() {
  if (!_dataPromise) {
    _dataPromise = fetch(DATA_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load ${DATA_URL}: ${r.status}`);
        return r.json();
      })
      .then((raw) => {
        const books = raw.books;
        const events = [];
        for (const b of books) {
          for (const genre of b.genres) {
            events.push({
              id: b.id,
              title: b.title,
              author: b.author,
              year: b.year,
              genre,
              rating: b.rating,
              numRatings: b.numRatings,
              pages: b.pages,
              price: b.price,
              likedPercent: b.likedPercent,
              language: b.language,
              bookFormat: b.bookFormat,
              publisher: b.publisher,
            });
          }
        }
        return { books, events, genres: raw.genres };
      });
  }
  return _dataPromise;
}

function decadeOf(year) {
  return Math.floor(year / 10) * 10;
}

const fmt = {
  int(n) {
    if (n === null || n === undefined || Number.isNaN(n)) return "—";
    return Math.round(n).toLocaleString("en-US");
  },
  decimal(n, digits = 2) {
    if (n === null || n === undefined || Number.isNaN(n)) return "—";
    return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  },
  compact(n) {
    if (n === null || n === undefined || Number.isNaN(n)) return "—";
    return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
  },
  percent(n, digits = 1) {
    if (n === null || n === undefined || Number.isNaN(n)) return "—";
    return `${n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
  },
};
