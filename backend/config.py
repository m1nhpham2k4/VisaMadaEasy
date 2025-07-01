import os
from datetime import timedelta

def get_database_uri():
    db_user = os.environ.get("POSTGRES_USER", "postgres")
    db_password = os.environ.get("POSTGRES_PASSWORD")
    print
    db_host = os.environ.get("POSTGRES_HOST", "db" if os.environ.get("RUNNING_IN_DOCKER") else "localhost")
    db_port = os.environ.get("POSTGRES_PORT", "5432")
    db_name = os.environ.get("POSTGRES_DB", "Immigration_chatbot_db")
    
    if not db_password:
        # In a real app, you might raise an error or log a warning.
        # For now, let's make it clear it's missing if it is.
        print("WARNING: POSTGRES_PASSWORD environment variable is not set.")
        # Depending on policy, you could fall back to a default (unsafe) or fail loudly.
        # For this example, we'll proceed, but a real app should handle this robustly.
    
    return f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', os.urandom(24)) # More secure default secret key
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = get_database_uri()

    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'a-fallback-super-secret-key-for-jwt') 
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES_MINUTES', 15)))
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=int(os.environ.get('JWT_REFRESH_TOKEN_EXPIRES_DAYS', 7)))
    
    # Add other configurations here, e.g., for mail, caching, etc.

class DevelopmentConfig(Config):
    DEBUG = True
    # SQLALCHEMY_ECHO = True # Useful for debugging SQL queries

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('TEST_DATABASE_URI', get_database_uri().replace("_db", "_test_db")) # Use a separate test DB
    JWT_SECRET_KEY = 'test-jwt-secret-key' # Consistent key for tests

class ProductionConfig(Config):
    DEBUG = False
    # Add any production-specific settings, e.g., logging configuration

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
} 
