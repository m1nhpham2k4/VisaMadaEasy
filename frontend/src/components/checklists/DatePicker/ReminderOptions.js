import React from 'react';
import './ReminderOptions.css';
import { Check } from 'lucide-react';

const ReminderOptions = ({ onSelect, selectedOption }) => {
    const options = [
        'Không',
        'Vào ngày đến hạn (09:00 AM)',
        'Trước hạn 1 ngày (09:00 AM)',
        'Trước hạn 2 ngày (09:00 AM)',
        'Trước hạn 1 tuần'
    ];

    return (
        <div className="reminder-options-container">
            {options.map((option, index) => (
                <div 
                    key={index} 
                    className={`reminder-option ${selectedOption === option ? 'selected' : ''}`}
                    onClick={() => onSelect(option)}
                >
                    <span className="reminder-option-text">{option}</span>
                    {selectedOption === option && (
                        <Check size={16} className="check-icon" />
                    )}
                </div>
            ))}
        </div>
    );
};

export default ReminderOptions; 