from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Dict

import joblib
import numpy as np

from services.preprocessing import payload_to_dataframe, validate_payload
from utils.config import CONFIG

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class PredictionResponse:
    ok: bool
    predicted_price: float | None = None
    currency: str | None = None
    model_name: str | None = None
    model_version: str | None = None
    confidence: float | None = None
    prediction_interval: Dict[str, float] | None = None
    error: str | None = None


class PredictionService:
    def __init__(self) -> None:
        self._artifact: Dict[str, Any] | None = None

    def load(self) -> None:
        if self._artifact is not None:
            return
        if not CONFIG.model_path.exists():
            raise FileNotFoundError(
                f"Model file not found at {CONFIG.model_path}. Run `python model_training.py` first."
            )
        self._artifact = joblib.load(CONFIG.model_path)
        logger.info(
            "Loaded model artifact",
            extra={
                "model_name": self._artifact.get("model_name"),
                "model_version": self._artifact.get("model_version"),
            },
        )

    def predict(self, payload: Dict[str, Any]) -> PredictionResponse:
        vr = validate_payload(payload)
        if not vr.ok:
            return PredictionResponse(ok=False, error=vr.error)

        self.load()
        assert self._artifact is not None

        pipeline = self._artifact["pipeline"]
        X = payload_to_dataframe(payload)
        model = pipeline.named_steps.get("model")
        pred = float(pipeline.predict(X)[0])
        pred = max(pred, 0.0)

        confidence: float | None = None
        interval: Dict[str, float] | None = None

        # Confidence/interval for RandomForest (std across trees).
        try:
            estimators = getattr(model, "estimators_", None)
            if estimators:
                tree_preds = np.array([float(est.predict(pipeline.named_steps["preprocess"].transform(X))[0]) for est in estimators])
                sigma = float(np.std(tree_preds))
                # heuristic: convert uncertainty to 0..1 confidence
                denom = max(pred, 1.0)
                rel = min(sigma / denom, 1.0)
                confidence = float(max(0.0, min(1.0, 1.0 - rel)))
                lo = max(0.0, pred - 1.96 * sigma)
                hi = max(lo, pred + 1.96 * sigma)
                interval = {"low": float(lo), "high": float(hi)}
        except Exception:
            confidence = None
            interval = None

        return PredictionResponse(
            ok=True,
            predicted_price=pred,
            currency=CONFIG.currency,
            model_name=str(self._artifact.get("model_name", "unknown")),
            model_version=str(self._artifact.get("model_version", CONFIG.model_version)),
            confidence=confidence,
            prediction_interval=interval,
        )

