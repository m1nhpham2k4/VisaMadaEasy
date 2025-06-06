import React from 'react';
// import DownloadIcon from '../../icons/DownloadIcon'; // Old component import
// import TrashIcon from '../../icons/TrashIcon';       // Old component import
import { ReactComponent as DownloadIcon } from '../../../assets/icons/download.svg'; // Corrected SVG import
import { ReactComponent as TrashIcon } from '../../../assets/icons/trash.svg';       // Corrected SVG import
import './FileOptionsMenu.css';

const FileOptionsMenu = ({ onDownload, onDelete, onClose, position }) => {
    if (!position) return null;

    // Create style object based on provided position values
    const menuStyle = {};
    if (position.top !== null) menuStyle.top = position.top;
    if (position.bottom !== null) menuStyle.bottom = position.bottom;
    if (position.left !== null) menuStyle.left = position.left;
    if (position.right !== null) menuStyle.right = position.right;

    // Basic stop propagation to prevent clicks inside the menu from closing it if it's part of a larger clickable item
    const handleMenuClick = (e) => {
        e.stopPropagation();
    };

    return (
        <div 
            className="file-options-menu"
            style={menuStyle}
            onClick={handleMenuClick}
        >
            <button onClick={onDownload} className="file-options-menu-item">
                <DownloadIcon className="file-options-menu-icon" />
                <span>Tải xuống</span>
            </button>
            <button onClick={onDelete} className="file-options-menu-item delete">
                <TrashIcon className="file-options-menu-icon" />
                <span>Xoá</span>
            </button>
            {/* <button onClick={onClose}>Close</button> // Optional close button if needed */}
        </div>
    );
};

export default FileOptionsMenu; 