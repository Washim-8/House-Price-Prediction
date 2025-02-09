from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class AppConfig:
    model_version: str = "1.0.0"
    currency: str = "INR"

    project_root: Path = Path(__file__).resolve().parents[1]
    dataset_path: Path = project_root / "dataset" / "housing.csv"
    model_path: Path = project_root / "models" / "house_model.joblib"


CONFIG = AppConfig()

