import React from 'react';
import ChecklistItem from './ChecklistItem'; // We will create this component next
import './ChecklistCategory.css'; // We will create this CSS file next

const ChecklistCategory = ({ category, onTaskToggle, onDateChange }) => {
    if (!category || !category.items) {
        return null; // Or some fallback UI if the category or items are not defined
    }

    return (
        <div className="checklist-category">
            <h2 className="category-title">{category.name}</h2>
            <div className="category-items-list">
                {category.items.map(item => (
                    <ChecklistItem
                        key={item.id}
                        item={item}
                        onToggle={(itemId, isCompleted) => onTaskToggle(itemId, isCompleted)}
                        onDateChange={onDateChange}
                        categoryName={category.name}
                    />
                ))}
            </div>
        </div>
    );
};

export default ChecklistCategory; 