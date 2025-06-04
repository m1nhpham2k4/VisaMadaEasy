import React, { useState, useEffect, useRef } from 'react';
import { Folder } from 'lucide-react';
import { ReactComponent as MoreVerticalIcon } from '../../../assets/icons/more_vertical.svg';
import FileOptionsMenu from './FileOptionsMenu';
import './DocumentFolderItem.css';

const DocumentFolderItem = ({ categoryName, categoryDate, categorySize, onCategoryDownload, onCategoryDelete }) => {
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
    const moreIconRef = useRef(null);

    const formattedDate = categoryDate ? new Date(categoryDate).toLocaleDateString('en-GB') : 'N/A';
    const displaySize = categorySize || 'N/A';

    const handleMoreOptionsClick = (event) => {
        event.stopPropagation();
        if (moreIconRef.current) {
            const rect = moreIconRef.current.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            
            // Calculate available space in different directions
            const spaceRight = windowWidth - rect.right;
            const spaceLeft = rect.left;
            const spaceBottom = windowHeight - rect.bottom;
            
            // Default position (below the icon)
            let position = {
                top: rect.bottom + window.scrollY + 5,
                right: null,
                left: rect.left + window.scrollX,
                bottom: null
            };
            
            // If not enough space below, position above
            if (spaceBottom < 100 && rect.top > 100) {
                position = {
                    top: null,
                    right: null,
                    left: rect.left + window.scrollX,
                    bottom: windowHeight - rect.top + window.scrollY + 5
                };
            }
            
            // If not enough space to the right, align to the right edge of the icon
            if (spaceRight < 150 && spaceLeft > 150) {
                position.right = windowWidth - rect.right + window.scrollX;
                position.left = null;
            }
            
            setMenuPosition(position);
        }
        setShowOptionsMenu(prev => !prev);
    };

    const closeMenu = () => {
        setShowOptionsMenu(false);
    };

    useEffect(() => {
        if (showOptionsMenu) {
            document.addEventListener('click', closeMenu);
        }
        return () => {
            document.removeEventListener('click', closeMenu);
        };
    }, [showOptionsMenu]);

    const handleDownload = () => {
        if(onCategoryDownload) onCategoryDownload();
        closeMenu();
    };

    const handleDelete = () => {
        if(onCategoryDelete) onCategoryDelete();
        closeMenu();
    };

    return (
        <div className="document-folder-item new-doc-item-layout">
            <div className="doc-item-info-left">
                <Folder size={20} className="doc-item-icon" />
                <span className="doc-item-name">{categoryName}</span>
            </div>
            <div className="doc-item-info-right">
                <span className="doc-item-date">{formattedDate}</span>
                <span className="doc-item-size">{displaySize}</span>
                <button 
                    ref={moreIconRef} 
                    onClick={handleMoreOptionsClick} 
                    className="doc-item-more-button"
                    aria-label="More options"
                >
                    <MoreVerticalIcon /> 
                </button>
                {showOptionsMenu && (
                    <FileOptionsMenu 
                        onDownload={handleDownload} 
                        onDelete={handleDelete} 
                        onClose={closeMenu} 
                        position={menuPosition} 
                    />
                )}
            </div>
        </div>
    );
};

export default DocumentFolderItem; 