import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

ROOT_DIR = Path(__file__).resolve().parents[2]

BACKEND_API_BASE_URL = os.getenv(
    "BACKEND_API_BASE_URL",
    "http://localhost:3001/api"
).rstrip("/")

GENERATE_SYNTHETIC_LABELS = os.getenv("GENERATE_SYNTHETIC_LABELS", "true").lower() == "true"

DATA_DIR = ROOT_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
PREDICTIONS_DIR = DATA_DIR / "predictions"

ARTIFACTS_DIR = ROOT_DIR / "artifacts"
MODEL_DIR = ARTIFACTS_DIR / "models"
METRICS_DIR = ARTIFACTS_DIR / "metrics"
EXPLAINABILITY_DIR = ARTIFACTS_DIR / "explainability"

for directory in [
    DATA_DIR,
    RAW_DATA_DIR,
    PROCESSED_DATA_DIR,
    PREDICTIONS_DIR,
    ARTIFACTS_DIR,
    MODEL_DIR,
    METRICS_DIR,
    EXPLAINABILITY_DIR,
]:
    directory.mkdir(parents=True, exist_ok=True)
