from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from src.prediction.predict_merchant import predict_merchant

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
        "status": "running"
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/predict/{merchant_id}")
def predict(merchant_id: str):
    try:
        return predict_merchant(merchant_id)
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
