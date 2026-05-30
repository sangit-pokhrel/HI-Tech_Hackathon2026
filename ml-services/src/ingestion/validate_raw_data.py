import pandas as pd
from src.common.config import RAW_DATA_DIR
from src.common.logger import logger

REQUIRED_FILES = [
    "users.csv",
    "merchants.csv",
    "customers.csv",
    "transactions.csv",
    "utility_payments.csv",
    "wallet_activities.csv",
]

MIN_REQUIRED_COLUMNS = {
    "users.csv": ["_id", "user_code", "user_type"],
    "merchants.csv": ["_id", "user_id", "merchant_code", "business_type"],
    "customers.csv": ["_id", "user_id", "customer_code"],
    "transactions.csv": ["sender_id", "receiver_id", "amount", "transaction_type", "status"],
    "utility_payments.csv": ["merchant_id", "sender_id", "bill_type", "payment_status", "days_late"],
    "wallet_activities.csv": ["user_id", "activity_type", "amount", "balance_after_transaction"],
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
                logger.warning(f"{file_name} missing column: {col}")
                ok = False

    repayment_path = RAW_DATA_DIR / "repayment_records.csv"
    if repayment_path.exists():
        repayment_df = pd.read_csv(repayment_path)
        if not repayment_df.empty and "ml_target_default" in repayment_df.columns:
            logger.info("Repayment ML target column found.")
        else:
            logger.warning("repayment_records.csv exists but has no ml_target_default values.")
    else:
        logger.warning("repayment_records.csv missing. Synthetic labels may be used if enabled.")

    if ok:
        logger.info("Raw data validation completed.")
    else:
        logger.warning("Raw data validation found issues.")


if __name__ == "__main__":
    main()
