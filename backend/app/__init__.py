from flask import Flask, jsonify
from flask_cors import CORS
import os

# Import configurations from config.py (assuming config.py is in the backend directory, a level above app)
# from ..config import config as app_config # Relative import for config
from config import config as app_config # Direct import assuming backend/ is the execution root for run.py

# Import extensions from app.extensions
from .extensions import db, jwt, limiter, migrate

# Import User and TokenBlocklist for JWT handlers
# These will need to be adjusted if the models are moved/renamed
from .auth.models import User, TokenBlocklist 
from .auth.routes import GuestUser # Import GuestUser for user_lookup_loader

def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_CONFIG', 'default')

    current_dir = os.path.dirname(os.path.abspath(__file__))
    # instance_path should ideally be outside the app package, perhaps at the backend level or configurable
    # For now, placing it next to the app package inside backend for simplicity.
    instance_path = os.path.join(os.path.dirname(current_dir), 'instance') 
    
    if not os.path.exists(instance_path):
        try:
            os.makedirs(instance_path)
        except OSError as e:
            print(f"Error creating instance folder: {e}")
            # Potentially raise the error or handle it as critical

    app = Flask(__name__, instance_relative_config=True, instance_path=instance_path)
    
    # Load configuration
    app.config.from_object(app_config[config_name])
    # app.config.from_pyfile('application.cfg', silent=True) # Example if using instance folder config

    CORS(app) # Enable CORS globally for now, can be configured per blueprint/route

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    limiter.init_app(app)
    migrate.init_app(app, db)

    # Register Blueprints
    from .auth.routes import auth_bp
    from .chat.routes import chat_bp
    from .users.routes import user_bp
    # from .main_routes import main_bp # If you have general routes

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(chat_bp, url_prefix='/chat')
    app.register_blueprint(user_bp, url_prefix='/users')
    # app.register_blueprint(main_bp) # For general routes, prefix might be '/'

    # JWT Configuration and handlers
    # user_loader_callback is now in auth.routes.py and registered with jwt object there.
    # We need to ensure that auth.routes is imported so that the decorator runs.
    # The @jwt.user_lookup_loader in auth_bp should handle this.
    # Re-defining it here would be redundant if it's already set on the jwt object via the blueprint.

    # JWT error handlers (moved from original main.py)
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_data):
        return jsonify({"Message": "Token has expired!", "error": "token_expired"}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        # The 'error' argument here is the actual exception object, you might want to log it.
        return jsonify({"Message": "Token is invalid!", "error": "token_invalid"}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({"message": "Request does not contain an access token", "error": "authorization_required"}), 401
    
    @jwt.token_in_blocklist_loader
    def check_if_token_in_blocklist(jwt_header, jwt_data):
        jti = jwt_data['jti']
        token = TokenBlocklist.query.filter_by(jti=jti).scalar()
        return token is not None
    
    # A simple route to check if the app is up
    @app.route('/health')
    def health_check():
        return jsonify({"status": "healthy"}), 200

    return app 