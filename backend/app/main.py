from fastapi import FastAPI

from app.config import get_settings
from app.routes.auth import router as auth_router
from app.routes.health import router as health_router
from app.routes.items import router as items_router

settings = get_settings()

app = FastAPI(
    title="WeatherFit API",
    version="0.1.0",
)

app.include_router(health_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(items_router, prefix="/api")


@app.get("/")
def root() -> dict:
    return {
        "service": "weatherfit-backend",
        "environment": settings.app_env,
        "docs": "/docs",
    }
