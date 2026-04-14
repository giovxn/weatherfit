from io import BytesIO

from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError

from model import Predictor

app = FastAPI(title="WeatherFit ML Service")
predictor = None


@app.on_event("startup")
def startup_event():
    global predictor
    predictor = Predictor()


@app.get("/api/ml/health")
def health():
    return {"status": "ok"}


@app.post("/api/ml/predict")
async def predict(file: UploadFile = File(...)):
    if predictor is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        content = await file.read()
        image = Image.open(BytesIO(content)).convert("RGB")
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status_code=400, detail="Invalid image file")

    result = predictor.predict(image)
    return result
