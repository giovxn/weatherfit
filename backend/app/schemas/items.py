from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ItemBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    category: str
    warmth_rating: int = Field(ge=1, le=10)
    weather_protection: str = "none"
    formalities: list[str] = Field(default_factory=list)
    image_url: str | None = None


class ItemCreate(ItemBase):
    pass


class ItemResponse(ItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime | None = None
