import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './ViewDocsHeader.css';

const ViewDocsHeader = ({ profileTitle }) => {
    const navigate = useNavigate();

    const handleBack = () => {
        navigate(-1); // Go back to the previous page
    };

    return (
        <div className="view-docs-header">
            <button onClick={handleBack} className="back-button" aria-label="Go back">
                <ArrowLeft size={24} />
                <span>Quay lại</span>
            </button>
            <h1 className="profile-title">{profileTitle}</h1>
        </div>
    );
};

export default ViewDocsHeader; 