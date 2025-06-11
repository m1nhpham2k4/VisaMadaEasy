import pytest
from app import create_app
from app.users.models import User
from flask_jwt_extended import create_access_token
import os
from dotenv import load_dotenv
from unittest.mock import patch, MagicMock

# Load environment variables from .env file
load_dotenv()

@pytest.fixture(scope='session')
def app():
    """
    Create and configure a new app instance for each test session.
    """
    # Set SQLite in-memory database for testing
    os.environ['TEST_DATABASE_URI'] = 'sqlite:///:memory:'
    
    # Create the app with testing config
    app_instance = create_app('testing')
    
    # Create a test context
    with app_instance.app_context():
        # Yield the app for tests
        yield app_instance

@pytest.fixture(scope='function')
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture(scope='function')
def test_user():
    """Create a mock test user."""
    mock_user = MagicMock(spec=User)
    mock_user.id = 1
    mock_user.username = 'testuser'
    mock_user.email = 'test@example.com'
    return mock_user

@pytest.fixture(scope='function')
def auth_headers(app, test_user):
    """Create and return authentication headers for a test user."""
    with app.app_context():
        # Create a real JWT token but mock the identity lookup
        access_token = create_access_token(identity=test_user.username)
        headers = {
            'Authorization': f'Bearer {access_token}'
        }
        return headers

@pytest.fixture(autouse=True)
def patch_db_and_jwt():
    """Automatically patch database and JWT operations for all tests."""
    # Patch the token blocklist check
    with patch('app.check_if_token_in_blocklist', return_value=False):
        
        # Mock database session
        with patch('app.extensions.db.session') as mock_session:
            mock_session.commit = MagicMock()
            mock_session.add = MagicMock()
            mock_session.delete = MagicMock()
            mock_session.rollback = MagicMock()
            
            # Mock User.get_user_by_username
            with patch('app.users.models.User.get_user_by_username') as mock_get_user:
                test_user = MagicMock(spec=User)
                test_user.id = 1
                test_user.username = 'testuser'
                test_user.email = 'test@example.com'
                mock_get_user.return_value = test_user
                
                # Mock JWT identity
                with patch('flask_jwt_extended.utils.get_jwt_identity', return_value='testuser'):
                    # Mock User.query for JWT user_lookup_loader
                    with patch('app.users.models.User.query') as mock_user_query:
                        mock_filter = MagicMock()
                        mock_user_query.filter_by.return_value = mock_filter
                        mock_filter.one_or_none.return_value = test_user
                        
                        # Mock TokenBlocklist.query
                        with patch('app.auth.models.TokenBlocklist.query') as mock_blocklist_query:
                            mock_filter_by = MagicMock()
                            mock_blocklist_query.filter_by.return_value = mock_filter_by
                            mock_filter_by.scalar.return_value = None
                            
                            yield 