from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request, jwt_required, current_user
import os
import google.generativeai as genai
from dotenv import load_dotenv
from .models import ChatSession, ChatMessage
from ..auth.models import User 
from ..auth.routes import GuestUser # Assuming GuestUser is defined in auth.routes
from ..extensions import db
from datetime import datetime, timezone
from sqlalchemy import desc

# Load environment variables
load_dotenv()

chat_bp = Blueprint('chat', __name__) # This blueprint will serve for both chat and chat_history routes

# --- Helper functions from original chat.py --- 
def _get_user_and_identity():
    """
    Retrieves user identity from JWT token and fetches user details.
    Returns a tuple: (active_user, is_guest, identity_for_logging)
    """
    active_user = None
    is_guest = True
    identity_for_logging = 'guest_fallback'

    # current_user should be correctly populated by Flask-JWT-Extended user_lookup_loader
    if isinstance(current_user, GuestUser):
        is_guest = True
        identity_for_logging = current_user.guest_id
    elif isinstance(current_user, User):
        active_user = current_user
        is_guest = False
        identity_for_logging = active_user.username
    else:
        # This case implies no token or an unhandled token type by user_lookup_loader.
        # For optional JWT, get_jwt_identity() might return None.
        try:
            jwt_identity = get_jwt_identity()
            if jwt_identity:
                identity_for_logging = jwt_identity # Could be guest_id or username based on token content
                # Further logic could try to load User if it's a username and not already loaded
            else:
                identity_for_logging = 'guest_no_jwt' # No identity in token
        except Exception:
            identity_for_logging = 'guest_jwt_error' # Error processing JWT
            
    return active_user, is_guest, identity_for_logging

def _get_ai_response(user_message):
    """
    Generates a response from the AI model.
    Returns the bot's reply string or raises an exception.
    """
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key: 
        print("Error: Gemini API key missing from .env")
        raise ValueError("AI service configuration missing")

    genai.configure(api_key=api_key)
    model_name = os.getenv('GEMINI_MODEL_NAME', 'gemini-2.5-flash') 
    model = genai.GenerativeModel(model_name)
    response = model.generate_content(contents=[user_message])
    return response.text

def _save_chat_interaction(active_user, user_message, bot_reply, current_session_id_int):
    """
    Saves the user and bot messages to the database for a registered user.
    Creates a new session if one doesn't exist or isn't provided.
    Returns the session ID for the response.
    """
    current_chat_session = None
    if current_session_id_int and active_user:
        current_chat_session = ChatSession.query.filter_by(id=current_session_id_int, user_id=active_user.id).first()

    if not current_chat_session and active_user:
        new_session_title = (user_message[:47] + "...") if len(user_message) > 50 else user_message
        if not new_session_title.strip(): 
            new_session_title = "New Chat"
        current_chat_session = ChatSession(user_id=active_user.id, title=new_session_title)
        db.session.add(current_chat_session)
        db.session.flush() 

    if not current_chat_session: # Should not happen if active_user is present
        print("Error: Could not find or create chat session for saving.")
        return None

    session_id_for_response = current_chat_session.id
    user_msg_db = ChatMessage(session_id=current_chat_session.id, sender='user', text=user_message)
    db.session.add(user_msg_db)
    bot_msg_db = ChatMessage(session_id=current_chat_session.id, sender='bot', text=bot_reply)
    db.session.add(bot_msg_db)
    db.session.commit()
    print(f"Saved conversation for user '{active_user.username}', session ID {current_chat_session.id}")
    return session_id_for_response

# --- Routes from original chat.py --- 
@chat_bp.post('/message')
def handle_message():
    verify_jwt_in_request(optional=True) 
    data = request.get_json()
    user_message = data.get('message')
    requested_session_id_str = data.get('session_id')
    
    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    current_session_id_int = None
    if requested_session_id_str:
        try:
            current_session_id_int = int(requested_session_id_str)
        except ValueError:
            pass 

    active_user = None
    is_guest = True
    identity_for_logging = 'guest_default' # Default logging identity

    if isinstance(current_user, GuestUser):
        is_guest = True
        identity_for_logging = current_user.guest_id
    elif isinstance(current_user, User):
        active_user = current_user
        is_guest = False
        identity_for_logging = active_user.username
    else: # No current_user or not User/GuestUser (e.g. no token, or unhandled token type)
        # Attempt to get identity if token was present but didn't load a user via user_lookup
        # This can happen if token is for a guest_id but GuestUser wasn't returned by user_lookup for some reason
        jwt_identity_val = get_jwt_identity() 
        if jwt_identity_val:
            identity_for_logging = jwt_identity_val
        else:
            identity_for_logging = 'guest_no_token_or_id'

    bot_reply = ""
    try:
        bot_reply = _get_ai_response(user_message)
    except ValueError as e: 
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"Error generating AI response: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to get AI response"}), 500

    session_id_for_response = None
    if not is_guest and active_user:
        try:
            session_id_for_response = _save_chat_interaction(active_user, user_message, bot_reply, current_session_id_int)
        except Exception as db_error:
            db.session.rollback()
            print(f"Database error for user '{identity_for_logging}': {str(db_error)}")
            import traceback
            traceback.print_exc()
            if current_session_id_int: 
                session_id_for_response = current_session_id_int
    elif is_guest and current_session_id_int is not None: # For guests, just pass through session_id if provided
        session_id_for_response = current_session_id_int
    elif is_guest and current_session_id_int is None:
        # For guests, if no session_id is provided, we don't create one on the backend.
        # The client can manage a temporary session ID if needed.
        pass 

    response_data = {"reply": bot_reply}
    if session_id_for_response is not None:
        response_data["session_id"] = session_id_for_response
        
    print(f"User ({identity_for_logging}): {user_message[:100]}...") 
    print(f"Bot: {bot_reply[:100]}...") 

    return jsonify(response_data), 200

# --- Routes from original chat_history.py --- 
@chat_bp.get('/sessions') # Changed from chat_history_bp to chat_bp
@jwt_required()
def get_sessions():
    if not isinstance(current_user, User):
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

@chat_bp.get('/sessions/<int:session_id>/messages') # Changed from chat_history_bp to chat_bp
@jwt_required()
def get_messages(session_id):
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

@chat_bp.post('/sessions/<int:session_id>/pin') # Changed from chat_history_bp to chat_bp
@jwt_required()
def toggle_pin_session(session_id):
    if not isinstance(current_user, User):
        return jsonify({"error": "Chat history features are only available for registered users"}), 403

    session = ChatSession.query.filter_by(id=session_id, user_id=current_user.id).first()
    if not session:
        return jsonify({"error": "Chat session not found or access denied"}), 404

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

@chat_bp.delete('/sessions/<int:session_id>') # New route for deleting a chat session
@jwt_required()
def delete_session(session_id):
    if not isinstance(current_user, User):
        return jsonify({"error": "Chat history features are only available for registered users"}), 403

    session = ChatSession.query.filter_by(id=session_id, user_id=current_user.id).first()
    if not session:
        return jsonify({"error": "Chat session not found or access denied"}), 404

    # Delete all messages associated with the session
    ChatMessage.query.filter_by(session_id=session_id).delete()
    # Delete the session itself
    db.session.delete(session)
    db.session.commit()
    
    return jsonify({
        "success": True,
        "message": "Chat session deleted successfully",
        "session_id": session_id
    })
