import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import checklistService from '../services/checklistService';
import { useAuth } from '../services/authService';

const ChecklistContext = createContext();

export const ChecklistProvider = ({ children }) => {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);

  const { isAuthenticated } = useAuth();

  const refreshChecklists = useCallback(async () => {
    if (!isAuthenticated) {
      setChecklists([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await checklistService.getAllChecklists();
      setChecklists(response.data);
    } catch (error) {
      console.error("Failed to fetch checklists", error);
      // Handle error appropriately
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshChecklists();
  }, [refreshChecklists]);

  const value = { checklists, refreshChecklists, loading };

  return (
    <ChecklistContext.Provider value={value}>
      {children}
    </ChecklistContext.Provider>
  );
};

export const useChecklist = () => {
  const context = useContext(ChecklistContext);
  if (context === undefined) {
    throw new Error('useChecklist must be used within a ChecklistProvider');
  }
  return context;
};
