from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, current_user
from models import ChatSession, ChatMessage, User
from extensions import db
from sqlalchemy import desc

chat_history_bp = Blueprint('chat_history', __name__)

@chat_history_bp.get('/sessions')
@jwt_required()
def get_sessions():
    """Retrieves the list of chat sessions for the current user."""
    # Ensure it's not a guest user by checking if current_user is a User instance
    # The user_loader_callback in main.py should handle guest_user identity appropriately.
    # current_user here will be the User object if token is valid and user exists,
    # or the guest object if identity was 'guest_user'.
    if not isinstance(current_user, User):
        # This will catch guests or if JWT is for an entity not mapping to a User model instance
        return jsonify({"error": "Chat history is only available for registered users"}), 403

    sessions = ChatSession.query.filter_by(user_id=current_user.id).order_by(desc(ChatSession.updated_at)).all()
    
    session_list = [
        {
            "id": session.id, 
            "title": session.title, 
            "updated_at": session.updated_at.isoformat(),
            "is_pinned": session.is_pinned
        }
        for session in sessions
    ]
    return jsonify({"sessions": session_list})

@chat_history_bp.get('/sessions/<int:session_id>/messages')
@jwt_required()
def get_messages(session_id):
    """Retrieves messages for a specific chat session belonging to the current user."""
    if not isinstance(current_user, User):
        return jsonify({"error": "Chat history is only available for registered users"}), 403

    session = ChatSession.query.filter_by(id=session_id, user_id=current_user.id).first()
    if not session:
        return jsonify({"error": "Chat session not found or access denied"}), 404

    messages = ChatMessage.query.filter_by(session_id=session.id).order_by(ChatMessage.timestamp).all()
    
    message_list = [
        {"sender": msg.sender, "text": msg.text, "timestamp": msg.timestamp.isoformat()}
        for msg in messages
    ]
    return jsonify({"messages": message_list})

# Note: The POST /chat/sessions endpoint is implicitly handled by the modified
# POST /chat/message endpoint when a new chat starts (no session_id provided).
# A dedicated endpoint could be added here if explicit session creation *before*
# the first message is desired.

# Add new endpoint for pinning/unpinning chat sessions
@chat_history_bp.post('/sessions/<int:session_id>/pin')
@jwt_required()
def toggle_pin_session(session_id):
    """Toggle the pinned status of a specific chat session."""
    if not isinstance(current_user, User):
        return jsonify({"error": "Chat history features are only available for registered users"}), 403

    session = ChatSession.query.filter_by(id=session_id, user_id=current_user.id).first()
    if not session:
        return jsonify({"error": "Chat session not found or access denied"}), 404

    # Get the requested pin status or toggle the current value if not specified
    data = request.get_json()
    if data and 'is_pinned' in data:
        session.is_pinned = bool(data['is_pinned'])
    else:
        session.is_pinned = not session.is_pinned

    db.session.commit()
    
    return jsonify({
        "success": True,
        "session_id": session.id,
        "is_pinned": session.is_pinned
    }) 