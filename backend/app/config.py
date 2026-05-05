from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "development"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/weatherfit"
    jwt_secret: str = "replace_me_with_a_long_random_secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    google_client_id: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
