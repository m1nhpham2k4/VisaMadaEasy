import json
import pytest
from unittest.mock import patch, MagicMock
from app.checklists.models import ChecklistProfile
from app.users.models import User

@pytest.fixture
def mock_checklist_service():
    """Mock for the ChecklistService class"""
    with patch('app.checklists.routes.ChecklistService') as mock_service:
        # Mock the create_checklist_profile method to accept user_id and data parameters
        mock_service.create_checklist_profile.side_effect = lambda user_id, data: (
            {"id": 1, "title": data.get("title", "My Visa Application"), "user_id": user_id, "due_date": data.get("due_date", "2025-01-15T10:00:00")},
            201
        )
        
        # Mock the get_checklist_profile method
        mock_service.get_checklist_profile.side_effect = lambda profile_id: (
            {"error": "Không tìm thấy hồ sơ checklist"}, 404
        ) if profile_id == 9999 else (
            {"id": profile_id, "title": "Fetch Me", "user_id": 1}, 200
        )
        
        # Additional mocks for methods that might be called
        mock_service.update_checklist_profile.return_value = ({"id": 1, "title": "Updated Profile"}, 200)
        mock_service.delete_checklist_profile.return_value = ({}, 204)
        mock_service.create_category.return_value = ({"id": 1, "name": "Documents", "profile_id": 1}, 201)
        mock_service.get_category.return_value = ({"id": 1, "name": "Documents", "profile_id": 1}, 200)
        mock_service.update_category.return_value = ({"id": 1, "name": "Updated Category"}, 200)
        mock_service.delete_category.return_value = ({}, 204)
        mock_service.create_item.return_value = ({"id": 1, "description": "Get passport", "category_id": 1}, 201)
        mock_service.get_item.return_value = ({"id": 1, "description": "Get passport", "category_id": 1}, 200)
        mock_service.update_item.return_value = ({"id": 1, "description": "Updated Item"}, 200)
        mock_service.delete_item.return_value = ({}, 204)
        
        yield mock_service

def test_create_checklist_profile_unauthorized(client):
    """
    GIVEN a Flask application configured for testing
    WHEN the '/checklists/checklist/profile' endpoint is posted to without a token
    THEN check that a 401 Unauthorized response is returned
    """
    response = client.post('/checklists/checklist/profile',
                          data=json.dumps({
                              "title": "My Test Profile",
                              "due_date": "2024-12-01T00:00:00"
                          }),
                          content_type='application/json')
    assert response.status_code == 401

def test_create_checklist_profile_success(client, auth_headers, mock_checklist_service):
    """
    GIVEN a Flask application and authentication headers
    WHEN the '/checklists/checklist/profile' endpoint is posted to with valid data
    THEN check that a 201 Created response is returned with the expected data
    """
    response = client.post('/checklists/checklist/profile',
                        headers=auth_headers,
                        data=json.dumps({
                            "title": "My Visa Application",
                            "due_date": "2025-01-15T10:00:00"
                        }),
                        content_type='application/json')
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['title'] == "My Visa Application"
    assert 'id' in data

def test_get_checklist_profile_not_found(client, auth_headers, mock_checklist_service):
    """
    GIVEN a Flask application and authentication headers
    WHEN the '/checklists/checklist/profile/<id>' endpoint is requested with a non-existent ID
    THEN check that a 404 Not Found response is returned
    """
    response = client.get('/checklists/checklist/profile/9999', headers=auth_headers)
    assert response.status_code == 404
    data = json.loads(response.data)
    assert "Không tìm thấy hồ sơ checklist" in data['error']

def test_get_checklist_profile_success(client, auth_headers, mock_checklist_service):
    """
    GIVEN a Flask application and an existing checklist profile
    WHEN the '/checklists/checklist/profile/<id>' endpoint is requested with an existing ID
    THEN check that a 200 OK response is returned with the correct profile data
    """
    # Use a profile ID that the mock will return data for
    profile_id = 1
    
    response = client.get(f'/checklists/checklist/profile/{profile_id}', headers=auth_headers)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['id'] == profile_id
    assert data['title'] == "Fetch Me"
    assert data['user_id'] == 1 