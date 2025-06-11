import React from 'react';
import './TaskOptions.css';
import PencilIcon from '../../assets/icons/pencil.svg';
import TrashIcon from '../../assets/icons/trash.svg';

const TaskOptions = ({ onRename, onDelete, show }) => {
  if (!show) {
    return null;
  }

  return (
    <div className="task-options-dropdown">
      <button onClick={onRename} className="task-option-button">
        <img src={PencilIcon} alt="Rename" className="task-option-icon" />
        <span>Đổi tên</span>
      </button>
      <button onClick={onDelete} className="task-option-button delete">
        <img src={TrashIcon} alt="Delete" className="task-option-icon" />
        <span>Xoá</span>
      </button>
    </div>
  );
};

export default TaskOptions; 