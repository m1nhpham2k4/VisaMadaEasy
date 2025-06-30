from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.checklist_service import ChecklistService
from app.checklists.schemas import (
    ChecklistProfileSchema,
    ChecklistProfileCreateSchema,
    ChecklistCategorySchema,
    ChecklistItemSchema,
    DocumentSchema,
    ChecklistProfileUpdateSchema,
    ChecklistCategoryUpdateSchema,
    ChecklistItemUpdateSchema
)
from marshmallow import ValidationError
from app.users.models import User
from flask import current_app

checklist_bp = Blueprint('checklist', __name__)

# Schema instances for request validation and response serialization
checklist_profile_schema = ChecklistProfileSchema()
checklist_profile_update_schema = ChecklistProfileUpdateSchema(partial=True)
checklist_category_schema = ChecklistCategorySchema()
checklist_category_update_schema = ChecklistCategoryUpdateSchema(partial=True)
checklist_item_schema = ChecklistItemSchema()
checklist_item_update_schema = ChecklistItemUpdateSchema(partial=True)
document_schema = DocumentSchema()

# --- Checklist Profile Routes ---
@checklist_bp.route('/checklist/profile/generate-from-llm', methods=['POST'])
@jwt_required()
def generate_checklist_from_llm_route():
    user_username = get_jwt_identity()
    user = User.query.filter_by(username=user_username).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    user_id = user.id

    json_data = request.get_json()
    if not json_data or 'prompt' not in json_data:
        return jsonify({"error": "No prompt provided"}), 400
    
    prompt = json_data['prompt']

    try:
        response, status_code = ChecklistService.create_checklist_profile_from_llm(user_id, prompt)
        return jsonify(response), status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@checklist_bp.route('/checklist/profile', methods=['GET', 'POST'])
@jwt_required()
def handle_checklist_profiles():
    user_username = get_jwt_identity()
    user = User.query.filter_by(username=user_username).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    user_id = user.id

    if request.method == 'GET':
        try:
            response, status_code = ChecklistService.get_all_checklist_profiles(user_id)
            return jsonify(response), status_code
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    if request.method == 'POST':
        try:
            json_data = request.get_json()
            if not json_data:
                return jsonify({"error": "No input data provided"}), 400
            
            response, status_code = ChecklistService.create_checklist_profile(user_id, json_data)
            return jsonify(response), status_code
        except ValidationError as err:
            return jsonify({"errors": err.messages}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500

@checklist_bp.get('/checklist/profile/<int:profile_id>')
@jwt_required()
def get_checklist_profile_route(profile_id): # Renamed function
    try:
        response, status_code = ChecklistService.get_checklist_profile(profile_id)
        return jsonify(response), status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@checklist_bp.patch('/checklist/profile/<int:profile_id>') # Corrected route, removed checklist_id
@jwt_required()
def update_checklist_profile_route(profile_id): # Renamed function, removed checklist_id
    try:
        json_data = request.get_json()
        if not json_data:
            return jsonify({"error": "No input data provided"}), 400
        
        # Validate and deserialize input for partial update
        # update_data = checklist_profile_update_schema.load(json_data) # Service will handle validation
        
        response, status_code = ChecklistService.update_checklist_profile(profile_id, json_data)
        return jsonify(response), status_code
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@checklist_bp.delete('/checklist/profile/<int:profile_id>')
@jwt_required()
def delete_checklist_profile_route(profile_id):
    try:
        user_username = get_jwt_identity()
        user = User.query.filter_by(username=user_username).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        user_id = user.id

        response, status_code = ChecklistService.delete_checklist_profile(profile_id, user_id)
        return jsonify(response), status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Checklist Category Routes ---
@checklist_bp.post('/checklist/profile/<int:profile_id>/category')
@jwt_required()
def create_category_route(profile_id):
    try:
        user_username = get_jwt_identity()
        user = User.query.filter_by(username=user_username).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        # user_id is not strictly needed here if service derives it from profile_id's owner, but good practice to have.

        json_data = request.get_json()
        if not json_data:
            return jsonify({"error": "No input data provided"}), 400
        
        # The service method expects profile_id and the raw json_data
        response, status_code = ChecklistService.create_category(profile_id, json_data)
        return jsonify(response), status_code
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@checklist_bp.get('/checklist/category/<int:category_id>')
@jwt_required()
def get_category_route(category_id):
    try:
        response, status_code = ChecklistService.get_category(category_id)
        return jsonify(response), status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@checklist_bp.patch('/checklist/category/<int:category_id>')
@jwt_required()
def update_category_route(category_id):
    try:
        user_username = get_jwt_identity()
        user = User.query.filter_by(username=user_username).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        user_id = user.id

        json_data = request.get_json()
        if not json_data:
            return jsonify({"error": "No input data provided"}), 400
        
        response, status_code = ChecklistService.update_category(category_id, json_data, user_id)
        return jsonify(response), status_code
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@checklist_bp.delete('/checklist/category/<int:category_id>')
@jwt_required()
def delete_category_route(category_id):
    try:
        user_username = get_jwt_identity()
        user = User.query.filter_by(username=user_username).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        user_id = user.id
        response, status_code = ChecklistService.delete_category(category_id, user_id)
        return jsonify(response), status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Checklist Item Routes ---
@checklist_bp.post('/checklist/category/<int:category_id>/item')
@jwt_required()
def create_item_route(category_id):
    try:
        user_username = get_jwt_identity()
        user = User.query.filter_by(username=user_username).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        user_id = user.id
        json_data = request.get_json()
        if not json_data:
            return jsonify({"error": "No input data provided"}), 400
            
        response, status_code = ChecklistService.create_item(category_id, json_data, user_id)
        return jsonify(response), status_code
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@checklist_bp.get('/checklist/item/<int:item_id>')
@jwt_required()
def get_item_route(item_id):
    try:
        response, status_code = ChecklistService.get_item(item_id)
        return jsonify(response), status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@checklist_bp.patch('/checklist/item/<int:item_id>')
@jwt_required()
def update_item_route(item_id):
    try:
        user_username = get_jwt_identity()
        user = User.query.filter_by(username=user_username).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        user_id = user.id
        json_data = request.get_json()
        if not json_data:
            return jsonify({"error": "No input data provided"}), 400
            
        response, status_code = ChecklistService.update_item(item_id, json_data, user_id)
        return jsonify(response), status_code
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@checklist_bp.delete('/checklist/item/<int:item_id>')
@jwt_required()
def delete_item_route(item_id):
    try:
        user_username = get_jwt_identity()
        user = User.query.filter_by(username=user_username).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        user_id = user.id
        response, status_code = ChecklistService.delete_item(item_id, user_id)
        return jsonify(response), status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Document Routes (Placeholder - assuming service methods are simple for now) ---
@checklist_bp.post('/checklist/item/<int:item_id>/document')
@jwt_required()
def add_document_to_item_route(item_id):
    try:
        user_username = get_jwt_identity()
        user = User.query.filter_by(username=user_username).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        user_id = user.id
        json_data = request.get_json()
        if not json_data:
            return jsonify({"error": "No input data provided"}), 400
        
        # Assuming service method handles validation and creation
        response, status_code = ChecklistService.add_document_to_item(item_id, json_data, user_id)
        return jsonify(response), status_code
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@checklist_bp.delete('/checklist/item/<int:item_id>/document/<int:document_id>')
@jwt_required()
def remove_document_from_item_route(item_id, document_id):
    try:
        user_username = get_jwt_identity()
        user = User.query.filter_by(username=user_username).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        user_id = user.id
        
        response, status_code = ChecklistService.remove_document_from_item(item_id, document_id, user_id)
        return jsonify(response), status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- User's Aggregated Tasks Route ---
@checklist_bp.route('/my-tasks', methods=['GET'])
@jwt_required()
def get_my_tasks():
    """
    Fetches all checklist items for the authenticated user,
    categorized into pending, overdue, and done.
    """
    user_username = get_jwt_identity()
    user = User.query.filter_by(username=user_username).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    try:
        response_data, status_code = ChecklistService.get_categorized_tasks_for_user(user.id)
        return jsonify(response_data), status_code
    except Exception as e:
        current_app.logger.error(f"Error in get_my_tasks route for user {user.id}: {str(e)}")
        return jsonify({"error": "An error occurred while fetching your tasks."}), 500
