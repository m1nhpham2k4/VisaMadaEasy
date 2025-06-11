import React, { createContext, useContext, useState, useCallback } from 'react';
import Notification from '../components/common/Notification';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(null);
    let toastTimer = null;

    const showToast = useCallback((message, type = 'success', duration = 3000) => {
        // Clear any existing timer
        if (toastTimer) {
            clearTimeout(toastTimer);
        }

        setToast({ message, type });

        // Set a timer to hide the toast
        toastTimer = setTimeout(() => {
            setToast(null);
        }, duration);
    }, []); // Removed toastTimer from dependencies as it's managed internally

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <Notification
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </ToastContext.Provider>
    );
}; 