import apiClient from './apiClient';
import mockChecklistData from './mockChecklistData';

const USE_MOCK_DATA = false; // Toggle between mock data and real API

const checklistService = {
    getChecklistProfile: (profileId) => {
        if (!profileId) {
            return Promise.reject(new Error('Profile ID is required to fetch checklist profile.'));
        }
        
        // Use mock data if enabled
        if (USE_MOCK_DATA) {
            return Promise.resolve({ data: mockChecklistData });
        }
        
        return apiClient.get(`/checklists/checklist/profile/${profileId}`);
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
        
        return apiClient.patch(`/checklists/checklist/item/${itemId}`, data);
    },
    
    updateChecklistProfile: (profileId, data) => {
        if (!profileId) {
            return Promise.reject(new Error('Profile ID is required to update checklist profile.'));
        }
        
        // Mock update without API call
        if (USE_MOCK_DATA) {
            return Promise.resolve({ data: { success: true } });
        }
        
        return apiClient.patch(`/checklists/checklist/profile/${profileId}`, data);
    },
    
    // Add new method to create a checklist profile
    createChecklistProfile: (profileData) => {
        if (!profileData || !profileData.title) {
            return Promise.reject(new Error('Profile title is required to create a new checklist profile.'));
        }
        return apiClient.post('/checklists/checklist/profile', profileData);
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
        
        return apiClient.get('/checklists/checklist/profile');
    },
    
    createCategory: (profileId, categoryData) => {
        if (!profileId || !categoryData || !categoryData.name) {
            return Promise.reject(new Error('Profile ID and category name are required.'));
        }
        return apiClient.post(`/checklists/checklist/profile/${profileId}/category`, categoryData);
    },

    updateCategory: (categoryId, categoryData) => {
        if (!categoryId) {
            return Promise.reject(new Error('Category ID is required.'));
        }
        return apiClient.patch(`/checklists/checklist/category/${categoryId}`, categoryData);
    },

    createItem: (categoryId, itemData) => {
        if (!categoryId || !itemData || !itemData.task_title) {
            return Promise.reject(new Error('Category ID and item task title are required.'));
        }
        return apiClient.post(`/checklists/checklist/category/${categoryId}/item`, itemData);
    },

    deleteChecklistItem: (itemId) => {
        if (!itemId) {
            return Promise.reject(new Error('Item ID is required to delete checklist item.'));
        }
        return apiClient.delete(`/checklists/checklist/item/${itemId}`);
    },

    deleteCategory: (categoryId) => {
        if (!categoryId) {
            return Promise.reject(new Error('Category ID is required to delete category.'));
        }
        return apiClient.delete(`/checklists/checklist/category/${categoryId}`);
    }
};

export default checklistService; 