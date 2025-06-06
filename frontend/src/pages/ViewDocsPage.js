import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import checklistService from '../services/checklistService';
import MainLayout from '../components/layout/MainLayout';
import ViewDocsHeader from '../components/checklists/viewDocs/ViewDocsHeader';
import DocumentFolderItem from '../components/checklists/viewDocs/DocumentFolderItem';
import './ViewDocsPage.css';

const ViewDocsPage = () => {
    const { profileId } = useParams();
    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProfileData = useCallback(async () => {
        if (!profileId) {
            setError('No profile ID provided.');
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await checklistService.getChecklistProfile(profileId);
            setProfileData(response.data);
        } catch (err) {
            console.error("Failed to fetch profile data:", err);
            setError(err.response?.data?.message || err.message || 'Failed to load documents. Please try again later.');
        }
        setIsLoading(false);
    }, [profileId]);

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);

    const handleCategoryDownload = (category) => {
        console.log('Download action for category:', category.name);
        alert(`Simulating download for category: ${category.name}`);
        // Implement actual download logic (e.g., zip and download all items in category)
    };

    const handleCategoryDelete = (category) => {
        console.log('Delete action for category:', category.name);
        alert(`Simulating delete for category: ${category.name}`);
        // Implement actual delete logic
    };

    const renderDocumentList = () => {
        if (!profileData || !profileData.categories || profileData.categories.length === 0) {
            return <p className="info-message">No categories found for this profile.</p>;
        }

        return (
            <div className="documents-list-container">
                {profileData.categories.map(category => (
                    <DocumentFolderItem 
                        key={category.id} 
                        categoryName={category.name || category.title || 'Unnamed Category'} 
                        // Assuming categories might have an overall date/size, or these will be derived/placeholders
                        // For now, using placeholder values or something from the category if available.
                        // If date/size are per-document, this model doesn't fit well with category-level actions.
                        // User request: "put the date, size and option in the document folder tab (giấy tờ cá nhân,...)"
                        // This implies date/size might be for the folder/category itself or a summary.
                        categoryDate={category.updated_at || category.created_at || 'N/A'} // Example: use category update date
                        categorySize={category.total_size_placeholder || 'N/A'} // Example: placeholder for category size
                        onCategoryDownload={() => handleCategoryDownload(category)}
                        onCategoryDelete={() => handleCategoryDelete(category)}
                    />
                ))}
            </div>
        );
    };

    if (isLoading) {
        return (
            <MainLayout pageType="checklist"> 
                <div className="loading-spinner-container"><div className="loading-spinner"></div><p>Loading documents...</p></div>
            </MainLayout>
        );
    }

    if (error) {
        return (
            <MainLayout pageType="checklist">
                <ViewDocsHeader profileTitle={profileData?.title || 'Documents'} />
                <div className="error-message">Error: {error}</div>
            </MainLayout>
        );
    }

    if (!profileData) {
        return (
            <MainLayout pageType="checklist">
                 <ViewDocsHeader profileTitle={'Documents'} />
                <div className="info-message">No profile data found.</div>
            </MainLayout>
        );
    }

    return (
        <MainLayout pageType="checklist"> 
            <ViewDocsHeader profileTitle={profileData.title || 'All Documents'} />
            <div className="view-docs-page-content">
                {renderDocumentList()}
            </div>
        </MainLayout>
    );
};

export default ViewDocsPage; 