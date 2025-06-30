from marshmallow import Schema, fields, ValidationError, validate
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema

class DocumentSchema(SQLAlchemyAutoSchema):
    id = fields.Int(dump_only=True)
    item_id = fields.Int(required=True, error_messages={"required": "Item ID is required."})
    file_name = fields.String(required=True, error_messages={"required": "File name is required."})
    file_path = fields.String(required=True, error_messages={"required": "File path is required."})
    uploaded_at = fields.DateTime(dump_only=True)

    class Meta:
        # Note: Ensure your Document model is correctly imported and configured for SQLAlchemyAutoSchema if you use it.
        # For now, explicitly defining fields.
        fields = ("id", "item_id", "file_name", "file_path", "uploaded_at") 
        ordered = True

class ChecklistItemSchema(SQLAlchemyAutoSchema):
    id = fields.Int(dump_only=True)
    category_id = fields.Int(required=True, error_messages={"required": "Category ID is required."})
    task_title = fields.String(required=True, validate=validate.Length(min=1), error_messages={"required": "Task title cannot be empty."})
    is_completed = fields.Boolean(missing=False)
    due_date = fields.DateTime(allow_none=True)
    description = fields.String(allow_none=True, missing="")
    order = fields.Int(missing=0)
    documents = fields.List(fields.Nested(DocumentSchema), allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    class Meta:
        # Note: Ensure your ChecklistItem model is correctly imported and configured for SQLAlchemyAutoSchema if you use it.
        fields = ("id", "category_id", "task_title", "is_completed", "due_date", "description", "order", "documents", "created_at", "updated_at")
        ordered = True

class MyTasksItemSchema(Schema):
    """Schema for items in the 'My Tasks' aggregated view."""
    item_id = fields.Int(attribute="id")
    item_title = fields.Str(attribute="task_title")
    due_date = fields.DateTime()
    parent_checklist_id = fields.Int(attribute="category.profile.id")
    parent_checklist_title = fields.Str(attribute="category.profile.title")
    is_completed = fields.Boolean() # Include completion status for context

class ChecklistCategorySchema(SQLAlchemyAutoSchema):
    id = fields.Int(dump_only=True)
    profile_id = fields.Int(required=True, error_messages={"required": "Profile ID is required."})
    name = fields.String(required=True, validate=validate.Length(min=1), error_messages={"required": "Category name cannot be empty."})
    order = fields.Int(missing=0)
    items = fields.List(fields.Nested(ChecklistItemSchema), allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    class Meta:
        # Note: Ensure your ChecklistCategory model is correctly imported and configured for SQLAlchemyAutoSchema if you use it.
        fields = ("id", "profile_id", "name", "order", "items", "created_at", "updated_at")
        ordered = True

class ChecklistProfileSchema(SQLAlchemyAutoSchema):
    id = fields.Int(dump_only=True)
    user_id = fields.Int(required=True, error_messages={"required": "User ID is required."})
    title = fields.String(required=True, validate=validate.Length(min=1), error_messages={"required": "Title cannot be empty."})
    due_date = fields.DateTime(allow_none=True)
    status = fields.String(validate=validate.OneOf(["on_hold", "in_progress", "completed"]), missing="on_hold")
    categories = fields.List(fields.Nested(ChecklistCategorySchema), allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    class Meta:
        # Note: Ensure your ChecklistProfile model is correctly imported and configured for SQLAlchemyAutoSchema if you use it.
        fields = ("id", "user_id", "title", "due_date", "status", "categories", "created_at", "updated_at")
        ordered = True

class ChecklistProfileCreateSchema(Schema):
    title = fields.String(required=True, validate=validate.Length(min=1), error_messages={"required": "Title cannot be empty."})
    due_date = fields.DateTime(allow_none=True)
    status = fields.String(validate=validate.OneOf(["on_hold", "in_progress", "completed"]), missing="on_hold")

class ChecklistItemUpdateSchema(Schema):
    task_title = fields.String(validate=validate.Length(min=1))
    is_completed = fields.Boolean()
    due_date = fields.DateTime(allow_none=True)
    description = fields.String(allow_none=True)
    order = fields.Int()

class ChecklistCategoryUpdateSchema(Schema):
    name = fields.String(validate=validate.Length(min=1))
    order = fields.Int()

class ChecklistProfileUpdateSchema(Schema):
    title = fields.String(validate=validate.Length(min=1))
    due_date = fields.DateTime(allow_none=True)
    status = fields.String(validate=validate.OneOf(["on_hold", "in_progress", "completed"]))

