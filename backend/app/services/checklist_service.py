from app.checklists.models import ChecklistProfile, ChecklistCategory, ChecklistItem, Document
from app.extensions import db
from sqlalchemy.exc import SQLAlchemyError
from flask import current_app
from app.checklists.schemas import (
    ChecklistProfileSchema,
    ChecklistProfileCreateSchema,
    ChecklistCategorySchema,
    ChecklistItemSchema,
    DocumentSchema,
    ChecklistProfileUpdateSchema,
    ChecklistCategoryUpdateSchema,
    ChecklistItemUpdateSchema,
    MyTasksItemSchema
)
from marshmallow import ValidationError
from datetime import datetime
import google.generativeai as genai
import os
import json
from pytz import timezone


class ChecklistService:
    # Helper function for validating checklist profile data
    def _validate_title(self, value):
        if not isinstance(value, str) or not value.strip():
            raise ValueError("Không được bỏ trống tiêu đề!")
        return value.strip()

    @staticmethod
    def create_checklist_profile(user_id, data):
        """Create a new checklist profile for a user"""
        profile_schema = ChecklistProfileCreateSchema()
        try:
            validated_data = profile_schema.load(data)
        except ValidationError as err:
            return {"error": err.messages}, 400

        profile = ChecklistProfile(
            user_id=user_id,
            title=validated_data['title'],
            due_date=validated_data.get('due_date'),
            status=validated_data.get('status', 'on_hold')
        )
        try:
            db.session.add(profile)
            db.session.commit()
            # Use the full schema for dumping the response
            response_schema = ChecklistProfileSchema()
            return response_schema.dump(profile), 201
        except SQLAlchemyError as e:
            db.session.rollback()
            current_app.logger.error(f"Database error creating profile: {str(e)}")
            return {"error": "Lỗi tạo hồ sơ checklist"}, 500
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Unexpected error creating profile: {str(e)}")
            return {"error": str(e)}, 400

    @staticmethod
    def create_checklist_profile_from_llm(user_id, prompt):
        """Create a new checklist profile for a user from a Gemini prompt"""
        try:
            api_key = os.getenv('GEMINI_API_KEY')
            if not api_key:
                current_app.logger.error("Error: Gemini API key missing from .env")
                raise ValueError("AI service configuration missing")

            genai.configure(api_key=api_key)
            model_name = os.getenv('GEMINI_MODEL_NAME', 'gemini-2.0-flash-exp')
            model = genai.GenerativeModel(model_name)
            
            full_prompt = f"""
            Generate a JSON object for a checklist based on the following request: '{prompt}'.
            The JSON object must have the following structure:
            - A root object.
            - The root object must have a key "title" with a string value.
            - The root object must have a key "categories" which is an array of objects.
            - Each object in the "categories" array must have a key "name" with a string value.
            - Each object in the "categories" array must have a key "items" which is an array of objects.
            - Each object in the "items" array must have a key "task_title" with a string value, and a key "description" with a string value.

            Example of the required JSON format:
            {{
              "title": "Trip to Japan",
              "categories": [
                {{
                  "name": "Pre-trip",
                  "items": [
                    {{
                      "task_title": "Book flights",
                      "description": "Find and book round-trip tickets."
                    }},
                    {{
                      "task_title": "Book hotels",
                      "description": "Reserve accommodation for all nights."
                    }}
                  ]
                }}
              ]
            }}

            Return only the JSON object, without any surrounding text or markdown.
            """

            response = model.generate_content(full_prompt)
            
            cleaned_response = response.text.strip()
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.endswith("```"):
                cleaned_response = cleaned_response[:-3]

            llm_data = json.loads(cleaned_response)
            
            return ChecklistService.create_checklist_profile(user_id, llm_data)
            
        except Exception as e:
            current_app.logger.error(f"Error generating checklist from LLM: {str(e)}")
            return {"error": "Lỗi tạo hồ sơ checklist từ LLM"}, 500

    @staticmethod
    def get_checklist_profile(profile_id):
        """Get a checklist profile with all its categories and items"""
        profile = ChecklistProfile.query.get(profile_id)
        if not profile:
            return {"error": "Không tìm thấy hồ sơ checklist"}, 404
        
        profile_schema = ChecklistProfileSchema()
        try:
            return profile_schema.dump(profile), 200
        except Exception as e:
            current_app.logger.error(f"Error fetching profile {profile_id}: {str(e)}")
            return {"error": "Lỗi lấy thông tin hồ sơ checklist"}, 500

    @staticmethod
    def get_categorized_tasks_for_user(user_id):
        """
        Fetches all checklist items for a user, categorizes them,
        and returns them in a structured response.
        """
        try:
            # Eagerly load relationships to avoid N+1 query problem.
            all_items = db.session.query(ChecklistItem).join(
                ChecklistCategory
            ).join(ChecklistProfile).filter(
                ChecklistProfile.user_id == user_id
            ).options(
                db.joinedload(ChecklistItem.category).joinedload(ChecklistCategory.profile)
            ).all()

            now_utc = datetime.now(timezone('UTC'))
            
            categorized = {
                "pending": [],
                "overdue": [],
                "done": []
            }

            for item in all_items:
                if item.is_completed:
                    categorized["done"].append(item)
                elif item.due_date and item.due_date < now_utc:
                    categorized["overdue"].append(item)
                else: # Not completed and due date is in the future or not set
                    categorized["pending"].append(item)
            
            # Use the new schema to format the output
            item_schema = MyTasksItemSchema()
            
            response_data = {
                "pending": item_schema.dump(categorized["pending"], many=True),
                "overdue": item_schema.dump(categorized["overdue"], many=True),
                "done": item_schema.dump(categorized["done"], many=True)
            }
            
            return response_data, 200

        except SQLAlchemyError as e:
            current_app.logger.error(f"Database error fetching categorized tasks for user {user_id}: {str(e)}")
            return {"error": "Lỗi cơ sở dữ liệu khi lấy công việc"}, 500
        except Exception as e:
            current_app.logger.error(f"Unexpected error fetching categorized tasks for user {user_id}: {str(e)}")
            return {"error": "Lỗi không mong muốn khi lấy công việc"}, 500

    @staticmethod
    def get_all_checklist_profiles(user_id):
        """Get all checklist profiles for a specific user"""
        profiles = ChecklistProfile.query.filter_by(user_id=user_id).all()
        if not profiles:
            return [], 200  # Return empty list if no profiles found
        
        profile_schema = ChecklistProfileSchema(many=True)
        try:
            return profile_schema.dump(profiles), 200
        except Exception as e:
            current_app.logger.error(f"Error fetching all profiles for user {user_id}: {str(e)}")
            return {"error": "Lỗi lấy tất cả hồ sơ checklist"}, 500

    @staticmethod
    def update_checklist_profile(profile_id, data):
        """Update specific fields of a checklist profile"""
        profile = ChecklistProfile.query.get(profile_id)
        if not profile:
            return {"error": "Không tìm thấy hồ sơ checklist"}, 404

        schema = ChecklistProfileUpdateSchema(partial=True)
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return {"error": err.messages}, 400

        # Filter out keys with None values to prevent overwriting existing data with nulls
        for key, value in validated_data.items():
            if value is not None:
                setattr(profile, key, value)

        try:
            db.session.commit()
            profile_schema = ChecklistProfileSchema()
            return profile_schema.dump(profile), 200
        except SQLAlchemyError as e:
            db.session.rollback()
            current_app.logger.error(f"Database error updating profile {profile_id}: {str(e)}")
            return {"error": "Lỗi cập nhật hồ sơ checklist"}, 500
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Unexpected error updating profile {profile_id}: {str(e)}")
            return {"error": str(e)}, 400
            
    @staticmethod
    def delete_checklist_profile(profile_id, user_id):
        """Delete a checklist profile"""
        profile = ChecklistProfile.query.get(profile_id)
        if not profile:
            return {"error": "Không tìm thấy hồ sơ checklist"}, 404
        if profile.user_id != user_id:
            return {"error": "Unauthorized"}, 403
        try:
            db.session.delete(profile)
            db.session.commit()
            return {}, 204
        except SQLAlchemyError as e:
            db.session.rollback()
            current_app.logger.error(f"Database error deleting profile {profile_id}: {str(e)}")
            return {"error": "Lỗi xóa hồ sơ checklist"}, 500
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Unexpected error deleting profile {profile_id}: {str(e)}")
            return {"error": str(e)}, 400

    # Category Services
    @staticmethod
    def create_category(profile_id, data):
        """Create a new category for a checklist profile"""
        profile = ChecklistProfile.query.get(profile_id)
        if not profile:
            return {"error": "Không tìm thấy hồ sơ checklist"}, 404

        category_schema = ChecklistCategorySchema()
        try:
            # Add profile_id to data before loading, as it's not part of request body for create
            data_with_profile_id = {**data, "profile_id": profile_id}
            validated_data = category_schema.load(data_with_profile_id)
        except ValidationError as err:
            return {"error": err.messages}, 400

        category = ChecklistCategory(
            profile_id=profile_id, # or validated_data['profile_id']
            name=validated_data['name'],
            order=validated_data.get('order', 0)
        )
        try:
            db.session.add(category)
            db.session.commit()
            return category_schema.dump(category), 201
        except SQLAlchemyError as e:
            db.session.rollback()
            current_app.logger.error(f"Database error creating category for profile {profile_id}: {str(e)}")
            return {"error": "Lỗi tạo danh mục"}, 500
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Unexpected error creating category for profile {profile_id}: {str(e)}")
            return {"error": str(e)}, 400

    @staticmethod
    def get_category(category_id):
        """Get a specific category"""
        category = ChecklistCategory.query.get(category_id)
        if not category:
            return {"error": "Không tìm thấy danh mục"}, 404
        category_schema = ChecklistCategorySchema()
        return category_schema.dump(category), 200

    @staticmethod
    def update_category(category_id, data, user_id):
        """Update a category"""
        category = ChecklistCategory.query.get(category_id)
        if not category:
            return {"error": "Không tìm thấy danh mục"}, 404
        if category.profile.user_id != user_id:
            return {"error": "Unauthorized"}, 403

        schema = ChecklistCategoryUpdateSchema(partial=True)
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return {"error": err.messages}, 400
        
        for key, value in validated_data.items():
            setattr(category, key, value)
            
        try:
            db.session.commit()
            category_schema = ChecklistCategorySchema()
            return category_schema.dump(category), 200
        except SQLAlchemyError as e:
            db.session.rollback()
            current_app.logger.error(f"Database error updating category {category_id}: {str(e)}")
            return {"error": "Lỗi cập nhật danh mục"}, 500
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Unexpected error updating category {category_id}: {str(e)}")
            return {"error": str(e)}, 400

    @staticmethod
    def delete_category(category_id, user_id):
        """Delete a category"""
        category = ChecklistCategory.query.get(category_id)
        if not category:
            return {"error": "Không tìm thấy danh mục"}, 404
        if category.profile.user_id != user_id:
            return {"error": "Unauthorized"}, 403
        try:
            db.session.delete(category)
            db.session.commit()
            return {}, 204
        except SQLAlchemyError as e:
            db.session.rollback()
            current_app.logger.error(f"Database error deleting category {category_id}: {str(e)}")
            return {"error": "Lỗi xóa danh mục"}, 500
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Unexpected error deleting category {category_id}: {str(e)}")
            return {"error": str(e)}, 400

    # Item Services
    @staticmethod
    def create_item(category_id, data, user_id):
        """Create a new item for a checklist category"""
        # user_id is passed from the route to allow for future ownership checks,
        # but is not strictly necessary for the current creation logic.
        category = ChecklistCategory.query.get(category_id)
        if not category:
            return {"error": "Không tìm thấy danh mục"}, 404

        item_schema = ChecklistItemSchema()
        try:
            # Add category_id to data before loading
            data_with_category_id = {**data, "category_id": category_id}
            validated_data = item_schema.load(data_with_category_id)
        except ValidationError as err:
            return {"error": err.messages}, 400

        item = ChecklistItem(
            category_id=category_id, # or validated_data['category_id']
            task_title=validated_data['task_title'],
            is_completed=validated_data.get('is_completed', False),
            due_date=validated_data.get('due_date'),
            description=validated_data.get('description', ""),
            order=validated_data.get('order', 0)
        )
        try:
            db.session.add(item)
            db.session.commit()
            return item_schema.dump(item), 201
        except SQLAlchemyError as e:
            db.session.rollback()
            current_app.logger.error(f"Database error creating item for category {category_id}: {str(e)}")
            return {"error": "Lỗi tạo mục checklist"}, 500
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Unexpected error creating item for category {category_id}: {str(e)}")
            return {"error": str(e)}, 400

    @staticmethod
    def get_item(item_id):
        """Get a specific item"""
        item = ChecklistItem.query.get(item_id)
        if not item:
            return {"error": "Không tìm thấy mục checklist"}, 404
        item_schema = ChecklistItemSchema()
        return item_schema.dump(item), 200
        
    @staticmethod
    def update_item(item_id, data, user_id):
        """Update an item"""
        item = ChecklistItem.query.get(item_id)
        if not item:
            return {"error": "Không tìm thấy mục checklist"}, 404
        if item.category.profile.user_id != user_id:
            return {"error": "Unauthorized"}, 403

        schema = ChecklistItemUpdateSchema(partial=True)
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return {"error": err.messages}, 400

        # Filter out keys with None values to prevent overwriting existing data with nulls
        for key, value in validated_data.items():
            if value is not None:
                setattr(item, key, value)
            
        try:
            db.session.commit()
            item_schema = ChecklistItemSchema()
            return item_schema.dump(item), 200
        except SQLAlchemyError as e:
            db.session.rollback()
            current_app.logger.error(f"Database error updating item {item_id}: {str(e)}")
            return {"error": "Lỗi cập nhật mục checklist"}, 500
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Unexpected error updating item {item_id}: {str(e)}")
            return {"error": str(e)}, 400

    @staticmethod
    def delete_item(item_id, user_id):
        """Delete an item"""
        item = ChecklistItem.query.get(item_id)
        if not item:
            return {"error": "Không tìm thấy mục checklist"}, 404
        if item.category.profile.user_id != user_id:
            return {"error": "Unauthorized"}, 403
        try:
            db.session.delete(item)
            db.session.commit()
            return {}, 204
        except SQLAlchemyError as e:
            db.session.rollback()
            current_app.logger.error(f"Database error deleting item {item_id}: {str(e)}")
            return {"error": "Lỗi xóa mục checklist"}, 500
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Unexpected error deleting item {item_id}: {str(e)}")
            return {"error": str(e)}, 400

    # Document Services (Basic structure, can be expanded)
    @staticmethod
    def add_document_to_item(item_id, data, user_id):
        """Add a document to a checklist item"""
        item = ChecklistItem.query.get(item_id)
        if not item:
            return {"error": "Không tìm thấy mục checklist"}, 404
        if item.category.profile.user_id != user_id:
            return {"error": "Unauthorized"}, 403

        doc_schema = DocumentSchema()
        try:
            # Add item_id to data before loading
            data_with_item_id = {**data, "item_id": item_id}
            validated_data = doc_schema.load(data_with_item_id)
        except ValidationError as err:
            return {"error": err.messages}, 400
        
        # Assuming file_path is handled by some upload mechanism and passed in data
        document = Document(
            item_id=item_id, # or validated_data['item_id']
            file_name=validated_data['file_name'],
            file_path=validated_data['file_path']
        )
        try:
            db.session.add(document)
            db.session.commit()
            return doc_schema.dump(document), 201
        except SQLAlchemyError as e:
            db.session.rollback()
            current_app.logger.error(f"Database error adding document to item {item_id}: {str(e)}")
            return {"error": "Lỗi thêm tài liệu"}, 500
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Unexpected error adding document to item {item_id}: {str(e)}")
            return {"error": str(e)}, 400

    @staticmethod
    def remove_document_from_item(item_id, document_id, user_id):
        """Remove a document from an item"""
        document = Document.query.get(document_id)
        if not document:
            return {"error": "Không tìm thấy tài liệu"}, 404
        
        # Verify ownership
        item = ChecklistItem.query.get(item_id)
        if not item or item.category.profile.user_id != user_id:
            return {"error": "Unauthorized"}, 403
        
        # Also check if the document actually belongs to the item
        if document.item_id != item_id:
            return {"error": "Tài liệu không thuộc về mục này"}, 400

        try:
            db.session.delete(document)
            db.session.commit()
            return {}, 204
        except SQLAlchemyError as e:
            db.session.rollback()
            current_app.logger.error(f"Database error removing document {document_id}: {str(e)}")
            return {"error": "Lỗi xóa tài liệu"}, 500
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Unexpected error removing document {document_id}: {str(e)}")
            return {"error": str(e)}, 400
