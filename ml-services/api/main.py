from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.common.logger import logger
from src.ingestion.fetch_api_to_csv import fetch_collection, ENDPOINTS
from src.features.build_features import build_features
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
        features_dict = request.model_dump()
        return predict_realtime(features_dict)
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


def fetch_merchant_data_selectively(merchant_code: str) -> tuple[str, str]:
    # 1. Fetch the merchants collection first (which is very small) to resolve code to ID and user_id
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
            detail=f"Merchant with code {merchant_code} not found in database records"
        )
        
    merchant = merchant_rows.iloc[0]
    merchant_id = str(merchant["_id"])
    user_id = str(merchant["user_id"])
    
    logger.info(f"Resolved: merchant_code={merchant_code} -> merchant_id={merchant_id}, user_id={user_id}")
    
    # 2. Fetch only the requested merchant's records for all heavy transactional collections
    logger.info(f"Targeted-fetching heavy transactional and utility logs only for user_id={user_id}, merchant_id={merchant_id}...")
    fetch_collection("transactions", f"/transactions/?merchant_id={user_id}")
    fetch_collection("wallet_activities", f"/wallet-activities/?user_id={user_id}")
    fetch_collection("utility_payments", f"/utility-payments/?merchant_id={merchant_id}")
    fetch_collection("loan_applications", f"/loan-applications/?merchant_id={merchant_id}")
    fetch_collection("repayment_records", f"/repayment-records/?merchant_id={merchant_id}")
    fetch_collection("psychometric_answers", f"/psychometric-answers/?merchant_id={merchant_id}")
    fetch_collection("users", f"/users/?user_code={user_id}")
    
    # 3. Fetch small graph-level collections in full for PageRank trust calculations
    logger.info("Fetching small graph-level collections in full...")
    fetch_collection("social_edges", "/social-edges/")
    fetch_collection("credit_scores", "/credit-scores/")
    
    # Fill in empty dataframes for other unused/optional collections to avoid empty raw files crashes
    from src.common.config import RAW_DATA_DIR
    for col in ["customers", "psychometric_questions", "merchant_features", "model_predictions", "ml_training_runs"]:
        csv_path = RAW_DATA_DIR / f"{col}.csv"
        if not csv_path.exists():
            with open(csv_path, "w", encoding="utf-8") as f:
                f.write("") # Create empty file to satisfy safe_read
                
    return merchant_id, user_id


@app.get("/predict/live/{merchant_code}")
def predict_live_endpoint(merchant_code: str):
    try:
        # Fetch selectively
        merchant_id, user_id = fetch_merchant_data_selectively(merchant_code)
            
        logger.info("Re-engineering alternative features (F1-F5 scores)...")
        df = build_features()
        
        merchant_rows = df[df["merchant_id"].astype(str) == merchant_id]
        if merchant_rows.empty:
            raise HTTPException(
                status_code=404, 
                detail=f"Failed to build features for merchant {merchant_code}"
            )
            
        row = merchant_rows.iloc[0].to_dict()
        
        logger.info(f"Generating live credit scoring and loan recommendation for {merchant_code}...")
        return predict_realtime(row)
        
    except HTTPException as he:
        raise he
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@app.get("/predict/live-network/{merchant_code}")
def predict_live_network_endpoint(merchant_code: str):
    try:
        # Fetch selectively
        merchant_id, user_id = fetch_merchant_data_selectively(merchant_code)
            
        logger.info("Re-engineering alternative features with dynamic network credit scores (F1-F5)...")
        df = build_features()
        
        merchant_rows = df[df["merchant_id"].astype(str) == merchant_id]
        if merchant_rows.empty:
            raise HTTPException(
                status_code=404, 
                detail=f"Failed to build features for merchant {merchant_code}"
            )
            
        row = merchant_rows.iloc[0].to_dict()
        
        logger.info(f"Generating live network-based credit scoring and loan recommendation for {merchant_code}...")
        return predict_realtime(row)
        
    except HTTPException as he:
        raise he
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
