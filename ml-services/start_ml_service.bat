@echo off
REM Start ML service: ingestion -> validate -> features -> train -> uvicorn
cd /d "%~dp0"
set "ML_SERVICE_PORT=%ML_SERVICE_PORT%"
if "%ML_SERVICE_PORT%"=="" set "ML_SERVICE_PORT=9000"

REM Fail early if the target port is already in use
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%ML_SERVICE_PORT% .*LISTENING"') do (
  echo Port %ML_SERVICE_PORT% is already in use by PID %%P.
  echo Stop that process first or run with a different port:
  echo   set ML_SERVICE_PORT=9001 ^&^& start_ml_service.bat
  pause
  exit /b 1
)

REM Activate virtual environment
if exist env\Scripts\activate.bat (
  call env\Scripts\activate.bat
) else (
  echo Virtual environment activation script not found: env\Scripts\activate.bat
  pause
  exit /b 1
)

REM Run steps with fail-fast
python -m src.ingestion.fetch_api_to_csv
if errorlevel 1 (
  echo fetch_api_to_csv failed with error %errorlevel%
  pause
  exit /b %errorlevel%
)

python -m src.ingestion.validate_raw_data
if errorlevel 1 (
  echo validate_raw_data failed with error %errorlevel%
  pause
  exit /b %errorlevel%
)

python -m src.features.build_features
if errorlevel 1 (
  echo build_features failed with error %errorlevel%
  pause
  exit /b %errorlevel%
)

python -m src.training.train_credit_risk_model
if errorlevel 1 (
  echo train_credit_risk_model failed with error %errorlevel%
  pause
  exit /b %errorlevel%
)

REM Start the API (keeps running)
python -m uvicorn api.main:app --reload --host 127.0.0.1 --port %ML_SERVICE_PORT%

pause
