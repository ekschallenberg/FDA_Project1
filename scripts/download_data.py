"""
Downloads the raw "Goodreads Best Books Ever" dataset used for this project.

Source: Lorena Casanova Lozano & Sergio Costa Planells, "Best Books Ever
Dataset" (scraped from Goodreads, Fall 2020), CC BY-NC 4.0.
Mirror used: https://github.com/scostap/goodreads_bbe_dataset
(same data as the Kaggle mirrors, e.g. thedevastator/comprehensive-overview-
of-52478-goodreads-best-b)

Usage:
    python scripts/download_data.py
"""

import pathlib
import urllib.request

URL = (
    "https://raw.githubusercontent.com/scostap/goodreads_bbe_dataset/"
    "master/Best_Books_Ever_dataset/books_1.Best_Books_Ever.csv"
)
OUT_PATH = pathlib.Path(__file__).resolve().parent.parent / "data" / "raw" / "books_1.Best_Books_Ever.csv"

if __name__ == "__main__":
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading dataset to {OUT_PATH} ...")
    urllib.request.urlretrieve(URL, OUT_PATH)
    print("Done.")
