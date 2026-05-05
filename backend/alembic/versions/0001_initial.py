"""create users and wardrobe_items tables

Revision ID: 0001_initial
Revises:
Create Date: 2026-05-05 13:31:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0001_initial"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
    )
    op.create_index("ix_users_id", "users", ["id"], unique=False)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "wardrobe_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("warmth_rating", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("weather_protection", sa.String(length=50), nullable=False, server_default="none"),
        sa.Column("formalities", sa.Text(), nullable=False, server_default="casual"),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_wardrobe_items_id", "wardrobe_items", ["id"], unique=False)
    op.create_index("ix_wardrobe_items_user_id", "wardrobe_items", ["user_id"], unique=False)
    op.create_index("ix_wardrobe_items_category", "wardrobe_items", ["category"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_wardrobe_items_category", table_name="wardrobe_items")
    op.drop_index("ix_wardrobe_items_user_id", table_name="wardrobe_items")
    op.drop_index("ix_wardrobe_items_id", table_name="wardrobe_items")
    op.drop_table("wardrobe_items")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_table("users")
