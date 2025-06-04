import React from 'react';
import './MethodOptions.css';
import { Check } from 'lucide-react';

const MethodOptions = ({ onSelect, selectedOption }) => {
    const options = [
        'Email',
        'Tin nhắn',
        'Email và Tin nhắn'
    ];

    return (
        <div className="method-options-container">
            {options.map((option, index) => (
                <div 
                    key={index} 
                    className={`method-option ${selectedOption === option ? 'selected' : ''}`}
                    onClick={() => onSelect(option)}
                >
                    <span className="method-option-text">{option}</span>
                    {selectedOption === option && (
                        <Check size={16} className="check-icon" />
                    )}
                </div>
            ))}
        </div>
    );
};

export default MethodOptions; 