import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import checklistService from '../services/checklistService';
import authService from '../services/authService';
import ChecklistProfileHeader from '../components/checklists/ChecklistProfileHeader';
import ChecklistCategory from '../components/checklists/ChecklistCategory';
import MainLayout from '../components/layout/MainLayout';
import { ArrowRight, Save, XCircle, Plus } from 'lucide-react';
import TaskModal from '../components/checklists/TaskModal';
import { useToast } from '../context/ToastContext';
import './ChecklistPage.css'; // We will create this CSS file next

// Helper for deep cloning
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

const ChecklistPage = () => {
    const { profileId } = useParams();
    const navigate = useNavigate();
    // Rename state to distinguish between original and draft versions
    const [originalChecklistData, setOriginalChecklistData] = useState(null);
    const [draftData, setDraftData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const { showToast } = useToast();

    const fetchChecklistData = useCallback(async () => {
        if (!authService.isAuthenticated() && !authService.isGuestSessionActive()) {
            setError("Bạn phải đăng nhập để xem trang này.");
            setIsLoading(false);
            setTimeout(() => navigate('/login'), 2000);
            return;
        }

        if (!profileId) {
            setError('No profile ID provided.');
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await checklistService.getChecklistProfile(profileId);
            // Set both original and draft data on fetch
            setOriginalChecklistData(response.data);
            setDraftData(deepClone(response.data)); // Use a deep clone for the draft
        } catch (err) {
            console.error("Failed to fetch checklist data:", err);
            setError(err.response?.data?.message || err.message || 'Failed to load checklist. Please try again later.');
        }
        setIsLoading(false);
    }, [profileId, navigate]);

    useEffect(() => {
        fetchChecklistData();
    }, [fetchChecklistData]);

    const handleOpenTaskModal = (task) => {
        setSelectedTask(task);
        setIsTaskModalOpen(true);
    };

    const handleCloseTaskModal = () => {
        setSelectedTask(null);
        setIsTaskModalOpen(false);
    };

    // Handlers now update the DRAFT state, not the server
    const handleTaskToggle = (itemId, newCompletedState) => {
        if (!draftData || !draftData.categories) return;
        
        const updatedCategories = draftData.categories.map(category => ({
            ...category,
            items: category.items.map(item =>
                item.id === itemId ? { ...item, is_completed: newCompletedState } : item
            ),
        }));
        setDraftData({ ...draftData, categories: updatedCategories });
    };

    const handleTaskDateChange = (itemId, newDate) => {
        if (!draftData || !draftData.categories) return;

        const [day, month, year] = newDate.split('/');
        const formattedDate = new Date(Date.UTC(year, month - 1, day)).toISOString();

        const updatedCategories = draftData.categories.map(category => ({
            ...category,
            items: category.items.map(item =>
                item.id === itemId ? { ...item, due_date: formattedDate } : item
            ),
        }));
        setDraftData({ ...draftData, categories: updatedCategories });
    };

    const handleProfileDateChange = (newDate) => {
        if (!draftData) return;
        
        const [day, month, year] = newDate.split('/');
        const formattedDate = new Date(Date.UTC(year, month - 1, day)).toISOString();

        setDraftData({ ...draftData, due_date: formattedDate });
    };
    
    const handleAddItem = (categoryId) => {
        const taskTitle = window.prompt("Enter the new task's title:");
        if (taskTitle) {
            // Create a temporary item locally without calling the API
            const newItem = {
                id: `temp-item-${Date.now()}`,
                task_title: taskTitle,
                category_id: categoryId,
                is_completed: false,
                due_date: null,
                description: '',
                documents: [],
                is_new: true, // Flag to identify this as a new item on save
            };

            const updatedCategories = draftData.categories.map(category => {
                if (category.id === categoryId) {
                    // Ensure a fresh copy of items array is created
                    const updatedItems = [...category.items, newItem];
                    return { ...category, items: updatedItems };
                }
                return category;
            });
            setDraftData({ ...draftData, categories: updatedCategories });
        }
    };

    const handleAddCategory = () => {
        const name = window.prompt("Enter the new category's name:");
        if (name) {
            // Create a temporary category locally
            const newCategory = {
                id: `temp-category-${Date.now()}`,
                name: name,
                items: [],
                profile_id: profileId,
                is_new: true, // Flag to identify this as a new category on save
            };
            const updatedCategories = [...draftData.categories, newCategory];
            setDraftData({ ...draftData, categories: updatedCategories });
        }
    };

    const handleCategoryUpdate = (updatedCategory) => {
        if (!draftData) return;

        const updatedCategories = draftData.categories.map(category =>
            category.id === updatedCategory.id ? { ...category, name: updatedCategory.name } : category
        );
        setDraftData({ ...draftData, categories: updatedCategories });

        // Also update the original data to prevent "unsaved changes" from appearing
        const updatedOriginalCategories = originalChecklistData.categories.map(category =>
            category.id === updatedCategory.id ? { ...category, name: updatedCategory.name } : category
        );
        setOriginalChecklistData({ ...originalChecklistData, categories: updatedOriginalCategories });
    };

    const handleTaskDelete = (deletedTaskId) => {
        if (!draftData) return;

        // Filter out the deleted task from the draft data
        const updatedCategories = draftData.categories.map(category => ({
            ...category,
            items: category.items.filter(item => item.id !== deletedTaskId),
        }));
        setDraftData({ ...draftData, categories: updatedCategories });

        // Also update the original data to keep it in sync
        const updatedOriginalCategories = originalChecklistData.categories.map(category => ({
            ...category,
            items: category.items.filter(item => item.id !== deletedTaskId),
        }));
        setOriginalChecklistData({ ...originalChecklistData, categories: updatedOriginalCategories });
    };

    const handleTaskUpdate = (updatedTask) => {
        if (!draftData) return;

        const updatedCategories = draftData.categories.map(category => {
            if (category.id !== updatedTask.category_id) {
                return category;
            }
            return {
                ...category,
                items: category.items.map(item =>
                    item.id === updatedTask.id ? { ...item, ...updatedTask } : item
                ),
            };
        });
        setDraftData({ ...draftData, categories: updatedCategories });
        
        // Also update original data to avoid "unsaved changes" state
        const updatedOriginalCategories = originalChecklistData.categories.map(category => {
            if (category.id !== updatedTask.category_id) {
                return category;
            }
            return {
                ...category,
                items: category.items.map(item =>
                    item.id === updatedTask.id ? { ...item, ...updatedTask } : item
                ),
            };
        });
        setOriginalChecklistData({ ...originalChecklistData, categories: updatedOriginalCategories });
    };

    // --- BATCH UPDATE LOGIC ---

    const handleSaveChanges = async () => {
        if (!originalChecklistData || !draftData) return;
        setIsSaving(true);
        setError(null);

        try {
            // == PHASE 1: Create new categories ==
            const tempCategoryMap = new Map();
            for (const category of draftData.categories) {
                if (category.is_new) {
                    const response = await checklistService.createCategory(profileId, { name: category.name });
                    tempCategoryMap.set(category.id, response.data.id);
                }
            }

            // == PHASE 2: Create new items ==
            for (const category of draftData.categories) {
                // Use the new permanent ID if the category was just created, otherwise use its existing ID
                const permanentCategoryId = tempCategoryMap.get(category.id) || category.id;
                for (const item of category.items) {
                    if (item.is_new) {
                        await checklistService.createItem(permanentCategoryId, { task_title: item.task_title });
                    }
                }
            }

            // == PHASE 3: Update existing items and profile ==
            const updatePromises = [];
            // Profile update
            if (originalChecklistData.due_date !== draftData.due_date) {
                updatePromises.push(
                    checklistService.updateChecklistProfile(profileId, { due_date: draftData.due_date })
                );
            }

            // Item updates
            draftData.categories.forEach(draftCategory => {
                draftCategory.items.forEach(draftItem => {
                    if (draftItem.is_new) return; // Skip new items

                    const originalItem = originalChecklistData.categories
                        .flatMap(c => c.items)
                        .find(i => i.id === draftItem.id);
                    
                    if (!originalItem) return;

                    const itemChanges = {};
                    if (draftItem.is_completed !== originalItem.is_completed) {
                        itemChanges.is_completed = draftItem.is_completed;
                    }
                    const draftDueDate = draftItem.due_date ? new Date(draftItem.due_date).getTime() : null;
                    const originalDueDate = originalItem.due_date ? new Date(originalItem.due_date).getTime() : null;
                    if (draftDueDate !== originalDueDate) {
                        itemChanges.due_date = draftItem.due_date;
                    }
                    
                    if (Object.keys(itemChanges).length > 0) {
                        updatePromises.push(
                            checklistService.updateChecklistItem(draftItem.id, itemChanges)
                        );
                    }
                });
            });
            
            await Promise.all(updatePromises);

            // == FINAL SYNC: Re-fetch all data from the server ==
            await fetchChecklistData();

        } catch (err) {
            console.error("Failed to save changes:", err);
            setError(err.response?.data?.message || err.message || 'Failed to save changes. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleCancelChanges = () => {
        // Discard draft changes by resetting it to the original data
        setDraftData(deepClone(originalChecklistData));
    };

    const handleExportPDF = () => {
        window.print();
    };
    
    // --- DERIVED STATE & RENDER LOGIC ---

    // Calculate completion stats from DRAFT data
    let completedTasks = 0;
    let totalTasks = 0;
    if (draftData && draftData.categories) {
        draftData.categories.forEach(category => {
            if (category.items) {
                totalTasks += category.items.length;
                completedTasks += category.items.filter(item => item.is_completed).length;
            }
        });
    }
    
    // Check if there are any unsaved changes to enable/disable save button
    const hasUnsavedChanges = JSON.stringify(originalChecklistData) !== JSON.stringify(draftData);

    if (isLoading) {
        return <MainLayout><div className="loading-container">Loading checklist...</div></MainLayout>;
    }
    console.log("Rendering with draft data:", draftData);
    const renderChecklistContent = () => {
        if (!draftData) {
            return (
                <div className="info-message">No checklist data found.</div>
            );
        }

        const sortedCategories = draftData.categories ? [...draftData.categories].sort((a, b) => a.id - b.id) : [];

        return (
            <div className="checklist-page-container">
                {/* Save Changes Bar */}
                {hasUnsavedChanges && (
                    <div className="save-changes-bar">
                        <span>Bạn có thay đổi chưa được lưu.</span>
                        <div className="save-changes-buttons">
                            <button onClick={handleSaveChanges} disabled={isSaving} className="save-button">
                                <Save size={16} /> {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                            <button onClick={handleCancelChanges} disabled={isSaving} className="cancel-button">
                                <XCircle size={16} /> Hủy
                            </button>
                        </div>
                    </div>
                )}

                <div className="checklist-main-header-section">
                    <h1>{draftData.title}</h1>
                    <button onClick={handleExportPDF} className="export-pdf-button-page">Xuất PDF</button>
                </div>

                {/* Pass DRAFT data to the header */}
                <ChecklistProfileHeader
                    dueDate={draftData.due_date ? new Date(draftData.due_date).toLocaleDateString('en-GB') : ''}
                    completedTasks={completedTasks}
                    totalTasks={totalTasks}
                    onDateChange={handleProfileDateChange}
                    onSaveChanges={handleSaveChanges}
                    onCancelChanges={handleCancelChanges}
                    onExportPDF={handleExportPDF}
                    isDirty={JSON.stringify(originalChecklistData) !== JSON.stringify(draftData)}
                    isSaving={isSaving}
                />
                
                <div className="task-list-header-section">
                    <div className="task-list-header-left">
                        <h2 className="task-list-title">Danh sách công việc</h2>
                        <button onClick={handleAddCategory} className="add-category-button">
                            <Plus size={20} />
                            <span>Thêm danh mục</span>
                        </button>
                    </div>
                    <Link to={`/checklist/${profileId}/documents`} className="view-all-documents-link">
                        <span>Tất cả thư mục</span>
                        <ArrowRight size={20} />
                    </Link>
                </div>

                <div className="checklist-content">
                    {/* Pass DRAFT data to categories */}
                    {sortedCategories.length > 0 ? (
                        sortedCategories.map(category => (
                            <ChecklistCategory
                                key={category.id}
                                category={category}
                                onTaskToggle={handleTaskToggle}
                                onTaskDateChange={handleTaskDateChange}
                                onAddItem={handleAddItem}
                                onCategoryUpdate={handleCategoryUpdate}
                                onTaskUpdate={handleTaskUpdate}
                                onTaskDelete={handleTaskDelete}
                                onOpenTaskModal={handleOpenTaskModal}
                            />
                        ))
                    ) : (
                        <div className="empty-checklist-message">
                            <p>Chưa có danh mục nào trong checklist này.</p>
                            <p>Hãy bắt đầu bằng cách thêm một danh mục mới!</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <MainLayout pageType="checklist">
            {renderChecklistContent()}
            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={handleCloseTaskModal}
                task={selectedTask}
                onTaskUpdate={handleTaskUpdate}
                onTaskDelete={handleTaskDelete}
            />
        </MainLayout>
    );
};

export default ChecklistPage; 