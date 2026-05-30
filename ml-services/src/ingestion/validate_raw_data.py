import pandas as pd
from src.common.config import RAW_DATA_DIR
from src.common.logger import logger

REQUIRED_FILES = [
    "merchants.csv",
    "customers.csv",
    "transactions.csv",
    "utility_payments.csv",
    "wallet_activities.csv",
    "users.csv",
]

MIN_REQUIRED_COLUMNS = {
    "merchants.csv": ["_id", "merchant_code", "business_type"],
    "transactions.csv": ["amount", "transaction_type", "status"],
    "utility_payments.csv": ["merchant_id", "bill_type", "payment_status"],
    "wallet_activities.csv": ["merchant_id", "activity_type", "amount"],
}


def main():
    ok = True

    for file_name in REQUIRED_FILES:
        path = RAW_DATA_DIR / file_name
        if not path.exists():
            logger.warning(f"Missing raw file: {file_name}")
            ok = False
            continue

        df = pd.read_csv(path)
        logger.info(f"{file_name}: {len(df)} rows")

        for col in MIN_REQUIRED_COLUMNS.get(file_name, []):
            if col not in df.columns:
                logger.warning(f"{file_name} missing required column: {col}")
                ok = False

    if ok:
        logger.info("Raw data validation passed.")
    else:
        logger.warning("Raw data validation found issues. Fix before training.")


if __name__ == "__main__":
    main()
