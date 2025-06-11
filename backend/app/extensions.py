from flask_sqlalchemy import SQLAlchemy
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate

# Initialize SQLAlchemy object
db = SQLAlchemy()

# Initialize Limiter object
# Use get_remote_address to determine key for rate limit (usually IP)
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"] # Default limits, can be customized
)

# Initialize JWTManager object
jwt = JWTManager()

# Initialize Migrate object
migrate = Migrate() 
