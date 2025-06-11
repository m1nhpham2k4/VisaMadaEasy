import React, { useState, useEffect, useRef } from 'react';
import './DatePicker.css';
import ReminderOptions from './ReminderOptions';
import MethodOptions from './MethodOptions';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DatePicker = ({ onClose, onDateSelected, selectedDate }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(null);
    const [showReminderOptions, setShowReminderOptions] = useState(false);
    const [showMethodOptions, setShowMethodOptions] = useState(false);
    const [reminder1, setReminder1] = useState('Vào ngày đến hạn');
    const [reminder2, setReminder2] = useState('Không');
    const [method, setMethod] = useState('Email');
    
    const datePickerRef = useRef(null);

    useEffect(() => {
        // If selectedDate is a valid Date object, use it.
        if (selectedDate && selectedDate instanceof Date && !isNaN(selectedDate)) {
            setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
            setSelectedDay(selectedDate.getDate());
        } else if (typeof selectedDate === 'string') {
            // Also handle ISO strings or other parsable date strings
            const date = new Date(selectedDate);
            if (!isNaN(date)) {
                setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
                setSelectedDay(date.getDate());
            }
        }

        // Handle click outside to close the date picker
        const handleClickOutside = (event) => {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [selectedDate, onClose]);

    // Get days in the current month
    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    // Get the first day of the month (0 = Sunday, 1 = Monday, etc.)
    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    // Previous and next month handlers
    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    // Handle day selection
    const handleDayClick = (day) => {
        setSelectedDay(day);
    };

    // Handle applying the selected date
    const handleApplyDate = () => {
        if (selectedDay) {
            const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDay);
            onDateSelected(newDate);
        }
    };

    // Toggle reminder options
    const handleToggleReminder1Options = () => {
        setShowReminderOptions(!showReminderOptions);
        setShowMethodOptions(false);
    };

    // Toggle method options
    const handleToggleMethodOptions = () => {
        setShowMethodOptions(!showMethodOptions);
        setShowReminderOptions(false);
    };

    // Handle reminder selection
    const handleReminderSelect = (option) => {
        setReminder1(option);
        setShowReminderOptions(false);
    };

    // Handle method selection
    const handleMethodSelect = (option) => {
        setMethod(option);
        setShowMethodOptions(false);
    };

    // Handle reminder2 selection
    const handleReminder2Select = (option) => {
        setReminder2(option);
    };

    // Format month name in Vietnamese
    const formatMonthName = (date) => {
        const months = [
            'Tháng Một', 'Tháng Hai', 'Tháng Ba', 'Tháng Tư', 
            'Tháng Năm', 'Tháng Sáu', 'Tháng Bảy', 'Tháng Tám', 
            'Tháng Chín', 'Tháng Mười', 'Tháng Mười Một', 'Tháng Mười Hai'
        ];
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    // Build calendar
    const buildCalendar = () => {
        const days = [];
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        
        // Adjust first day to make Monday the first day (0)
        const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
        
        // Weekday headers (Monday first)
        const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
        
        // Create weekday headers
        const weekdayHeaders = weekdays.map((day, index) => (
            <div key={`header-${index}`} className="calendar-day weekday">{day}</div>
        ));
        
        // Empty cells for days before the first day of the month
        for (let i = 0; i < adjustedFirstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }
        
        // Days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const isSelected = i === selectedDay;
            days.push(
                <div 
                    key={`day-${i}`} 
                    className={`calendar-day ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleDayClick(i)}
                >
                    {i.toString().padStart(2, '0')}
                </div>
            );
        }
        
        return { weekdayHeaders, days };
    };

    const { weekdayHeaders, days } = buildCalendar();

    return (
        <div className="date-picker-container" ref={datePickerRef}>
            <div className="calendar-container">
                <div className="calendar-header">
                    <span className="month-name">{formatMonthName(currentMonth)}</span>
                    <div className="month-navigation">
                        <button className="month-nav-btn" onClick={handlePrevMonth}>
                            <ChevronLeft size={20} />
                        </button>
                        <button className="month-nav-btn" onClick={handleNextMonth}>
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
                
                <div className="calendar-grid">
                    {weekdayHeaders}
                    {days}
                </div>
                
                <div className="calendar-separator"></div>
                
                <div className="date-options">
                    <div className="date-option">
                        <span className="option-label">Ngày đến hạn</span>
                        <div className="selected-date" onClick={handleApplyDate}>
                            {selectedDay ? `${selectedDay.toString().padStart(2, '0')}/${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}/${currentMonth.getFullYear()}` : ''}
                        </div>
                    </div>
                    
                    <div className="reminder-options">
                        <div className="date-option">
                            <span className="option-label">Nhắc việc 1</span>
                            <div className="dropdown-selector" onClick={handleToggleReminder1Options}>
                                <span>{reminder1}</span>
                                <ChevronRight size={16} />
                            </div>
                            {showReminderOptions && (
                                <ReminderOptions 
                                    onSelect={handleReminderSelect} 
                                    selectedOption={reminder1}
                                />
                            )}
                        </div>
                        
                        <div className="date-option">
                            <span className="option-label">Phương thức</span>
                            <div className="dropdown-selector" onClick={handleToggleMethodOptions}>
                                <span>{method}</span>
                                <ChevronRight size={16} />
                            </div>
                            {showMethodOptions && (
                                <MethodOptions 
                                    onSelect={handleMethodSelect} 
                                    selectedOption={method}
                                />
                            )}
                        </div>
                    </div>
                    
                    <div className="date-option">
                        <span className="option-label">Nhắc việc 2</span>
                        <div 
                            className="dropdown-selector" 
                            onClick={() => {
                                if (reminder2 === 'Không') {
                                    handleReminder2Select('Trước hạn 1 ngày');
                                } else {
                                    handleReminder2Select('Không');
                                }
                            }}
                        >
                            <span>{reminder2}</span>
                            <ChevronRight size={16} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatePicker; 