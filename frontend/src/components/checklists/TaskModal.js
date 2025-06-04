import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Upload, MoreVertical, Check, X } from 'lucide-react';
import './TaskModal.css';
import DatePicker from './DatePicker/DatePicker';

const TaskModal = ({ isOpen, onClose, task, onToggleStatus, onUpload, onDateChange }) => {
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);
  const [description, setDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    if (task && task.details) {
      setDescription(task.details);
    } else {
      setDescription('');
    }

    // Initialize uploaded files from task if available
    if (task && task.documents && Array.isArray(task.documents)) {
      setUploadedFiles(task.documents);
    } else {
      setUploadedFiles([]);
    }
  }, [task]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
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

  if (!isOpen || !task) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const day = String(date.getUTCDate()).padStart(2, '0');
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const year = date.getUTCFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return dateString;
    }
  };

  const handleDateClick = () => {
    setIsDatePickerOpen(true);
  };

  const handleDatePickerClose = () => {
    setIsDatePickerOpen(false);
  };

  const handleDateSelected = (newDate) => {
    // Call the parent component's onDateChange if it exists
    if (onDateChange) {
      onDateChange(task.id, newDate);
    }
    setIsDatePickerOpen(false);
  };

  const handleStatusClick = (e) => {
    e.stopPropagation();
    if (onToggleStatus) {
      onToggleStatus(task.id, !task.is_completed);
    }
  };

  const handleUploadClick = (e) => {
    e.stopPropagation();
    // Trigger the file input click
    fileInputRef.current.click();
  };
  
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Create file objects with unique IDs
      const newFiles = files.map(file => ({
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: file.name,
        file: file,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString()
      }));
      
      // Add new files to the existing uploaded files
      setUploadedFiles(prevFiles => [...prevFiles, ...newFiles]);
      
      // Call the onUpload callback if provided
      if (onUpload) {
        onUpload(task.id, newFiles);
      }
      
      // Clear the file input to allow selecting the same files again
      e.target.value = '';
    }
  };
  
  const handleRemoveFile = (fileId) => {
    setUploadedFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
  };
  
  const handleMoreOptionsClick = (e) => {
    e.stopPropagation();
    console.log("More options clicked for task:", task.id);
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

  return (
    <div className="task-modal-overlay">
      <div ref={modalRef} className={`task-modal ${isOpen ? 'open' : ''}`}>
        <div className="task-modal-header">
          <div className="header-left-actions">
            <button 
              className={`status-button ${task.is_completed ? 'completed' : 'pending'}`}
              onClick={handleStatusClick}
            >
              {task.is_completed && <Check size={16} />}
              {task.is_completed ? 'Hoàn thành' : 'Đánh dấu hoàn thành'}
            </button>
          </div>
          <div className="header-right-actions">
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
            <button className="icon-button more-options-button" onClick={handleMoreOptionsClick}>
              <MoreVertical size={20} />
            </button>
            <button className="icon-button close-modal-button" onClick={onClose}>
              <ArrowRight size={24} />
            </button>
          </div>
        </div>
        
        <div className="task-modal-content">
          <div className="task-content-header">
            <h2 className="task-content-title">{task.description}</h2>
            <div className="task-content-due-date">
              <span className="due-date-label">Hạn nộp:</span> 
              <span className="due-date-value clickable" onClick={handleDateClick}>
                {formatDate(task.due_date)}
              </span>
              {isDatePickerOpen && (
                <div className="task-modal-date-picker-container">
                  <DatePicker 
                    onClose={handleDatePickerClose}
                    onDateSelected={handleDateSelected}
                    selectedDate={formatDate(task.due_date)}
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Không có mô tả chi tiết."
              rows={10}
            />
          </div>
          
          {/* Uploaded files section */}
          {uploadedFiles.length > 0 && (
            <div className="uploaded-files-section">
              <h3 className="uploaded-files-heading">Tập tin đã tải lên</h3>
              <div className="uploaded-files-list">
                {uploadedFiles.map(file => (
                  <div key={file.id} className="uploaded-file-item">
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      {file.size && <span className="file-size">{formatFileSize(file.size)}</span>}
                    </div>
                    <button 
                      className="remove-file-button"
                      onClick={() => handleRemoveFile(file.id)}
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
  );
};

export default TaskModal; 