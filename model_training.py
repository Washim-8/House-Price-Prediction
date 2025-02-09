from __future__ import annotations

import json
import logging
from typing import Dict, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from services.preprocessing import FEATURE_COLUMNS, TARGET_COLUMN, split_features_target
from utils.config import CONFIG
from utils.logging_config import setup_logging

logger = logging.getLogger(__name__)

MIN_TRAIN_ROWS = 1200

INDIA_STATES_UTS = [
    "Andaman and Nicobar Islands",
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chandigarh",
    "Chhattisgarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Ladakh",
    "Lakshadweep",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Puducherry",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
]


def _base_ppsqft_inr(location: str) -> float:
    # Very rough priors just for generating synthetic fallback rows.
    # Real projects should replace this dataset with real transactional data.
    loc = (location or "").strip()
    if loc in {"Delhi", "Maharashtra", "Karnataka", "Telangana", "Tamil Nadu", "Goa"}:
        return 12000.0
    if loc in {"Haryana", "Gujarat", "Kerala", "Chandigarh"}:
        return 9500.0
    if loc in {"Uttarakhand", "Himachal Pradesh", "Jammu and Kashmir", "Ladakh", "Sikkim"}:
        return 8000.0
    return 6500.0


def generate_synthetic_rows(n: int, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    locs = rng.choice(INDIA_STATES_UTS, size=n, replace=True)
    bedrooms = rng.choice([1, 2, 3, 4, 5], size=n, p=[0.08, 0.34, 0.33, 0.18, 0.07])
    bathrooms = np.clip(bedrooms + rng.integers(-1, 2, size=n), 1, 6)
    area = np.clip(
        rng.normal(loc=1100, scale=450, size=n) + bedrooms * rng.normal(180, 60, size=n),
        350,
        6000,
    ).round(0)

    base = np.array([_base_ppsqft_inr(l) for l in locs])
    # nonlinear lift for bigger configs, plus noise
    lift = 1.0 + (bedrooms - 2) * 0.08 + (bathrooms - 2) * 0.04
    noise = rng.normal(0, 0.12, size=n)
    price = (area * base * lift * (1.0 + noise)).clip(8_00_000, None).round(0)

    return pd.DataFrame(
        {
            "area": area.astype(float),
            "bedrooms": bedrooms.astype(float),
            "bathrooms": bathrooms.astype(float),
            "location": locs.astype(str),
            "price": price.astype(float),
        }
    )


def build_preprocessor() -> ColumnTransformer:
    numeric_features = ["area", "bedrooms", "bathrooms"]
    categorical_features = ["location"]

    numeric_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    return ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, numeric_features),
            ("cat", categorical_transformer, categorical_features),
        ],
        remainder="drop",
    )


def evaluate(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    mse = mean_squared_error(y_true, y_pred)
    rmse = float(np.sqrt(mse))
    r2 = float(r2_score(y_true, y_pred))
    return {"mse": float(mse), "rmse": rmse, "r2": r2}


def train_model(
    X_train: pd.DataFrame, y_train: pd.Series, model: object
) -> Pipeline:
    preprocessor = build_preprocessor()
    return Pipeline(steps=[("preprocess", preprocessor), ("model", model)])


def compare_models(
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
    y_train: pd.Series,
    y_test: pd.Series,
) -> Tuple[Dict[str, Dict[str, float]], Dict[str, Pipeline]]:
    candidates = {
        "linear_regression": LinearRegression(),
        "random_forest": RandomForestRegressor(
            n_estimators=400,
            random_state=42,
            n_jobs=-1,
            max_depth=None,
        ),
    }

    metrics: Dict[str, Dict[str, float]] = {}
    pipelines: Dict[str, Pipeline] = {}

    for name, model in candidates.items():
        pipeline = train_model(X_train, y_train, model)
        pipeline.fit(X_train, y_train)
        preds = pipeline.predict(X_test)
        metrics[name] = evaluate(y_test.to_numpy(), preds)
        pipelines[name] = pipeline

    return metrics, pipelines


def train_and_save(
    dataset_path: str | None = None,
    min_rows: int = MIN_TRAIN_ROWS,
    seed: int = 42,
) -> Dict[str, object]:
    if dataset_path is None:
        dataset_path = str(CONFIG.dataset_path)

    df = pd.read_csv(dataset_path)
    missing_cols = [c for c in FEATURE_COLUMNS + [TARGET_COLUMN] if c not in df.columns]
    if missing_cols:
        raise ValueError(
            f"Dataset must contain columns: {FEATURE_COLUMNS + [TARGET_COLUMN]}. Missing: {missing_cols}"
        )

    df = df.dropna(subset=[TARGET_COLUMN]).copy()

    # Ensure 1000+ rows for stable training (synthetic augmentation if needed).
    if len(df) < min_rows:
        add_n = int(min_rows - len(df))
        logger.warning("Dataset has %s rows; augmenting with %s synthetic rows.", len(df), add_n)
        df = pd.concat([df, generate_synthetic_rows(add_n, seed=seed)], ignore_index=True)

    X, y = split_features_target(df)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=seed)

    metrics, pipelines = compare_models(X_train, X_test, y_train, y_test)

    # Primary model: Random Forest (per project requirement).
    # Still keep metrics for comparison in the artifact.
    primary_name = "random_forest"
    primary_pipeline = pipelines[primary_name]

    artifact: Dict[str, object] = {
        "pipeline": primary_pipeline,
        "model_name": primary_name,
        "model_version": CONFIG.model_version,
        "feature_columns": FEATURE_COLUMNS,
        "target_column": TARGET_COLUMN,
        "metrics": metrics,
        "training_rows": int(len(df)),
        "seed": int(seed),
    }

    CONFIG.model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, CONFIG.model_path)

    logger.info("Training complete. Primary model: %s", primary_name)
    logger.info("Saved model artifact to %s", str(CONFIG.model_path))
    return artifact


def main() -> None:
    setup_logging()

    if not CONFIG.dataset_path.exists():
        raise FileNotFoundError(f"Dataset not found at {CONFIG.dataset_path}")

    artifact = train_and_save()
    print("\n=== Model comparison (lower RMSE is better) ===")
    print(json.dumps(artifact["metrics"], indent=2))


if __name__ == "__main__":
    main()

