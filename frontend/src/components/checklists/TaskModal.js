import React, { useEffect, useRef, useState } from 'react';
import {RightArrow, Upload, MoreVertical, Check, X, Save, Edit, CheckSquare, Square } from 'lucide-react';
import './TaskModal.css';
import CloseSideBar from '../../assets/icons/close_sidebar.svg';
import DatePicker from './DatePicker/DatePicker';
import checklistService from '../../services/checklistService';
import { useToast } from '../../context/ToastContext';
import TaskOptions from './TaskOptions';
import ConfirmationModal from '../common/ConfirmationModal';

const TaskModal = ({ isOpen, onClose, task, onSaveChanges, onTaskUpdate, onTaskDelete }) => {
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);
  const [editedTask, setEditedTask] = useState(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [showTaskOptions, setShowTaskOptions] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const { showToast } = useToast();

  const isEqual = (objA, objB) => {
    if (objA === objB) return true;
    if (!objA || !objB || typeof objA !== 'object' || typeof objB !== 'object') {
      return objA === objB;
    }

    const dateA = objA.due_date ? new Date(objA.due_date).getTime() : null;
    const dateB = objB.due_date ? new Date(objB.due_date).getTime() : null;
    if (dateA !== dateB) return false;

    if (objA.description !== objB.description) return false;
    if (objA.is_completed !== objB.is_completed) return false;
    
    if (objA.documents.length !== objB.documents.length) return false;
    const docNamesA = objA.documents.map(d => d.file_name || d.name).sort();
    const docNamesB = objB.documents.map(d => d.file_name || d.name).sort();
    for (let i = 0; i < docNamesA.length; i++) {
        if (docNamesA[i] !== docNamesB[i]) return false;
    }

    return true;
  };

  useEffect(() => {
    if (task) {
      const initialTaskState = {
        ...task,
        description: task.description || '',
        due_date: task.due_date ? new Date(task.due_date) : null,
        documents: task.documents && Array.isArray(task.documents) ? [...task.documents] : [],
      };
      setEditedTask(initialTaskState);
      setDraftTitle(task.task_title || '');
    } else {
      setEditedTask(null);
      setDraftTitle('');
    }
    setIsDirty(false);
    setShowTaskOptions(false);
  }, [task]);

  useEffect(() => {
    if (task && editedTask) {
        const originalState = {
            ...task,
            description: task.description || '',
            due_date: task.due_date ? new Date(task.due_date) : null,
            documents: task.documents && Array.isArray(task.documents) ? [...task.documents] : [],
        };
        setIsDirty(!isEqual(originalState, editedTask));
    }
  }, [editedTask, task]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        // Here you might want to ask for confirmation if there are unsaved changes
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !task || !editedTask) return null;

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    try {
      const date = new Date(dateValue);
      const day = String(date.getDate()).padStart(2, '0'); // Use getDate for local timezone
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", dateValue, error);
      return 'Invalid Date';
    }
  };

  const handleDateClick = () => {
    setIsDatePickerOpen(true);
  };

  const handleDatePickerClose = () => {
    setIsDatePickerOpen(false);
  };

  const handleDateSelected = (newDate) => {
    setEditedTask({ ...editedTask, due_date: newDate });
    setIsDatePickerOpen(false);
  };

  const handleStatusClick = (e) => {
    e.stopPropagation();
    setEditedTask({ ...editedTask, is_completed: !editedTask.is_completed });
  };

  const handleUploadClick = (e) => {
    e.stopPropagation();
    fileInputRef.current.click();
  };
  
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newFiles = files.map(file => ({
        // This is a temporary frontend representation.
        // The backend will handle actual file storage and create real document records.
        id: `temp-${Date.now()}-${Math.random()}`,
        file_name: file.name,
        // We'll attach the actual file object for the save handler to process
        file: file, 
        size: file.size,
        type: file.type,
      }));
      
      setEditedTask(prev => ({ ...prev, documents: [...prev.documents, ...newFiles] }));
      
      e.target.value = '';
    }
  };
  
  const handleRemoveFile = (fileId) => {
    setEditedTask(prev => ({
      ...prev,
      documents: prev.documents.filter(doc => doc.id !== fileId)
    }));
  };
  
  const handleSaveChanges = () => {
    if (onSaveChanges) {
        const payload = {};
        
        // Only include fields that have actually changed
        if (editedTask.description !== task.description) {
            payload.description = editedTask.description;
        }
        
        if (editedTask.due_date && (!task.due_date || 
            new Date(editedTask.due_date).getTime() !== new Date(task.due_date).getTime())) {
            payload.due_date = editedTask.due_date.toISOString();
        }
        
        if (editedTask.is_completed !== task.is_completed) {
            payload.is_completed = editedTask.is_completed;
        }

        // Only include document changes if there are any
        const newDocs = editedTask.documents.filter(d => d.file);
        const removedDocs = task.documents
            .filter(originalDoc => !editedTask.documents.some(editedDoc => editedDoc.id === originalDoc.id))
            .map(doc => doc.id);

        if (newDocs.length > 0) {
            payload.new_documents = newDocs;
        }
        if (removedDocs.length > 0) {
            payload.removed_documents = removedDocs;
        }

        // Only call save if there are actual changes
        if (Object.keys(payload).length > 0) {
            onSaveChanges(task.id, payload);
        }
    }
    onClose();
  };
  
  const handleMoreOptionsClick = (e) => {
    e.stopPropagation();
    setShowTaskOptions(prev => !prev);
  };

  const handleRename = () => {
    setIsEditingTitle(true);
    setShowTaskOptions(false);
  };

  const handleDelete = () => {
    setShowTaskOptions(false);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    checklistService.deleteChecklistItem(task.id)
      .then(() => {
        if (onTaskDelete) {
          onTaskDelete(task.id);
        }
        showToast('Task deleted successfully!', 'success');
        setIsDeleteConfirmOpen(false);
        onClose(); // Close the main task modal as well
      })
      .catch(error => {
        console.error('Failed to delete task:', error);
        showToast('Failed to delete task.', 'error');
        setIsDeleteConfirmOpen(false);
      });
  };

  // Helper function to format file size
  const formatFileSize = (sizeInBytes) => {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  const handleTitleClick = () => {
    if (editedTask) {
        setDraftTitle(editedTask.task_title);
        setIsEditingTitle(true);
    }
  };

  const handleTitleChange = (e) => {
    setDraftTitle(e.target.value);
  };

  const handleCancelTitleEdit = () => {
    setIsEditingTitle(false);
    setDraftTitle(editedTask ? editedTask.task_title : '');
  };

  const handleSaveTitle = async () => {
    if (draftTitle === editedTask.task_title) {
        setIsEditingTitle(false);
        return;
    }

    try {
        const updatedTaskData = await checklistService.updateChecklistItem(task.id, { task_title: draftTitle });
        if (onTaskUpdate) {
            onTaskUpdate(updatedTaskData.data);
        }
        setEditedTask(prev => ({ ...prev, task_title: draftTitle }));
        setIsEditingTitle(false);
        showToast('Task title updated!', 'success');
    } catch (error) {
        console.error('Failed to update task title:', error);
        showToast('Failed to update title.', 'error');
    }
  };

  return (
    <div className="task-modal-overlay">
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa"
      >
        <p>Bạn có chắc chắn muốn xóa nhiệm vụ này không?</p>
      </ConfirmationModal>

      <div ref={modalRef} className={`task-modal ${isOpen ? 'open' : ''}`}>
        <div className="task-modal-header">
          <div className="header-left-actions">
            <button 
              className={`status-button ${editedTask.is_completed ? 'completed' : 'pending'}`}
              onClick={handleStatusClick}
            >
              {editedTask.is_completed && <Check size={16} />}
              {editedTask.is_completed ? 'Hoàn thành' : 'Đánh dấu hoàn thành'}
            </button>
          </div>
          <div className="header-right-actions">
            {isDirty && (
              <button className="action-button primary-save-button" onClick={handleSaveChanges}>
                <Save size={18} />
                Lưu thay đổi
              </button>
            )}
            <button className="action-button upload-button-modal" onClick={handleUploadClick}>
              <Upload size={18} />
              Tải lên
            </button>
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
              multiple // Allow multiple file selection
            />
            <div className="more-options-container">
              <button className="icon-button more-options-button" onClick={handleMoreOptionsClick}>
                <MoreVertical size={20} />
              </button>
              <TaskOptions
                  show={showTaskOptions}
                  onRename={handleRename}
                  onDelete={handleDelete}
              />
            </div>
            <button className="icon-button close-modal-button" onClick={onClose}>
              <img src={CloseSideBar} alt="Close" />
            </button>
          </div>
        </div>
        
        <div className="task-modal-body">
          <div className="task-modal-main-content">
            <div className="task-title-section">
              {isEditingTitle ? (
                <div className="title-edit-container">
                    <input
                        type="text"
                        value={draftTitle}
                        onChange={handleTitleChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                        className="title-input"
                        autoFocus
                    />
                    <button onClick={handleSaveTitle} className="title-save-btn"><Save size={18} /></button>
                    <button onClick={handleCancelTitleEdit} className="title-cancel-btn"><X size={18} /></button>
                </div>
              ) : (
                <h1 onClick={handleTitleClick} className="task-title-modal">
                    {editedTask.task_title}
                    <Edit size={16} className="edit-icon-title" />
                </h1>
              )}
            </div>
            
            <div className="task-properties-section">
              <div className="property-row">
                <div className="property-label">Hạn nộp:</div>
                <div className="property-value clickable" onClick={handleDateClick}>
                  {formatDate(editedTask.due_date)}
                </div>
                {isDatePickerOpen && (
                  <div className="task-modal-date-picker-container">
                    <DatePicker 
                      onClose={handleDatePickerClose}
                      onDateSelected={handleDateSelected}
                      selectedDate={editedTask.due_date}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="description-section">
              <label htmlFor="task-description-textarea" className="description-label">Miêu tả</label>
              <textarea
                id="task-description-textarea"
                className="description-textarea"
                value={editedTask.description}
                onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
                placeholder="Không có mô tả chi tiết."
                rows={10}
              />
            </div>
            
            {/* Uploaded files section */}
            {editedTask.documents.length > 0 && (
              <div className="uploaded-files-section">
                <h3 className="uploaded-files-heading">Tập tin đã tải lên</h3>
                <div className="uploaded-files-list">
                  {editedTask.documents.map(doc => (
                    <div key={doc.id} className="uploaded-file-item">
                      <div className="file-info">
                        <span className="file-name">{doc.file_name || doc.name}</span>
                        {doc.size && <span className="file-size">{formatFileSize(doc.size)}</span>}
                      </div>
                      <button 
                        className="remove-file-button"
                        onClick={() => handleRemoveFile(doc.id)}
                        aria-label="Remove file"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Future sections like comments or subtasks can be added here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal; 