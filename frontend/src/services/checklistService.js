import apiClient from './apiClient';
import mockChecklistData from './mockChecklistData';

const USE_MOCK_DATA = true; // Toggle between mock data and real API

const checklistService = {
    getChecklistProfile: (profileId) => {
        if (!profileId) {
            return Promise.reject(new Error('Profile ID is required to fetch checklist profile.'));
        }
        
        // Use mock data if enabled
        if (USE_MOCK_DATA) {
            return Promise.resolve({ data: mockChecklistData });
        }
        
        return apiClient.get(`/api/checklists/profiles/${profileId}`);
    },

    updateChecklistItem: (itemId, data) => {
        if (!itemId) {
            return Promise.reject(new Error('Item ID is required to update checklist item.'));
        }
        
        // Validate data based on what's being updated
        if (data.hasOwnProperty('is_completed') && typeof data.is_completed !== 'boolean') {
            return Promise.reject(new Error('is_completed must be a boolean value.'));
        }
        
        // Mock update without API call
        if (USE_MOCK_DATA) {
            return Promise.resolve({ data: { success: true } });
        }
        
        return apiClient.put(`/api/checklists/items/${itemId}`, data);
    },
    
    updateChecklistProfile: (profileId, data) => {
        if (!profileId) {
            return Promise.reject(new Error('Profile ID is required to update checklist profile.'));
        }
        
        // Mock update without API call
        if (USE_MOCK_DATA) {
            return Promise.resolve({ data: { success: true } });
        }
        
        return apiClient.put(`/api/checklists/profiles/${profileId}`, data);
    },
    
    // Add new method to get all checklists (for sidebar)
    getAllChecklists: () => {
        if (USE_MOCK_DATA) {
            return Promise.resolve({ 
                data: [
                    {
                        id: mockChecklistData.id,
                        title: mockChecklistData.title,
                        status: mockChecklistData.status
                    }
                ] 
            });
        }
        
        return apiClient.get('/api/checklists/profiles');
    }
};

export default checklistService; 