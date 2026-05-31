import requests
import pandas as pd

from src.common.config import BACKEND_API_BASE_URL, RAW_DATA_DIR
from src.common.logger import logger

# These endpoints match the backend naming style from your Swagger.
ENDPOINTS = {
    "users": "/users/",
    "merchants": "/merchants/",
    "customers": "/customers/",
    "transactions": "/transactions/",
    "utility_payments": "/utility-payments/",
    "wallet_activities": "/wallet-activities/",
    "loan_applications": "/loan-applications/",
    "repayment_records": "/repayment-records/",
    "social_edges": "/social-edges/",
    "psychometric_questions": "/psychometric-questions/",
    "psychometric_answers": "/psychometric-answers/",
    "merchant_features": "/merchant-features/",
    "model_predictions": "/model-predictions/",
    "credit_scores": "/credit-scores/",
    "ml_training_runs": "/ml-training-runs/",
}


def extract_records(payload):
    if isinstance(payload, list):
        return payload

    if isinstance(payload, dict):
        for key in ["data", "items", "results", "records", "documents"]:
            value = payload.get(key)
            if isinstance(value, list):
                return value

        data = payload.get("data")
        if isinstance(data, dict):
            for key in ["items", "results", "records", "documents"]:
                value = data.get(key)
                if isinstance(value, list):
                    return value

        # If a single object is returned accidentally, wrap it.
        if "_id" in payload:
            return [payload]

    return []


def fetch_collection(name: str, endpoint: str) -> pd.DataFrame:
    all_records = []
    page = 1
    limit = 100
    
    logger.info(f"Fetching all pages for {name} from {BACKEND_API_BASE_URL}{endpoint}...")

    try:
        while True:
            separator = "&" if "?" in endpoint else "?"
            url = f"{BACKEND_API_BASE_URL}{endpoint}{separator}page={page}&limit={limit}"
            
            response = requests.get(url, timeout=120)

            if response.status_code == 404:
                if page == 1:
                    logger.warning(f"Skipping {name}: endpoint not found")
                break

            response.raise_for_status()
            records = extract_records(response.json())
            
            if not records:
                break

            all_records.extend(records)
            
            if len(records) < limit:
                break
                
            page += 1

        if not all_records:
            logger.warning(f"No records found for {name}")
            return pd.DataFrame()

        df = pd.json_normalize(all_records)
        output_path = RAW_DATA_DIR / f"{name}.csv"
        df.to_csv(output_path, index=False)

        logger.info(f"Saved {len(df)} rows -> {output_path}")
        return df

    except Exception as error:
        logger.error(f"Failed to fetch {name}: {error}")
        return pd.DataFrame()


def main():
    logger.info(f"Backend API base URL: {BACKEND_API_BASE_URL}")

    for name, endpoint in ENDPOINTS.items():
        fetch_collection(name, endpoint)


if __name__ == "__main__":
    main()
