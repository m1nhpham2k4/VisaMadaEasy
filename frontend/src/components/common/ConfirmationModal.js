import React from 'react';
import './ConfirmationModal.css';
import { X, AlertTriangle } from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <div className="modal-title-container">
                        <AlertTriangle size={24} className="modal-icon" />
                        <h2 className="modal-title">{title}</h2>
                    </div>
                    <button onClick={onClose} className="modal-close-button">
                        <X size={24} />
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
                <div className="modal-footer">
                    <button onClick={onClose} className="modal-button cancel">
                        Hủy
                    </button>
                    <button onClick={onConfirm} className="modal-button confirm">
                        Xác nhận
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal; 