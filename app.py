from __future__ import annotations

import logging
import os
import socket
from typing import Any, Dict

import pandas as pd
from flask import Flask, jsonify, render_template, request
from werkzeug.utils import secure_filename

from services.prediction_service import PredictionService
from model_training import train_and_save
from utils.config import CONFIG
from utils.logging_config import setup_logging

logger = logging.getLogger(__name__)


def create_app() -> Flask:
    setup_logging()
    app = Flask(__name__)
    predictor = PredictionService()

    @app.get("/")
    def dashboard() -> str:
        return render_template("dashboard.html")

    @app.get("/index")
    def index() -> str:
        return render_template("index.html")

    @app.get("/about_contact")
    def about_contact() -> str:
        return render_template("about_contact.html")

    @app.get("/health")
    def health() -> Dict[str, Any]:
        return {"ok": True}

    @app.post("/predict")
    def predict() -> Any:
        try:
            payload: Dict[str, Any] = request.get_json(force=True, silent=False)
        except Exception:
            return jsonify({"ok": False, "error": "Invalid JSON payload."}), 400

        try:
            result = predictor.predict(payload)
        except FileNotFoundError as e:
            logger.exception("Model missing")
            return jsonify({"ok": False, "error": str(e)}), 500
        except Exception:
            logger.exception("Prediction failed")
            return jsonify({"ok": False, "error": "Prediction failed."}), 500

        if not result.ok:
            return jsonify({"ok": False, "error": result.error}), 400

        return jsonify(
            {
                "ok": True,
                "predicted_price": result.predicted_price,
                "currency": result.currency,
                "model_name": result.model_name,
                "model_version": result.model_version,
                "confidence": result.confidence,
                "prediction_interval": result.prediction_interval,
            }
        )

    @app.post("/admin/retrain")
    def admin_retrain() -> Any:
        try:
            artifact = train_and_save()
            # reload model in predictor
            predictor._artifact = None  # noqa: SLF001 - intentional internal reset
            predictor.load()
            return jsonify(
                {
                    "ok": True,
                    "model_name": artifact.get("model_name"),
                    "model_version": artifact.get("model_version"),
                    "training_rows": artifact.get("training_rows"),
                    "metrics": artifact.get("metrics"),
                }
            )
        except Exception as e:
            logger.exception("Retrain failed")
            return jsonify({"ok": False, "error": str(e)}), 500

    @app.post("/admin/upload-dataset")
    def admin_upload_dataset() -> Any:
        """
        Upload a CSV file to replace dataset/housing.csv.
        Expected columns: area, bedrooms, bathrooms, location, price
        """
        f = request.files.get("file")
        if f is None or not getattr(f, "filename", ""):
            return jsonify({"ok": False, "error": "Missing file field 'file'."}), 400

        filename = secure_filename(f.filename)
        if not filename.lower().endswith(".csv"):
            return jsonify({"ok": False, "error": "Only .csv files are supported."}), 400

        try:
            CONFIG.dataset_path.parent.mkdir(parents=True, exist_ok=True)
            f.save(CONFIG.dataset_path)
            df = pd.read_csv(CONFIG.dataset_path)
            return jsonify({"ok": True, "saved_as": "dataset/housing.csv", "rows": int(len(df))})
        except Exception as e:
            logger.exception("Dataset upload failed")
            return jsonify({"ok": False, "error": str(e)}), 500

    return app


app = create_app()

def _is_port_free(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            s.bind((host, port))
            return True
        except OSError:
            return False


if __name__ == "__main__":
    host = "127.0.0.1"
    preferred = int(os.environ.get("PORT", "5003"))
    port = preferred if _is_port_free(host, preferred) else preferred + 1
    debug = os.environ.get("DEBUG", "1").strip() not in {"0", "false", "False"}
    app.run(host=host, port=port, debug=debug, use_reloader=False)

