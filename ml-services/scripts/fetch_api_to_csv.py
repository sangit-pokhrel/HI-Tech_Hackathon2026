import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

import requests
import pandas as pd
from src.config import BASE_URL, RAW_DATA_DIR


ENDPOINTS = {
    "merchants": "/merchants",
    "customers": "/customers",
    "transactions": "/transactions",
    "utility_payments": "/utility-payments",
    "wallet_activities": "/wallet-activities",
    # "loan_applications": "/loan-applications",
    # "repayment_records": "/repayment-records",
    # "social_edges": "/social-edges",
    # "psychometric_questions": "/psychometric-questions",
    # "psychometric_answers": "/psychometric-answers",
}


def extract_records(payload):
    """
    Supports common backend response formats:
    1. [ {...}, {...} ]
    2. { data: [...] }
    3. { items: [...] }
    4. { results: [...] }
    """
    if isinstance(payload, list):
        return payload

    if isinstance(payload, dict):
        for key in ["data", "items", "results", "records"]:
            if key in payload and isinstance(payload[key], list):
                return payload[key]

    return []


def fetch_collection(name: str, endpoint: str) -> pd.DataFrame:
    url = f"{BASE_URL}{endpoint}"
    print(f"Fetching {name}: {url}")

    response = requests.get(url, timeout=120)
    response.raise_for_status()

    records = extract_records(response.json())
    df = pd.json_normalize(records)

    output_path = RAW_DATA_DIR / f"{name}.csv"
    df.to_csv(output_path, index=False)

    print(f"Saved {len(df)} rows -> {output_path}")
    return df


def main():
    print(f"Backend API Base URL: {BASE_URL}")

    for name, endpoint in ENDPOINTS.items():
        try:
            fetch_collection(name, endpoint)
        except Exception as error:
            print(f"Failed to fetch {name}: {error}")


if __name__ == "__main__":
    main()