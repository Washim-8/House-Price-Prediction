from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Tuple

import pandas as pd


FEATURE_COLUMNS = ["area", "bedrooms", "bathrooms", "location"]
TARGET_COLUMN = "price"


@dataclass(frozen=True)
class ValidationResult:
    ok: bool
    error: str | None = None


def _as_float(value: Any) -> float:
    if value is None or (isinstance(value, str) and not value.strip()):
        raise ValueError("missing")
    return float(value)


def validate_payload(payload: Dict[str, Any]) -> ValidationResult:
    required = ["area", "bedrooms", "bathrooms", "location"]
    missing = [k for k in required if k not in payload]
    if missing:
        return ValidationResult(False, f"Missing fields: {', '.join(missing)}")

    try:
        area = _as_float(payload.get("area"))
        bedrooms = _as_float(payload.get("bedrooms"))
        bathrooms = _as_float(payload.get("bathrooms"))
    except ValueError:
        return ValidationResult(False, "Area/Bedrooms/Bathrooms must be numbers.")

    if area <= 0:
        return ValidationResult(False, "Area must be greater than 0.")
    if bedrooms <= 0 or bedrooms > 20:
        return ValidationResult(False, "Bedrooms must be between 1 and 20.")
    if bathrooms <= 0 or bathrooms > 20:
        return ValidationResult(False, "Bathrooms must be between 1 and 20.")

    location = str(payload.get("location", "")).strip()
    if not location:
        return ValidationResult(False, "Location is required.")

    return ValidationResult(True)


def payload_to_dataframe(payload: Dict[str, Any]) -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "area": float(payload["area"]),
                "bedrooms": float(payload["bedrooms"]),
                "bathrooms": float(payload["bathrooms"]),
                "location": str(payload["location"]).strip(),
            }
        ],
        columns=FEATURE_COLUMNS,
    )


def split_features_target(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
    X = df[FEATURE_COLUMNS].copy()
    y = df[TARGET_COLUMN].astype(float).copy()
    return X, y

