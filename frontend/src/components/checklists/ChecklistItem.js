import React, { useState, useRef } from 'react';
import './ChecklistItem.css'; // We will create this CSS file next
// import rightArrowIcon from '../../assets/icons/checkbox_vector.svg'; // Import checkbox SVG
import { useToast } from '../../context/ToastContext'; // Import useToast

// Helper function to format date as DD/MM (e.g., 14/4)
const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        // Adjust for timezone issues if dateString is Z-formatted (UTC)
        // by getting UTC parts directly
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Month is 0-indexed
        return `${day}/${month}`;
    } catch (error) {
        console.error("Error formatting date:", dateString, error);
        const parts = dateString.split('T')[0].split('-'); // Fallback for YYYY-MM-DD
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}`;
        }
        return dateString; // Fallback to original if parsing fails badly
    }
};

const ChecklistItem = ({ item, onToggle, onOpenModal, onTaskUpdate, onTaskDelete }) => {
    const [isHovered, setIsHovered] = useState(false);
    const fileInputRef = useRef(null);
    const { showToast } = useToast(); // Get the showToast function
    
    if (!item) {
        return null; // Or some fallback UI
    }

    const handleChange = (e) => {
        e.stopPropagation(); // Prevent triggering the item click
        onToggle(item.id, !item.is_completed);
    };

    // Handle file upload button click
    const handleUploadClick = (e) => {
        e.stopPropagation(); // Prevent modal from opening
        fileInputRef.current.click();
    };

    // Handle file selection
    const handleFileChange = (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            // For now, we are not implementing the upload from this button.
            // This can be a future enhancement.
            // The main upload functionality is within the TaskModal.
            showToast('File selection from here is not yet implemented.', 'info');
            
            // Clear the input to allow selecting the same file again
            e.target.value = '';
        }
    };

    const itemClassName = `checklist-item ${item.is_completed ? 'completed' : ''} ${isHovered ? 'hovered' : ''}`;
    const descriptionClassName = `item-description ${item.is_completed ? 'completed-text' : ''}`;

    // Using the imported SVG for the checkbox
    const checkboxIcon = item.is_completed ? (
        <div className="checkbox checked">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="10" fill="#CCDBFD"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M9.75459 0.343835C10.117 0.760591 10.0729 1.39222 9.65616 1.75462L3.90617 6.7546C3.50834 7.10055 2.91026 7.0782 2.53935 6.70354L0.289349 4.43082C-0.0992078 4.03834 -0.0960262 3.40518 0.296455 3.01663C0.688936 2.62807 1.32209 2.63125 1.71065 3.02374L3.30116 4.63031L8.34381 0.245409C8.76056 -0.116988 9.39219 -0.0729207 9.75459 0.343835Z" fill="#1E46A4" transform="translate(5, 6)"/>
            </svg>
        </div>
    ) : (
        <div className="checkbox">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18ZM10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20Z" fill="#0F172B"/>
            </svg>
        </div>
    );

    return (
        <div 
            className={itemClassName}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onOpenModal}
        >
            <div className="item-content">
                <label className="item-label" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={item.is_completed}
                        onChange={handleChange}
                        className="hidden-checkbox" // Hide the actual checkbox
                    />
                    <span className="custom-checkbox">{checkboxIcon}</span>
                    <span className={descriptionClassName}>{item.task_title}</span>
                </label>
                
                <div className="item-actions">
                    {item.due_date && (
                        <span className={`item-due-date ${item.is_completed ? 'completed-text' : ''}`}>
                            {formatDate(item.due_date)}
                        </span>
                    )}
                    
                    {isHovered && (
                        <div className="hover-actions">
                            <button 
                                className="upload-button-visible"
                                onClick={handleUploadClick}
                            >
                                Tải lên
                            </button>
                            {/* Hidden file input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                                multiple // Allow multiple file selection if needed
                            />
                            <span className="arrow-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10 17L15 12L10 7" stroke="#0F172B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChecklistItem; 