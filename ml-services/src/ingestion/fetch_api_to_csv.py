import requests
import pandas as pd

from src.common.config import BACKEND_API_BASE_URL, RAW_DATA_DIR
from src.common.logger import logger

# These match your current Swagger endpoints.
# Optional endpoints are included for future schemas. Missing APIs will be skipped safely.
ENDPOINTS = {
    "users": "/users/",
    "merchants": "/merchants/",
    "customers": "/customers/",
    "transactions": "/transactions/",
    "utility_payments": "/utility-payments/",
    "wallet_activities": "/wallet-activities/",

    # Optional/future endpoints. Keep them here once backend adds these CRUD routes.
    "loan_applications": "/loan-applications/",
    "repayment_records": "/repayment-records/",
    "social_edges": "/social-edges/",
    "psychometric_questions": "/psychometric-questions/",
    "psychometric_answers": "/psychometric-answers/",
}


def extract_records(payload):
    if isinstance(payload, list):
        return payload

    if isinstance(payload, dict):
        for key in ["data", "items", "results", "records", "documents"]:
            value = payload.get(key)
            if isinstance(value, list):
                return value

        # Some APIs return { success: true, data: { items: [] } }
        data = payload.get("data")
        if isinstance(data, dict):
            for key in ["items", "results", "records", "documents"]:
                value = data.get(key)
                if isinstance(value, list):
                    return value

    return []


def fetch_collection(name: str, endpoint: str) -> pd.DataFrame:
    url = f"{BACKEND_API_BASE_URL}{endpoint}"
    logger.info(f"Fetching {name} from {url}")

    response = requests.get(url, timeout=120)

    if response.status_code == 404:
        logger.warning(f"Endpoint not found, skipping: {url}")
        return pd.DataFrame()

    response.raise_for_status()

    records = extract_records(response.json())
    df = pd.json_normalize(records)

    output_path = RAW_DATA_DIR / f"{name}.csv"
    df.to_csv(output_path, index=False)

    logger.info(f"Saved {len(df)} rows to {output_path}")
    return df


def main():
    logger.info(f"Backend API base URL: {BACKEND_API_BASE_URL}")

    for name, endpoint in ENDPOINTS.items():
        try:
            fetch_collection(name, endpoint)
        except Exception as error:
            logger.error(f"Failed to fetch {name}: {error}")


if __name__ == "__main__":
    main()
