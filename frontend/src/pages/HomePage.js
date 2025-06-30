import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar'; // Import the Sidebar component
import TopBar from '../components/layout/TopBar'; // Import the TopBar component
import authService from '../services/authService'; // Import authService
import apiClient from '../services/apiClient'; // Import apiClient
import TextInputField from '../components/layout/TextInputField'; // Import TextInputField
import Checkbox from '../components/common/Checkbox/Checkbox'; // Import Checkbox
import unlockIcon from '../assets/icons/unlock.svg';
import checkboxShapeIcon from '../assets/icons/checkbox_shape.svg'; // Import checkbox shape
import checkboxVectorIcon from '../assets/icons/checkbox_vector.svg'; // Import checkbox vector (tick)
import TaskModal from '../components/checklists/TaskModal'; // Import the TaskModal
import { useToast } from '../context/ToastContext'; // Import useToast
import checklistService from '../services/checklistService'; // Import checklistService
import '../App.css';

// --- HomePage for GUEST users (default view) ---
function HomePageGuestView() {
  const [chatInput, setChatInput] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  // State để theo dõi xem guest session đã được khởi tạo cho tương tác chat chưa
  const [guestSessionInitiatedForChat, setGuestSessionInitiatedForChat] = useState(authService.isGuestSessionActive());
  const navigate = useNavigate(); // Add useNavigate hook

  const handleChatSubmit = async () => {
    if (chatInput.trim() === '') return;

    let currentGuestToken = localStorage.getItem('accessToken');
    let currentTokenType = localStorage.getItem('tokenType');

    // Start transition animation
    setIsTransitioning(true);

    // Nếu chưa có guest token hợp lệ, thử khởi tạo
    if (!currentGuestToken || currentTokenType !== 'guest') {
      try {
        console.log("No active guest session for chat, initiating...");
        await authService.initiateGuestSession();
        setGuestSessionInitiatedForChat(true); // Đánh dấu đã khởi tạo
        // Sau khi khởi tạo, token mới được lưu vào localStorage bởi authService
        // Interceptor của axios sẽ tự động gắn token này vào request tiếp theo
      } catch (error) {
        console.error("Failed to initiate guest session for chat:", error);
        // Có thể hiển thị thông báo lỗi cho người dùng ở đây
        // Nếu không khởi tạo được session, không nên tiếp tục gửi chat
        setIsTransitioning(false);
        return; 
      }
    }
    
    // Add slightly longer delay to allow transition animation and also
    // give time for the backend to initialize the session if needed
    setTimeout(() => {
      // Navigate to chatbot page with the input
      navigate('/chat', { state: { initialMessage: chatInput } });
    }, 500); // Increased from 400ms to 500ms for smoother transition
  };

  return (
    <div className={`home-page-container ${isTransitioning ? 'transitioning' : ''}`}> {/* Main container for the guest page */}
      {/* Replace hardcoded top bar with TopBar component */}
      <TopBar isLoggedIn={false} pageType="started" /> 

      {/* Main content wrapper for Guest View (Previously home-content-wrapper) */}
      <div className={`home-guest-content-wrapper ${isTransitioning ? 'fade-out' : ''}`}> {/* Unique class for guest content */}
        {/* Updated chat interaction section based on Figma node 411-2396 */}
        <section className="chat-interaction-section new-chat-onboard-layout">
          <h1 className="chat-main-heading onboard-main-heading" style={{ marginBottom: '-2rem' }}>Mình có thể giúp gì cho bạn?</h1>
          
          {/* TextInputField moved before prompt buttons */}
          <div className={`home-chat-input-container onboard-input-container ${isTransitioning ? 'sliding-input' : ''}`}>
            <TextInputField
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Hỏi mình về hồ sơ du học nè"
              onSend={handleChatSubmit}
              variant="home"
            />
          </div>

          <div className={`prompt-buttons-container onboard-prompt-buttons ${isTransitioning ? 'fade-out' : ''}`}>
            {/* Updated prompt buttons based on Figma */}
            <button className="prompt-button onboard-prompt-button">Tra cứu</button>
            <button className="prompt-button onboard-prompt-button">Kiểm tra tiến độ</button>
            <button className="prompt-button onboard-prompt-button">Cập nhật thông tin</button>
            <button className="prompt-button onboard-prompt-button">Tóm tắt văn bản</button>
          </div>
        </section>

        {/* Login Prompt Frame - Copied from previous HomePage (guest) implementation */}
        <section className={`login-prompt-frame ${isTransitioning ? 'fade-out' : ''}`}>
          <div className="login-prompt-header">
            {/* Replace div with img tag for unlock icon */}
            <img src={unlockIcon} alt="Unlock Icon" className="unlock-icon-svg" /> 
            {/* Ensure h2 and p are styled appropriately if needed, or simplify structure */}
            <h2 className="login-prompt-title">Đăng nhập để mở ra cơ hội</h2>
          </div>
          <ul className="login-prompt-features-list">
            <li className="feature-bullet-point">
              {/* Replace span with actual checkbox SVG structure */}
              <div className="custom-checkbox-icon">
                <img src={checkboxShapeIcon} alt="Checkbox shape" className="checkbox-shape-svg" />
                <img src={checkboxVectorIcon} alt="Checkbox tick" className="checkbox-vector-svg" />
              </div>
              Tạo hồ sơ để sắp xếp tài liệu và theo dõi tiến trình
            </li>
            <li className="feature-bullet-point">
              <div className="custom-checkbox-icon">
                <img src={checkboxShapeIcon} alt="Checkbox shape" className="checkbox-shape-svg" />
                <img src={checkboxVectorIcon} alt="Checkbox tick" className="checkbox-vector-svg" />
              </div>
              Lưu hội thoại với chatbot để dễ dàng xem lại sau
            </li>
            <li className="feature-bullet-point">
              <div className="custom-checkbox-icon">
                <img src={checkboxShapeIcon} alt="Checkbox shape" className="checkbox-shape-svg" />
                <img src={checkboxVectorIcon} alt="Checkbox tick" className="checkbox-vector-svg" />
              </div>
              Nhận nhắc nhở hạn nộp để không bỏ lỡ bước nào
            </li>
            <li className="feature-bullet-point">
              <div className="custom-checkbox-icon">
                <img src={checkboxShapeIcon} alt="Checkbox shape" className="checkbox-shape-svg" />
                <img src={checkboxVectorIcon} alt="Checkbox tick" className="checkbox-vector-svg" />
              </div>
              Đồng bộ hồ sơ và hội thoại để chatbot hỗ trợ tốt hơn
            </li>
          </ul>
          <Link to="/login" className="login-prompt-cta-button">
            Đăng nhập
          </Link>
        </section>
      </div>
    </div>
  );
}

// --- HomePage for REGISTERED users (kept for later use) ---
function HomePageForRegisteredUserView() { // Renamed component
  const [chatInput, setChatInput] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pinnedChats, setPinnedChats] = useState([]);
  const [isLoadingPinned, setIsLoadingPinned] = useState(false);
  const [categorizedTasks, setCategorizedTasks] = useState({ pending: [], overdue: [], done: [] });
  const [isLoadingTasks, setIsLoadingTasks] = useState(true); // Start with loading true
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'overdue', 'done'
  const [selectedTask, setSelectedTask] = useState(null); // State for the selected task
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false); // State for modal visibility
  const { showToast } = useToast(); // Destructure showToast from useToast
  const navigate = useNavigate();

  // Fetch all categorized tasks once on component mount
  useEffect(() => {
    const fetchAllTasks = async () => {
      setIsLoadingTasks(true);
      try {
        const response = await apiClient.get('/checklists/my-tasks');
        // Set state, providing default empty arrays if a category is missing
        setCategorizedTasks({
          pending: response.data.pending || [],
          overdue: response.data.overdue || [],
          done: response.data.done || []
        });
      } catch (error) {
        console.error('Error fetching categorized tasks:', error);
        setCategorizedTasks({ pending: [], overdue: [], done: [] }); // Reset on error
      } finally {
        setIsLoadingTasks(false);
      }
    };
    fetchAllTasks();
  }, []); // Empty dependency array means this runs only once

  // Fetch pinned chats when component mounts
  useEffect(() => {
    const fetchPinnedChats = async () => {
      setIsLoadingPinned(true);
      try {
        // Use apiClient for the request
        const response = await apiClient.get('/chat/sessions');
        
        // Correctly access the response data structure from axios
        const data = response.data;
        
        // Filter only pinned chats and format them
        const pinnedChatsData = data.sessions
          .filter(session => session.is_pinned)
          .map(session => {
            const date = new Date(session.updated_at);
            const today = new Date();
            let formattedDate;
            
            // Format date to match the design
            if (date.toDateString() === today.toDateString()) {
              formattedDate = 'Hôm nay';
            } else if (date.toDateString() === new Date(today - 86400000).toDateString()) {
              formattedDate = 'Hôm qua';
            } else {
              formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
            }
            
            return {
              id: session.id,
              title: session.title,
              date: formattedDate
            };
          });
          
        setPinnedChats(pinnedChatsData);
      } catch (error) {
        console.error('Error fetching pinned chats:', error);
      } finally {
        setIsLoadingPinned(false);
      }
    };
    
    // Fetch pinned chats initially
    fetchPinnedChats();
    
    // Add event listener for pin status changes from sidebar
    const handlePinStatusChange = () => {
      fetchPinnedChats();
    };
    
    window.addEventListener('chatPinStatusChanged', handlePinStatusChange);
    
    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('chatPinStatusChanged', handlePinStatusChange);
    };
  }, []);

  const handleChatSubmitRegistered = () => { // Renamed handler
    if (chatInput.trim() === '') return;
    
    // Start transition animation
    setIsTransitioning(true);
    
    // Add slightly longer delay for smoother transition
    setTimeout(() => {
      // Navigate to chatbot page with the input
      navigate('/chat', { state: { initialMessage: chatInput } });
    }, 500); // Increased from 400ms to 500ms for smoother transition
  };

  const formatDueDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Hôm nay';
    if (date.toDateString() === tomorrow.toDateString()) return 'Ngày mai';
    
    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) return `Còn ${diffDays} ngày`;
    if (diffDays === 0) return 'Hết hạn hôm nay'; // Should be covered by 'Hôm nay' but as a fallback
    return `Quá hạn ${-diffDays} ngày`;
  };
  
  const handleOpenTaskModal = (task) => {
    // 1. Optimistically set the task and open the modal immediately
    setSelectedTask(task);
    setIsTaskModalOpen(true);

    // 2. Fetch fresh data in the background to update the view if needed
    checklistService.getChecklistItem(task.id)
      .then(response => {
        // Update the state with the fresh data
        setSelectedTask(response.data);
      })
      .catch(error => {
        // If the background fetch fails, the user can still interact with the
        // potentially stale data. We can show a non-intrusive toast.
        console.error("Background task refresh failed:", error);
        showToast('Could not refresh task details.', 'warning');
      });
  };

  const handleCloseTaskModal = () => {
    setSelectedTask(null);
    setIsTaskModalOpen(false);
  };

  const handleTaskUpdate = (updatedTask) => {
    // This function handles the re-categorization of a task when its state (e.g., is_completed) changes.
    // It's used both for optimistic updates and for updates coming from the modal.
    setCategorizedTasks(prev => {
        let newPending = [...prev.pending];
        let newOverdue = [...prev.overdue];
        let newDone = [...prev.done];

        // Find and remove the task from all lists first
        newPending = newPending.filter(t => t.item_id !== updatedTask.item_id);
        newOverdue = newOverdue.filter(t => t.item_id !== updatedTask.item_id);
        newDone = newDone.filter(t => t.item_id !== updatedTask.item_id);

        // Add the updated task to the correct list
        if (updatedTask.is_completed) {
            newDone.unshift(updatedTask);
        } else {
            // Here you could add logic to check if it's overdue
            // For now, it goes back to pending.
            newPending.unshift(updatedTask);
        }

        return { pending: newPending, overdue: newOverdue, done: newDone };
    });
  };

  const handleToggleTaskCompletion = async (task) => {
    // Create a version of the task as it will be after the update
    const updatedTask = { ...task, is_completed: !task.is_completed };

    // 1. Optimistic UI update
    handleTaskUpdate(updatedTask);
    
    try {
        // 2. API call in the background
        await checklistService.updateChecklistItem(task.item_id, { is_completed: updatedTask.is_completed });
        // On success, the UI is already correct. We could show a toast if desired.
    } catch (error) {
        console.error("Failed to update task status:", error);
        showToast('Could not update task status. Please try again.', 'error');
        // 3. Revert on failure
        handleTaskUpdate(task); // Pass the original task to revert the UI
    }
  };

  const handleTaskDelete = (deletedTaskId) => {
    // Filter out the deleted task from all categories
    setCategorizedTasks(prev => ({
      pending: prev.pending.filter(t => t.item_id !== deletedTaskId),
      overdue: prev.overdue.filter(t => t.item_id !== deletedTaskId),
      done: prev.done.filter(t => t.item_id !== deletedTaskId),
    }));
  };

  return (
    <>
      <div className={`home-registered-main-container ${isTransitioning ? 'transitioning' : ''}`} style={{ display: 'flex', height: '100vh' }}>
        <Sidebar />
        <main className={`home-main-content-area ${isTransitioning ? 'fade-out' : ''}`} style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {/* TopBar will be sticky within this main area */}
          <TopBar isLoggedIn={true} pageType="default" /> {/* pageType="default" for logged-in homepage */}
          <div 
            className="main-content-inner-wrapper" 
            style={{
              paddingLeft: '20px', 
              paddingTop: '70px', /* Adjust based on actual TopBar height */
              flexGrow: 1, 
              display: 'flex', 
              flexDirection: 'column',
              // justifyContent: 'center', // Center content vertically in the remaining space
              // alignItems: 'center' // Center content horizontally
            }}
          >
            <section 
              className="chat-interaction-section main-chat-area"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                flexGrow: 1 // Allow this section to take available space for centering
              }}
            >
              <h1 className="chat-main-heading" style={{ fontSize: '2rem', marginBottom: '-1.5rem', marginRight: '1rem' }}>Mình có thể giúp gì cho bạn?</h1>
              <div className={`home-chat-input-container ${isTransitioning ? 'sliding-input' : ''}`} style={{ width: '130%', marginLeft: '4rem' }}>
                <TextInputField
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Hỏi mình về hồ sơ du học nè"
                  onSend={handleChatSubmitRegistered}
                  variant="home"
                />
              </div>
              <div className={`prompt-buttons-container ${isTransitioning ? 'fade-out' : ''}`} style={{ marginTop: '1rem' }}>
                <button className="prompt-button">Tra cứu</button>
                <button className="prompt-button">Kiểm tra tiến độ</button>
                <button className="prompt-button">Cập nhật thông tin</button>
                <button className="prompt-button">Tóm tắt văn bản</button>
              </div>
            </section>
            {/* The user-tasks-pinned-chats-container will now be below the centered chat section */}
            {/* If this also needs specific layout, it can be adjusted */}
            <section className={`user-tasks-pinned-chats-container ${isTransitioning ? 'fade-out' : ''}`}>
              <div className="my-tasks-section">
                <div className="section-header">
                  <h2 className="section-title-main">
                    Việc của tôi
                  </h2>
                </div>
                
                <div className="task-tabs-container">
                  <button className={`task-tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
                    Cần hoàn thành ({categorizedTasks.pending.length})
                  </button>
                  <button className={`task-tab ${activeTab === 'overdue' ? 'active' : ''}`} onClick={() => setActiveTab('overdue')}>
                    Quá hạn ({categorizedTasks.overdue.length})
                  </button>
                  <button className={`task-tab ${activeTab === 'done' ? 'active' : ''}`} onClick={() => setActiveTab('done')}>
                    Đã hoàn thành ({categorizedTasks.done.length})
                  </button>
                </div>
                <ul className="tasks-list-container">
                   {isLoadingTasks ? (
                    <p>Đang tải công việc...</p>
                  ) : categorizedTasks[activeTab] && categorizedTasks[activeTab].length > 0 ? (
                    categorizedTasks[activeTab].map(task => {
                      // The task object from the API has 'item_id' and 'item_title'.
                      // We'll create a new object for the modal to avoid confusion.
                      const modalTaskObject = {
                        id: task.item_id,
                        task_title: task.item_title,
                        description: task.description,
                        due_date: task.due_date,
                        is_completed: task.is_completed, // Use the direct value
                        documents: task.documents || [],
                        // Add any other properties the modal expects
                      };

                      return (
                        <li key={task.item_id} className={`task-item ${task.is_completed ? 'task-completed' : ''}`}>
                          <div 
                            className="task-link-wrapper" 
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', cursor: 'pointer' }}
                            onClick={() => handleOpenTaskModal(modalTaskObject)}
                          >
                            <div className="task-info" style={{ display: 'flex', alignItems: 'center' }}>
                              <div onClick={(e) => e.stopPropagation()}>
                                <Checkbox 
                                  checked={task.is_completed} 
                                  onChange={() => handleToggleTaskCompletion(task)} 
                                />
                              </div>
                              <span className="task-name" style={{ marginLeft: '8px' }}>{task.item_title}</span>
                            </div>
                            <div className="task-due-date" style={{ display: 'flex', alignItems: 'center' }}>
                              <span>{formatDueDate(task.due_date)}</span>
                              <span className="icon-placeholder-sidebar arrow-right-icon"></span>
                            </div>
                          </div>
                        </li>
                      );
                    })
                  ) : (
                    <p>Không có công việc nào.</p>
                  )}
                </ul>
              </div>
              <div className="pinned-chats-section">
                <h2 className="section-title-main">Đoạn chat đã ghim</h2>
                <ul className="pinned-chats-list-container">
                   {isLoadingPinned ? (
                    <p>Đang tải...</p>
                  ) : pinnedChats.length > 0 ? (
                     pinnedChats.map(chat => (
                    <li key={chat.id} className="pinned-chat-item">
                        <Link to={`/chat/${chat.id}`} className="pinned-chat-link">
                             <span className="pinned-chat-title">{chat.title}</span>
                             <span className="pinned-chat-date">{chat.date}</span>
                         </Link>
                    </li>
                     ))
                  ) : (
                    <p className="no-pinned-chats">Chưa có đoạn chat nào được ghim</p>
                  )}
                </ul>
              </div>
            </section>
          </div>
        </main>
      </div>
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        task={selectedTask}
        onTaskUpdate={handleTaskUpdate}
        onTaskDelete={handleTaskDelete}
      />
    </>
  );
}

// --- Main HomePage Component ---
function HomePage() {
  const [userStatus, setUserStatus] = useState('loading'); // 'loading', 'guest', 'registered'

  useEffect(() => {
    const fetchUserStatus = async () => {
      const status = await authService.getUserStatus();
      setUserStatus(status);
    };

    fetchUserStatus();
  }, []);

  if (userStatus === 'loading') {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  return userStatus === 'registered' ? <HomePageForRegisteredUserView /> : <HomePageGuestView />;
}

export default HomePage;
