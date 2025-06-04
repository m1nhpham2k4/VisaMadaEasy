import React, { useState } from 'react';
import './ChecklistProfileHeader.css'; // We will create this CSS file next
import DatePicker from './DatePicker/DatePicker'; // Import the DatePicker component

const ChecklistProfileHeader = ({ dueDate, completedTasks, totalTasks, onDateChange }) => {
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    
    const handleDateClick = () => {
        setIsDatePickerOpen(true);
    };

    const handleDatePickerClose = () => {
        setIsDatePickerOpen(false);
    };

    const handleDateSelected = (newDate) => {
        if (onDateChange) {
            onDateChange(newDate);
        }
        setIsDatePickerOpen(false);
    };

    return (
        <div className="checklist-profile-header">
            <div className="checklist-meta-section">
                <div className="meta-item">
                    <span className="meta-label">Hạn nộp:</span>
                    <span 
                        className="meta-value date-value clickable" 
                        onClick={handleDateClick}
                    >
                        {dueDate}
                    </span>
                    {isDatePickerOpen && (
                        <DatePicker 
                            onClose={handleDatePickerClose}
                            onDateSelected={handleDateSelected}
                            selectedDate={dueDate}
                        />
                    )}
                </div>
                <div className="meta-item progress-meta-item">
                    <span className="meta-label">Trạng thái hoàn thành:</span>
                    <div className="progress-bar-outer-container">
                        <div 
                            className="progress-bar-inner-track"
                            role="progressbar" 
                            aria-valuenow={progress}
                            aria-valuemin="0"
                            aria-valuemax="100"
                            aria-label={`Checklist progress: ${completedTasks} of ${totalTasks} tasks completed`}
                        >
                            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                    <span className="meta-value progress-value">{completedTasks}/{totalTasks}</span>
                </div>
            </div>
        </div>
    );
};

export default ChecklistProfileHeader; 