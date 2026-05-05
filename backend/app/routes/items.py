import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.wardrobe_item import WardrobeItem
from app.schemas.items import ItemCreate, ItemResponse

router = APIRouter(prefix="/items", tags=["items"])


def _normalize_formalities(formalities: list[str] | None) -> list[str]:
    if not formalities:
        return []
    return sorted(
        {
            (value or "").strip().lower()
            for value in formalities
            if (value or "").strip()
        }
    )


def _to_response(item: WardrobeItem) -> ItemResponse:
    try:
        formalities = json.loads(item.formalities) if item.formalities else []
        if not isinstance(formalities, list):
            formalities = []
    except json.JSONDecodeError:
        formalities = []

    return ItemResponse(
        id=item.id,
        user_id=item.user_id,
        name=item.name,
        category=item.category,
        warmth_rating=item.warmth_rating,
        weather_protection=item.weather_protection,
        formalities=formalities,
        image_url=item.image_url,
        created_at=item.created_at,
    )


@router.get("", response_model=list[ItemResponse])
def list_items(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ItemResponse]:
    items = (
        db.query(WardrobeItem)
        .filter(WardrobeItem.user_id == current_user.id)
        .order_by(WardrobeItem.created_at.desc(), WardrobeItem.id.desc())
        .all()
    )
    return [_to_response(item) for item in items]


@router.post("", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(
    payload: ItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ItemResponse:
    normalized_name = payload.name.strip()
    normalized_category = payload.category.strip().lower()
    normalized_protection = payload.weather_protection.strip().lower()
    normalized_image = (payload.image_url or "").strip() or None
    normalized_formalities = _normalize_formalities(payload.formalities)
    normalized_formalities_json = json.dumps(normalized_formalities)

    existing = (
        db.query(WardrobeItem)
        .filter(
            WardrobeItem.user_id == current_user.id,
            WardrobeItem.name == normalized_name,
            WardrobeItem.category == normalized_category,
            WardrobeItem.warmth_rating == payload.warmth_rating,
            WardrobeItem.weather_protection == normalized_protection,
            WardrobeItem.formalities == normalized_formalities_json,
            WardrobeItem.image_url == normalized_image,
        )
        .first()
    )
    if existing is not None:
        return _to_response(existing)

    item = WardrobeItem(
        user_id=current_user.id,
        name=normalized_name,
        category=normalized_category,
        warmth_rating=payload.warmth_rating,
        weather_protection=normalized_protection,
        formalities=normalized_formalities_json,
        image_url=normalized_image,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _to_response(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    item = (
        db.query(WardrobeItem)
        .filter(WardrobeItem.id == item_id, WardrobeItem.user_id == current_user.id)
        .first()
    )
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found",
        )
    db.delete(item)
    db.commit()
