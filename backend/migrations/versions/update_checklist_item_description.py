"""Update ChecklistItem description to non-nullable with default empty string

Revision ID: update_checklist_item_desc
Revises: 96b00ea747ad
Create Date: 2025-06-08 19:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text

# revision identifiers, used by Alembic.
revision = 'update_checklist_item_desc'
down_revision = '96b00ea747ad' 
branch_labels = None
depends_on = None


def upgrade():
    op.execute(text("UPDATE checklist_item SET description = '' WHERE description IS NULL"))
    
    op.alter_column('checklist_item', 'description',
               existing_type=sa.TEXT(),
               nullable=False,
               server_default=sa.text("''"))


def downgrade():
    op.alter_column('checklist_item', 'description',
               existing_type=sa.TEXT(),
               nullable=True,
               server_default=None) 