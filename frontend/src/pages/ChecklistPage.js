import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import checklistService from '../services/checklistService';
import ChecklistProfileHeader from '../components/checklists/ChecklistProfileHeader';
import ChecklistCategory from '../components/checklists/ChecklistCategory';
import MainLayout from '../components/layout/MainLayout';
import { ArrowRight } from 'lucide-react';
import './ChecklistPage.css'; // We will create this CSS file next

const ChecklistPage = () => {
    const { profileId } = useParams();
    const [checklistProfileData, setChecklistProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchChecklistData = useCallback(async () => {
        if (!profileId) {
            setError('No profile ID provided.');
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await checklistService.getChecklistProfile(profileId);
            setChecklistProfileData(response.data);
        } catch (err) {
            console.error("Failed to fetch checklist data:", err);
            setError(err.response?.data?.message || err.message || 'Failed to load checklist. Please try again later.');
        }
        setIsLoading(false);
    }, [profileId]);

    useEffect(() => {
        fetchChecklistData();
    }, [fetchChecklistData]);

    const handleTaskToggle = async (itemId, newCompletedState) => {
        if (!checklistProfileData || !checklistProfileData.categories) return;

        // Store the original state for potential rollback
        const originalChecklistData = JSON.parse(JSON.stringify(checklistProfileData));

        // Optimistic UI update
        const updatedCategories = checklistProfileData.categories.map(category => ({
            ...category,
            items: category.items.map(item =>
                item.id === itemId ? { ...item, is_completed: newCompletedState } : item
            ),
        }));
        setChecklistProfileData({ ...checklistProfileData, categories: updatedCategories });

        try {
            await checklistService.updateChecklistItem(itemId, { is_completed: newCompletedState });
            // Optionally, re-fetch to ensure data consistency if backend might have other changes
            // await fetchChecklistData(); 
        } catch (err) {
            console.error("Failed to update task:", err);
            setError(err.response?.data?.message || err.message || 'Failed to update task. Please try again.');
            // Rollback optimistic update
            setChecklistProfileData(originalChecklistData);
        }
    };

    // Handle task date change
    const handleTaskDateChange = async (itemId, newDate) => {
        if (!checklistProfileData || !checklistProfileData.categories) return;

        // Store the original state for potential rollback
        const originalChecklistData = JSON.parse(JSON.stringify(checklistProfileData));

        // Parse the date from DD/MM/YYYY format to a format suitable for the API
        const [day, month, year] = newDate.split('/');
        const formattedDate = `${year}-${month}-${day}T00:00:00Z`;

        // Optimistic UI update
        const updatedCategories = checklistProfileData.categories.map(category => ({
            ...category,
            items: category.items.map(item =>
                item.id === itemId ? { ...item, due_date: formattedDate } : item
            ),
        }));
        setChecklistProfileData({ ...checklistProfileData, categories: updatedCategories });

        try {
            await checklistService.updateChecklistItem(itemId, { due_date: formattedDate });
            // You could refresh data to ensure consistency
            // await fetchChecklistData();
        } catch (err) {
            console.error("Failed to update task date:", err);
            setError(err.response?.data?.message || err.message || 'Failed to update task date. Please try again.');
            // Rollback optimistic update
            setChecklistProfileData(originalChecklistData);
        }
    };

    // Handle profile due date change
    const handleProfileDateChange = async (newDate) => {
        if (!checklistProfileData) return;

        // Store the original state for potential rollback
        const originalChecklistData = JSON.parse(JSON.stringify(checklistProfileData));

        // Parse the date from DD/MM/YYYY format to a format suitable for the API
        const [day, month, year] = newDate.split('/');
        const formattedDate = `${year}-${month}-${day}T00:00:00Z`;

        // Optimistic UI update
        setChecklistProfileData({ ...checklistProfileData, due_date: formattedDate });

        try {
            await checklistService.updateChecklistProfile(profileId, { due_date: formattedDate });
            // You could refresh data to ensure consistency
            // await fetchChecklistData();
        } catch (err) {
            console.error("Failed to update profile due date:", err);
            setError(err.response?.data?.message || err.message || 'Failed to update checklist due date. Please try again.');
            // Rollback optimistic update
            setChecklistProfileData(originalChecklistData);
        }
    };

    // Placeholder for PDF export (Task 3.4.2)
    const handleExportPDF = () => {
        // Simple print functionality for now
        // For more advanced PDF generation, a library like jsPDF or html2canvas + jsPDF would be needed.
        window.print();
    };

    // Calculate completed tasks and total tasks for the header (Task 3.3.3)
    let completedTasks = 0;
    let totalTasks = 0;
    if (checklistProfileData && checklistProfileData.categories) {
        checklistProfileData.categories.forEach(category => {
            if (category.items) {
                totalTasks += category.items.length;
                completedTasks += category.items.filter(item => item.is_completed).length;
            }
        });
    }

    const renderChecklistContent = () => {
        if (isLoading) {
            return <div className="loading-spinner-container"><div className="loading-spinner"></div><p>Loading checklist...</p></div>;
        }

        if (error) {
            return <div className="error-message">Error: {error}</div>;
        }

        if (!checklistProfileData) {
            return <div className="info-message">No checklist data found.</div>;
        }

        return (
            <div className="checklist-page-container">
                {/* Main title and Export PDF button section */}
                <div className="checklist-main-header-section">
                    <h1>{checklistProfileData.title}</h1>
                    <button onClick={handleExportPDF} className="export-pdf-button-page">Xuất PDF</button>
                </div>

                <ChecklistProfileHeader
                    dueDate={new Date(checklistProfileData.due_date).toLocaleDateString('en-GB')}
                    completedTasks={completedTasks}
                    totalTasks={totalTasks}
                    onDateChange={handleProfileDateChange}
                />
                
                {/* Section for Task List title and View All Documents link */}
                <div className="task-list-header-section">
                    <h2 className="task-list-title">Danh sách công việc</h2>
                    <Link to={`/checklist/${profileId}/documents`} className="view-all-documents-link">
                        <span>Tất cả thư mục</span>
                        <ArrowRight size={20} />
                    </Link>
                </div>

                <div className="checklist-content">
                    {checklistProfileData.categories && checklistProfileData.categories.length > 0 ? (
                        checklistProfileData.categories.map(category => (
                            <ChecklistCategory
                                key={category.id}
                                category={category}
                                onTaskToggle={handleTaskToggle}
                                onDateChange={handleTaskDateChange}
                            />
                        ))
                    ) : (
                        <p className="info-message">This checklist currently has no categories or tasks.</p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <MainLayout pageType="checklist">
            {renderChecklistContent()}
        </MainLayout>
    );
};

export default ChecklistPage; 