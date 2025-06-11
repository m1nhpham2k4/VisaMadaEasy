import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import './Notification.css';

const icons = {
    success: <CheckCircle size={24} />,
    error: <XCircle size={24} />,
    warning: <AlertTriangle size={24} />,
};

const Notification = ({ message, type = 'success', onClose }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Trigger fade in animation
        setVisible(true);

        // The fade out is handled by the ToastProvider's timer,
        // but we can add a direct close handler for the 'x' button.
    }, []);

    const handleClose = () => {
        setVisible(false);
        // Allow time for fade-out animation before calling onClose
        setTimeout(onClose, 300); // Should match animation duration
    };
    
    const icon = icons[type];
    const notificationClass = `notification ${type} ${visible ? 'visible' : ''}`;

    return (
        <div className={notificationClass}>
            <div className="notification-icon">{icon}</div>
            <p className="notification-message">{message}</p>
            <button onClick={handleClose} className="notification-close-btn">
                <XCircle size={20} />
            </button>
        </div>
    );
};

export default Notification; 