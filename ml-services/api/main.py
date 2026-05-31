from datetime import datetime
from threading import Lock

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.common.logger import logger
from src.features.build_features import build_features
from src.ingestion.fetch_api_to_csv import fetch_collection, main as run_ingestion
from src.prediction.predict_merchant import predict_merchant, predict_realtime


class RealTimeFeatures(BaseModel):
    merchant_id: str = Field(default="REALTIME")
    merchant_code: str = Field(default="REALTIME")
    merchant_user_id: str = Field(default="REALTIME")
    business_type: str = Field(default="OTHER")
    wallet_age_months: float = Field(default=0.0)
    monthly_revenue_avg: float = Field(default=0.0)
    active_days: float = Field(default=0.0)
    active_days_ratio: float = Field(default=0.0)
    transaction_growth_rate: float = Field(default=0.0)
    payment_channel_count: float = Field(default=1.0)
    supplier_payment_ratio: float = Field(default=0.0)
    wallet_velocity_score: float = Field(default=0.4)
    transaction_gravity_score: float = Field(default=0.0)
    liquidity_buffer_score: float = Field(default=0.4)
    remittance_security_score: float = Field(default=0.0)
    airtime_consistency_score: float = Field(default=0.5)
    utility_calibration_score: float = Field(default=0.5)
    micro_obligation_score: float = Field(default=0.5)
    social_pagerank_score: float = Field(default=0.4)
    collusion_safety_score: float = Field(default=0.5)
    guarantor_health_score: float = Field(default=0.4)
    collusion_risk_score: float = Field(default=0.5)
    psychometric_avg: float = Field(default=500.0)
    conscientiousness_score: float = Field(default=0.5)
    risk_decision_consistency_score: float = Field(default=0.5)
    customer_diversity_score: float = Field(default=0.5)
    repeat_customer_ratio: float = Field(default=0.0)
    refund_rate: float = Field(default=0.0)
    failed_payment_rate: float = Field(default=0.0)
    cashout_speed_score: float = Field(default=0.6)
    loan_to_income_ratio: float = Field(default=0.0)
    suspicious_spike_score: float = Field(default=0.0)
    seasonal_pattern_score: float = Field(default=0.45)
    repayment_consistency_score: float = Field(default=0.6)
    repayment_plan_daily_fit: float = Field(default=0.35)
    repayment_plan_weekly_fit: float = Field(default=0.45)
    repayment_plan_seasonal_fit: float = Field(default=0.20)


app = FastAPI(
    title="SajiloScore ML Service",
    description="F1-F5 scoring and ML prediction service for merchant creditworthiness",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


PIPELINE_LOCK = Lock()

_batch_status: dict = {
    "running": False,
    "last_run_at": None,
    "last_run_status": "never",
    "last_run_message": None,
    "merchants_scored": 0,
}


def fetch_merchant_data_selectively(merchant_code: str) -> tuple[str, str]:
    logger.info("Resolving merchant ID and parent User ID from merchants collection...")
    merchants_df = fetch_collection("merchants", "/merchants/")
    if merchants_df.empty:
        raise HTTPException(status_code=404, detail="Merchants collection is empty or unreachable")

    merchant_rows = merchants_df[merchants_df["merchant_code"].astype(str) == str(merchant_code)]
    if merchant_rows.empty:
        merchant_rows = merchants_df[merchants_df["_id"].astype(str) == str(merchant_code)]

    if merchant_rows.empty:
        raise HTTPException(
            status_code=404,
            detail=f"Merchant with code {merchant_code} not found in database records",
        )

    merchant = merchant_rows.iloc[0]
    merchant_id = str(merchant["_id"])
    user_id = str(merchant["user_id"])

    logger.info(f"Resolved: merchant_code={merchant_code} -> merchant_id={merchant_id}, user_id={user_id}")
    logger.info(
        f"Targeted-fetching heavy transactional and utility logs only for user_id={user_id}, merchant_id={merchant_id}..."
    )

    fetch_collection("transactions", f"/transactions/?merchant_id={user_id}")
    fetch_collection("wallet_activities", f"/wallet-activities/?user_id={user_id}")
    fetch_collection("utility_payments", f"/utility-payments/?merchant_id={merchant_id}")
    fetch_collection("loan_applications", f"/loan-applications/?merchant_id={merchant_id}")
    fetch_collection("repayment_records", f"/repayment-records/?merchant_id={merchant_id}")
    fetch_collection("psychometric_answers", f"/psychometric-answers/?merchant_id={merchant_id}")
    fetch_collection("users", f"/users/{user_id}")

    logger.info("Fetching small graph-level collections in full...")
    fetch_collection("social_edges", "/social-edges/")
    fetch_collection("credit_scores", "/credit-scores/")

    return merchant_id, user_id


def build_live_merchant_prediction(merchant_code: str) -> dict:
    with PIPELINE_LOCK:
        merchant_id, _ = fetch_merchant_data_selectively(merchant_code)

        logger.info("Re-engineering alternative features (F1-F5 scores)...")
        df = build_features()

        merchant_rows = df[df["merchant_id"].astype(str) == merchant_id]
        if merchant_rows.empty:
            raise HTTPException(
                status_code=404,
                detail=f"Failed to build features for merchant {merchant_code}",
            )

        row = merchant_rows.iloc[0].to_dict()
        logger.info(f"Generating live credit scoring and loan recommendation for {merchant_code}...")
        return predict_realtime(row)


def _run_full_pipeline_sync():
    from src.training.train_credit_risk_model import main as run_training

    _batch_status["running"] = True
    _batch_status["last_run_at"] = datetime.utcnow().isoformat() + "Z"
    _batch_status["last_run_status"] = "running"
    _batch_status["last_run_message"] = "Pipeline started"
    _batch_status["merchants_scored"] = 0

    try:
        with PIPELINE_LOCK:
            logger.info("[BATCH] Step 1/3 - Fetching all collections from backend API...")
            run_ingestion()
            logger.info("[BATCH] Step 1/3 complete.")

            logger.info("[BATCH] Step 2/3 - Building feature matrix...")
            df = build_features()
            logger.info(f"[BATCH] Step 2/3 complete. {len(df)} merchant rows built.")

            logger.info("[BATCH] Step 3/3 - Re-training credit risk model...")
            run_training()
            logger.info("[BATCH] Step 3/3 complete.")

        _batch_status["merchants_scored"] = len(df)
        _batch_status["last_run_status"] = "success"
        _batch_status["last_run_message"] = f"Pipeline completed. {len(df)} merchants scored."
        logger.info("[BATCH] Full pipeline finished successfully.")
    except Exception as error:
        _batch_status["last_run_status"] = "failed"
        _batch_status["last_run_message"] = str(error)
        logger.error(f"[BATCH] Pipeline failed: {error}")
    finally:
        _batch_status["running"] = False


@app.get("/")
def root():
    return {
        "service": "SajiloScore ML Service",
        "status": "running",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
    }


@app.get("/predict/{merchant_id}")
def predict(merchant_id: str):
    try:
        return predict_merchant(merchant_id)
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@app.post("/predict/realtime")
def predict_realtime_endpoint(request: RealTimeFeatures):
    try:
        return predict_realtime(request.model_dump())
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@app.get("/predict/live/{merchant_code}")
def predict_live_endpoint(merchant_code: str):
    try:
        return build_live_merchant_prediction(merchant_code)
    except HTTPException as error:
        raise error
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@app.get("/predict/live-network/{merchant_code}")
def predict_live_network_endpoint(merchant_code: str):
    try:
        return build_live_merchant_prediction(merchant_code)
    except HTTPException as error:
        raise error
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@app.post("/batch/run", summary="Trigger full ML pipeline (for cron jobs)")
def batch_run(background_tasks: BackgroundTasks):
    if _batch_status["running"]:
        raise HTTPException(
            status_code=409,
            detail="A pipeline run is already in progress. Poll /batch/status.",
        )

    background_tasks.add_task(_run_full_pipeline_sync)
    return {
        "accepted": True,
        "message": "Full ML pipeline started in background. Poll /batch/status for progress.",
        "started_at": datetime.utcnow().isoformat() + "Z",
    }


@app.get("/batch/status", summary="Check status of the last batch pipeline run")
def batch_status():
    return _batch_status
