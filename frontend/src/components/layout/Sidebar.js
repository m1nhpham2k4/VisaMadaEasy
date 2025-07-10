import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Assuming you'll use React Router for navigation
import './Sidebar.css';
import homeIconSVG from '../../assets/icons/home.svg';
import editIconSVG from '../../assets/icons/edit.svg';
import searchIconSVG from '../../assets/icons/search.svg';
import pinIconSVG from '../../assets/icons/pin.svg';
import arrowDropDownIconSVG from '../../assets/landing_page_icons/arrow_drop_down.svg';
import apiClient from '../../services/apiClient'; // Import apiClient
import checklistService from '../../services/checklistService'; // Import checklistService
import chatService from '../../services/chatService'; // Import chatService
import ConfirmationModal from '../common/ConfirmationModal'; // Import ConfirmationModal

// Import new icons
import moreHorizontalIconSVG from '../../assets/icons/more_horizontal.svg';
import pencilIconSVG from '../../assets/icons/pencil.svg';
import trashIconSVG from '../../assets/icons/trash.svg';
import uploadIconSVG from '../../assets/icons/upload.svg';
import shareIconSVG from '../../assets/icons/share.svg';


const Sidebar = () => {
  const [hoSoOpen, setHoSoOpen] = useState(true); // Default open
  const [doanChatOpen, setDoanChatOpen] = useState(true); // Default open
  const [isEditDropdownOpen, setIsEditDropdownOpen] = useState(false); // State for the new dropdown
  const [activeChatOptions, setActiveChatOptions] = useState(null); // Stores the ID of the chat item whose options are open
  const [searchQuery, setSearchQuery] = useState(''); // State for the search query
  const [isSearching, setIsSearching] = useState(false); // State to control search input visibility
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // State for delete confirmation modal
  const [chatIdToDelete, setChatIdToDelete] = useState(null); // Stores the ID of the chat to be deleted
  const [checklistIdToDelete, setChecklistIdToDelete] = useState(null); // Stores the ID of the checklist to be deleted
  const [activeChecklistOptions, setActiveChecklistOptions] = useState(null); // Stores the ID of the checklist item whose options are open
  const [renamingChatId, setRenamingChatId] = useState(null); // Stores the ID of the chat being renamed
  const [renameInputValue, setRenameInputValue] = useState(''); // Stores the current value of the rename input
  const location = useLocation(); // Get the current location to determine active chat
  const [newChatId, setNewChatId] = useState(null);
  const navigate = useNavigate(); // Hook for navigation
  const [checklists, setChecklists] = useState([]); // State for checklists

  const [chatHistoryGroups, setChatHistoryGroups] = useState({
    pinned: [],
    today: [],
    yesterday: [],
    previous7Days: [],
    previous30Days: [],
    older: [],
  });
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [errorHistory, setErrorHistory] = useState(null);

  // Get current session ID from URL if it exists
  const currentSessionId = React.useMemo(() => {
    const match = location.pathname.match(/\/chat\/(\d+)/);
    return match ? match[1] : null;
  }, [location.pathname]);

  // Get current checklist profile ID from URL if it exists
  const currentChecklistId = React.useMemo(() => {
    const match = location.pathname.match(/\/checklist\/(\d+)/);
    return match ? match[1] : null;
  }, [location.pathname]);

  // Create a memoized, useCallback version of fetchChecklists to be used in multiple places
  const fetchChecklists = useCallback(async () => {
    try {
      const response = await checklistService.getAllChecklists();
      setChecklists(response.data);
    } catch (error) {
      console.error('Failed to fetch checklists:', error);
    }
  }, []); // Empty dependency array means it's created once

  // Fetch checklists when component mounts
  useEffect(() => {
    fetchChecklists();
  }, [fetchChecklists]);

  // Update the hoSoItems with checklists from state
  const hoSoItems = checklists.map(checklist => ({
    id: checklist.id,
    name: checklist.title,
    link: `/checklist/${checklist.id}`,
    active: currentChecklistId === checklist.id.toString()
  }));

  // Function to fetch chat sessions - wrap in useCallback to prevent dependency issues
  const fetchAndGroupSessions = useCallback(async () => {
    setIsLoadingHistory(true);
    setErrorHistory(null);
    try {
      // Use apiClient for the request
      const response = await apiClient.get('/chat/sessions');

      // Axios nests the actual data in `response.data`
      const data = response.data;
      const sessions = data.sessions || [];

      // Group sessions by time
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(todayStart.getDate() - 1);
      const sevenDaysAgoStart = new Date(todayStart);
      sevenDaysAgoStart.setDate(todayStart.getDate() - 7);
      const thirtyDaysAgoStart = new Date(todayStart);
      thirtyDaysAgoStart.setDate(todayStart.getDate() - 30);

      const groups = {
        pinned: [], // Will store pinned chats
        today: [],
        yesterday: [],
        previous7Days: [],
        previous30Days: [],
        older: [],
      };

      sessions.forEach(session => {
        const sessionDate = new Date(session.updated_at);
        const isNew = session.id.toString() === newChatId;
        const item = { 
          id: session.id, 
          name: session.title || 'Untitled Chat', 
          link: `/chat/${session.id}`, // Assuming chat route is /chat/:sessionId
          active: currentSessionId === session.id.toString(), // Set active based on URL, ensure both are strings
          isNewChat: isNew, // Flag to highlight new chats
          isPinned: session.is_pinned // Add pinned status
        };

        // Add to pinned group if pinned
        if (session.is_pinned) {
          groups.pinned.push(item);
        }

        // Add to its date-based group ONLY IF not pinned
        if (!session.is_pinned) {
        if (sessionDate >= todayStart) {
          groups.today.push(item);
        } else if (sessionDate >= yesterdayStart) {
          groups.yesterday.push(item);
        } else if (sessionDate >= sevenDaysAgoStart) {
          groups.previous7Days.push(item);
        } else if (sessionDate >= thirtyDaysAgoStart) {
          groups.previous30Days.push(item);
        } else {
          groups.older.push(item);
          }
        }
      });
      setChatHistoryGroups(groups);

    } catch (err) {
      console.error("Failed to fetch chat history:", err);
      // Axios error structure: err.response.data for server error response, or err.message for network/other errors
      const errorMessage = err.response?.data?.error || err.message || "Could not load chat history.";
      setErrorHistory(errorMessage);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [currentSessionId, newChatId]); // Include dependencies that affect the function

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const toggleSearch = () => {
    setIsSearching(!isSearching);
    setSearchQuery(''); // Clear search query when toggling
  };

  const filteredHoSoItems = hoSoItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChatHistoryItems = Object.values(chatHistoryGroups)
    .flat()
    .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Refactor the useEffect to use our extracted fetch function
  useEffect(() => {
    if (doanChatOpen) { // Fetch only if the section is open or intended to be open
        fetchAndGroupSessions();
    }
  }, [doanChatOpen, fetchAndGroupSessions]); // fetchAndGroupSessions as dependency is safe now

  // Add listener for new chat session events
  useEffect(() => {
    const handleNewChatSession = (event) => {
      // Set the new chat ID to enable highlight animation
      setNewChatId(event.detail.sessionId);
      
      // Ensure the chat section is open to show the new entry
      setDoanChatOpen(true);
      
      // Refresh sidebar to show the new chat
      fetchAndGroupSessions();
      
      // Clear the new chat ID after a few seconds to remove highlight
      setTimeout(() => {
        setNewChatId(null);
      }, 3000); // Remove highlight after 3 seconds
    };

    // Add event listener for new chat sessions
    window.addEventListener('newChatSessionCreated', handleNewChatSession);

    // Add event listener for title updates from TopBar
    const handleTitleUpdate = (event) => {
      // Refresh sidebar to show the updated title
      fetchAndGroupSessions();
    };

    window.addEventListener('chatTitleUpdated', handleTitleUpdate);

    // Clean up
    return () => {
      window.removeEventListener('newChatSessionCreated', handleNewChatSession);
      window.removeEventListener('chatTitleUpdated', handleTitleUpdate);
    };
  }, [fetchAndGroupSessions]); // Include fetchAndGroupSessions as dependency

  // Function to handle creating a new chat session
  const handleNewChat = async () => {
    try {
      // Navigate to the chat page without creating a session explicitly
      navigate('/chat');
      setIsEditDropdownOpen(false); // Close dropdown
    } catch (error) {
      console.error("Failed to navigate:", error);
      // Handle error appropriately, e.g., show a notification to the user
      setIsEditDropdownOpen(false); // Close dropdown on error
    }
  };

  const handleNewProfile = async () => {
    setIsEditDropdownOpen(false); // Close dropdown immediately
    const title = window.prompt("Nhập tên cho hồ sơ mới của bạn:");

    if (title) {
      try {
        const response = await checklistService.createChecklistProfile({ title });
        const newProfile = response.data;
        
        // Refresh the checklist in the sidebar
        await fetchChecklists();

        // Navigate to the new checklist's page
        navigate(`/checklist/${newProfile.id}`);
      } catch (error) {
        console.error("Failed to create new profile:", error);
        alert(`Lỗi: ${error.response?.data?.message || error.message || "Không thể tạo hồ sơ mới."}`);
      }
    }
  };

  // Chat rename functionality
  const handleRenameChat = (chatId) => {
    // Find the current title of the chat
    const allChats = [
      ...chatHistoryGroups.pinned,
      ...chatHistoryGroups.today,
      ...chatHistoryGroups.yesterday,
      ...chatHistoryGroups.previous7Days,
      ...chatHistoryGroups.previous30Days,
      ...chatHistoryGroups.older
    ];
    const chatToRename = allChats.find(chat => chat.id === chatId);

    if (chatToRename) {
      setRenamingChatId(chatId);
      setRenameInputValue(chatToRename.name);
      setActiveChatOptions(null); // Close dropdown after action
    }
  };

  const handleSaveRename = async () => {
    if (!renamingChatId || !renameInputValue.trim()) {
      handleCancelRename();
      return;
    }

    try {
      await chatService.updateSessionTitle(renamingChatId, renameInputValue.trim());

      // Refresh the chat sessions to reflect the change
      await fetchAndGroupSessions();

      // Emit event to update other components (homepage, topbar)
      const titleUpdateEvent = new CustomEvent('chatTitleUpdated', {
        detail: { sessionId: renamingChatId, newTitle: renameInputValue.trim() }
      });
      window.dispatchEvent(titleUpdateEvent);

      // Reset rename state
      setRenamingChatId(null);
      setRenameInputValue('');
    } catch (error) {
      console.error('Failed to rename chat:', error);
      alert('Không thể đổi tên đoạn chat. Vui lòng thử lại sau.');
    }
  };

  const handleCancelRename = () => {
    setRenamingChatId(null);
    setRenameInputValue('');
  };

  const handleRenameKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveRename();
    } else if (e.key === 'Escape') {
      handleCancelRename();
    }
  };

  const handleDeleteChat = (chatId) => {
    setChatIdToDelete(chatId);
    setIsDeleteModalOpen(true);
    setActiveChatOptions(null); // Close dropdown after action
  };

  const handleConfirmDelete = async () => {
    if (chatIdToDelete) {
      try {
        await apiClient.delete(`/chat/sessions/${chatIdToDelete}`);
        fetchAndGroupSessions(); // Refresh the chat list
        // If the deleted chat is the current active chat, navigate to home
        if (currentSessionId === chatIdToDelete.toString()) {
          navigate('/home');
        }
      } catch (error) {
        console.error("Failed to delete chat:", error);
        alert("Không thể xóa đoạn chat. Vui lòng thử lại sau.");
      } finally {
        setIsDeleteModalOpen(false);
        setChatIdToDelete(null);
      }
    } else if (checklistIdToDelete) {
      try {
        await apiClient.delete(`/checklists/checklist/profile/${checklistIdToDelete}`);
        fetchChecklists(); // Refresh the checklist list
        // If the deleted checklist is the current active checklist, navigate to home
        if (currentChecklistId === checklistIdToDelete.toString()) {
          navigate('/home');
        }
      } catch (error) {
        console.error("Failed to delete checklist:", error.response ? error.response.data : error.message);
        alert("Không thể xóa hồ sơ. Vui lòng kiểm tra console để biết thêm chi tiết hoặc thử lại sau.");
      } finally {
        setIsDeleteModalOpen(false);
        setChecklistIdToDelete(null);
      }
    }
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setChatIdToDelete(null);
    setChecklistIdToDelete(null);
  };

  // Add pin/unpin functionality
  const handleTogglePin = async (chatId, currentPinned) => {
    try {
      await apiClient.post(`/chat/sessions/${chatId}/pin`, {
        is_pinned: !currentPinned
      });
      
      // Refresh chat list to update pinned status
      fetchAndGroupSessions();
      setActiveChatOptions(null); // Close dropdown after action
      
      // Dispatch custom event to notify components about pin status change
      const pinStatusChangeEvent = new CustomEvent('chatPinStatusChanged', {
        detail: { chatId, isPinned: !currentPinned }
      });
      window.dispatchEvent(pinStatusChangeEvent);
    } catch (error) {
      console.error("Failed to update pin status:", error);
    }
  };

  const renderChatGroup = (title, items, iconSrc = null, groupKey) => {
    if (!items || items.length === 0) {
      // Optionally, don't render the group at all if empty, handled by overall empty check later for specific groups
      // For "Pinned", we always show the title.
      if (groupKey !== 'pinned' && items.length === 0) return null;
    }

    return (
      <div className="sidebar-chat-group">
        <div className="sidebar-chat-group-header">
          <span className="sidebar-chat-group-title">{title}</span>
          {iconSrc && (
            <div className="sidebar-chat-group-icon">
              <img src={iconSrc} alt={title} style={{ width: '15px', height: '15px' }} />
            </div>
          )}
        </div>
        <div className="sidebar-subitems-list" style={{ paddingLeft: 0 }}>
          {items.map(item => (
            <div key={item.id} className="sidebar-subitem-wrapper">
              {renamingChatId === item.id ? (
                // Rename input mode
                <div className="sidebar-subitem-tag sidebar-rename-container">
                  <input
                    type="text"
                    value={renameInputValue}
                    onChange={(e) => setRenameInputValue(e.target.value)}
                    onKeyDown={handleRenameKeyDown}
                    onBlur={handleSaveRename}
                    onFocus={(e) => e.target.select()}
                    className="sidebar-rename-input"
                    autoFocus
                    maxLength={100}
                    placeholder="Nhập tên mới..."
                  />
                </div>
              ) : (
                // Normal display mode
                <Link
                  to={item.link}
                  className={`sidebar-subitem-tag ${item.active ? 'active' : ''} ${item.isNewChat ? 'new-chat-highlight' : ''}`}
                  title={item.name}
                >
                  <span className="sidebar-subitem-text">{item.name}</span>
                    <img
                      src={moreHorizontalIconSVG}
                      alt="More options"
                      className="sidebar-more-options-icon"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent link navigation
                        e.preventDefault(); // Prevent link navigation
                        setActiveChatOptions(activeChatOptions === item.id ? null : item.id);
                      }}
                    />
                </Link>
              )}
              {activeChatOptions === item.id && (
                <div className="chat-options-dropdown">
                  <button onClick={() => handleTogglePin(item.id, item.isPinned)} className="chat-options-item">
                    <img src={pinIconSVG} alt={item.isPinned ? "Unpin" : "Pin"} />
                    {item.isPinned ? "Bỏ ghim" : "Ghim"}
                  </button>
                  <button onClick={() => handleRenameChat(item.id)} className="chat-options-item">
                    <img src={pencilIconSVG} alt="Rename" />
                    Đổi tên
                  </button>
                  <button onClick={() => handleDeleteChat(item.id)} className="chat-options-item chat-options-item-delete">
                    <img src={trashIconSVG} alt="Delete" />
                    Xóa
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const allChatItemsEmpty = () => {
    return Object.values(chatHistoryGroups).every(group => group.length === 0);
  };

  return (
    <div className="sidebar-container">
      <div className="sidebar">
        {/* Frame 98 - Top Icons */}
        <div className="sidebar-frame98">
          <div className="edit-icon-container" style={{ position: 'relative' }}>
            <img 
              src={editIconSVG} 
              alt="Edit" 
              className="icon-edit-img" 
              onClick={() => setIsEditDropdownOpen(!isEditDropdownOpen)} 
              style={{ cursor: 'pointer' }}
            />
            {isEditDropdownOpen && (
              <div className="edit-dropdown-menu">
                <button onClick={handleNewChat} className="edit-dropdown-item">
                  Đoạn chat mới
                </button>
                <button onClick={handleNewProfile} className="edit-dropdown-item">
                  Hồ sơ mới
                </button>
              </div>
            )}
          </div>
          <img src={searchIconSVG} alt="Search" className="icon-search-img" onClick={toggleSearch} style={{ cursor: 'pointer' }} />
        </div>

      {isSearching && (
        <div className="sidebar-search-container">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="sidebar-search-input"
          />
        </div>
      )}

      {/* Menu tag - Home Link */}
      <Link to="/home" className="sidebar-menu-tag">
        <div className="sidebar-menu-tag-icon">
          <img src={homeIconSVG} alt="Home" />
        </div>
        <span className="sidebar-menu-tag-text">Trang chủ</span>
      </Link>

      {searchQuery ? (
        <div className="sidebar-search-results">
          <div className="sidebar-section-container ho-so-section">
            <div className="sidebar-dropdown-header">
              <span className="sidebar-dropdown-title">Hồ sơ</span>
            </div>
            <div className="sidebar-subitems-list">
              {filteredHoSoItems.map(item => (
                <Link to={item.link} key={item.id} className="sidebar-subitem-tag">
                  <span className="sidebar-subitem-text">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="sidebar-section-container doan-chat-section">
            <div className="sidebar-dropdown-header">
              <span className="sidebar-dropdown-title">Đoạn chat</span>
            </div>
            <div className="sidebar-chat-history-container">
              {renderChatGroup("Kết quả tìm kiếm", filteredChatHistoryItems, null, 'search')}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Hồ sơ Section */}
          <div className="sidebar-section-container ho-so-section">
            <div className="sidebar-dropdown-header" onClick={() => setHoSoOpen(!hoSoOpen)}>
              <span className="sidebar-dropdown-title">Hồ sơ</span>
              <div className="sidebar-dropdown-icon">
                <img 
                  src={arrowDropDownIconSVG} 
                  alt="Toggle section" 
                  style={{ 
                    transform: hoSoOpen ? 'rotate(0deg)' : 'rotate(90deg)', 
                    transition: 'transform 0.2s',
                    width: '10px', /* Reduced size */
                    height: '10px' /* Reduced size */
                  }} 
                />
              </div>
            </div>
            {hoSoOpen && (
              <div className="sidebar-subitems-list">
                {hoSoItems.map(item => (
                  <div key={item.id} className="sidebar-subitem-wrapper">
                    <Link 
                      to={item.link} 
                      className={`sidebar-subitem-tag ${item.active ? 'active' : ''}`}
                      title={item.name}
                    >
                      <span className="sidebar-subitem-text">{item.name}</span>
                      <img
                        src={moreHorizontalIconSVG}
                        alt="More options"
                        className="sidebar-more-options-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setActiveChecklistOptions(activeChecklistOptions === item.id ? null : item.id);
                        }}
                      />
                    </Link>
                    {activeChecklistOptions === item.id && (
                      <div className="chat-options-dropdown">
                        <button className="chat-options-item">
                          <img src={shareIconSVG} alt="Share" />
                          Chia sẻ
                        </button>
                        <button className="chat-options-item">
                          <img src={pencilIconSVG} alt="Rename" />
                          Đổi tên
                        </button>
                        <button 
                          onClick={() => {
                            setChecklistIdToDelete(item.id);
                            setIsDeleteModalOpen(true);
                            setActiveChecklistOptions(null);
                          }} 
                          className="chat-options-item chat-options-item-delete"
                        >
                          <img src={trashIconSVG} alt="Delete" />
                          Xóa
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Đoạn chat Section */}
          <div className="sidebar-section-container doan-chat-section">
            <div className="sidebar-dropdown-header" onClick={() => setDoanChatOpen(!doanChatOpen)}>
              <span className="sidebar-dropdown-title">Đoạn chat</span>
              <div className="sidebar-dropdown-icon">
                <img 
                  src={arrowDropDownIconSVG} 
                  alt="Toggle section" 
                  style={{ 
                    transform: doanChatOpen ? 'rotate(0deg)' : 'rotate(90deg)', 
                    transition: 'transform 0.2s',
                    width: '10px', /* Reduced size */
                    height: '10px' /* Reduced size */
                  }} 
                />
              </div>
            </div>
            {doanChatOpen && (
              <div className="sidebar-chat-history-container">
                {isLoadingHistory && <p className="sidebar-loading-text">Đang tải lịch sử chat...</p>}
                {errorHistory && <p className="sidebar-error-text">Lỗi: {errorHistory}</p>}
                
                {!isLoadingHistory && !errorHistory && (
                  <>
                    {renderChatGroup("Đã ghim", chatHistoryGroups.pinned, pinIconSVG, 'pinned')}
                    {renderChatGroup("Hôm nay", chatHistoryGroups.today, null, 'today')}
                    {renderChatGroup("Hôm qua", chatHistoryGroups.yesterday, null, 'yesterday')}
                    {renderChatGroup("7 ngày trước đó", chatHistoryGroups.previous7Days, null, 'previous7Days')}
                    {renderChatGroup("30 ngày trước đó", chatHistoryGroups.previous30Days, null, 'previous30Days')}
                    {renderChatGroup("Cũ hơn", chatHistoryGroups.older, null, 'older')}
                    
                    {allChatItemsEmpty() && !chatHistoryGroups.pinned.length && ( // Show if all dynamic groups are empty
                      <p className="sidebar-no-items-text" style={{padding: '10px 20px'}}>Không có lịch sử chat nào.</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
      </div>
      {isDeleteModalOpen && (
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          title={checklistIdToDelete ? "Xác nhận xóa hồ sơ" : "Xác nhận xóa đoạn chat"}
        >
          <p>Bạn có chắc chắn muốn xóa {checklistIdToDelete ? "hồ sơ" : "đoạn chat"} này? Hành động này không thể hoàn tác.</p>
        </ConfirmationModal>
      )}
    </div>
  );
};

export default Sidebar;
