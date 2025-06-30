import React, { useState } from 'react';
import ChecklistItem from './ChecklistItem'; // We will create this component next
import { PlusCircle, Save, X } from 'lucide-react';
import './ChecklistCategory.css'; // We will create this CSS file next
import checklistService from '../../services/checklistService';
import { useToast } from '../../context/ToastContext';

const ChecklistCategory = ({ category, onTaskToggle, onDateChange, onAddItem, onCategoryUpdate, onTaskUpdate, onTaskDelete, onOpenTaskModal }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [draftName, setDraftName] = useState(category ? category.name : '');
    const { showToast } = useToast();

    if (!category || !category.items) {
        return null; // Or some fallback UI if the category or items are not defined
    }

    const handleTitleClick = () => {
        setDraftName(category.name);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const handleSave = async () => {
        if (draftName === category.name) {
            setIsEditing(false);
            return;
        }

        try {
            const updatedCategory = await checklistService.updateCategory(category.id, { name: draftName });
            if (onCategoryUpdate) {
                onCategoryUpdate(updatedCategory.data);
            }
            setIsEditing(false);
            showToast('Category updated successfully!', 'success');
        } catch (error) {
            console.error('Failed to update category name:', error);
            showToast('Failed to update category name.', 'error');
        }
    };

    return (
        <div className="checklist-category">
            <div className="category-header">
                {isEditing ? (
                    <div className="category-title-edit-container">
                        <input
                            type="text"
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            className="category-title-input"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        />
                        <button onClick={handleSave} className="save-title-button"><Save size={18} /></button>
                        <button onClick={handleCancel} className="cancel-title-button"><X size={18} /></button>
                    </div>
                ) : (
                    <h2 className="category-title" onClick={handleTitleClick}>{category.name}</h2>
                )}
                <button onClick={() => onAddItem(category.id)} className="add-item-button">
                    <PlusCircle size={20} />
                    <span>Thêm công việc</span>
                </button>
            </div>
            <div className="category-items-list">
                {category.items.map(item => (
                    <ChecklistItem
                        key={item.id}
                        item={item}
                        onToggle={(itemId, isCompleted) => onTaskToggle(itemId, isCompleted)}
                        onDateChange={onDateChange}
                        categoryName={category.name}
                        onTaskUpdate={onTaskUpdate}
                        onTaskDelete={onTaskDelete}
                        onOpenModal={() => onOpenTaskModal(item)}
                    />
                ))}
            </div>
        </div>
    );
};

export default ChecklistCategory; 