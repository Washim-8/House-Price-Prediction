from __future__ import annotations

import argparse
from pathlib import Path
import sys

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from model_training import generate_synthetic_rows  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate an India-style housing.csv dataset.")
    parser.add_argument("--rows", type=int, default=1500, help="Number of rows to generate (default: 1500).")
    parser.add_argument(
        "--out",
        type=str,
        default=str(PROJECT_ROOT / "dataset" / "housing.csv"),
        help="Output CSV path.",
    )
    parser.add_argument("--seed", type=int, default=42, help="Random seed.")
    args = parser.parse_args()

    out_path = Path(args.out).resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)

    df = generate_synthetic_rows(int(args.rows), seed=int(args.seed))
    df.to_csv(out_path, index=False)
    print(f"Wrote {len(df)} rows -> {out_path}")


if __name__ == "__main__":
    main()

