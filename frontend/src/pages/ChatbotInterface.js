import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom'; // Added useParams
import Sidebar from '../components/layout/Sidebar'; // Import the Sidebar component
import TopBar from '../components/layout/TopBar'; // Import the TopBar component
import TextInputField from '../components/layout/TextInputField'; // Import the new component
import '../Chatbot.css'; // Adjusted path to import Chatbot.css
import arrowDropDownIconSVG from '../assets/landing_page_icons/arrow_drop_down.svg'; // Import the SVG
import chatService from '../services/chatService';
import checklistService from '../services/checklistService';
import { useChecklist } from '../context/ChecklistContext';
import apiClient from '../services/apiClient'; // Added for fetching session messages
import { marked } from 'marked'; //use for convert markdown to html
import authService from '../services/authService'; // Added for view switching

// Placeholder for actual icons - in a real app, these would be SVGs or an icon library
// const IconEdit = () => <div className="icon-edit"><div className="icon-edit-shape"></div></div>; // Commented out as Sidebar handles icons
// const IconSearch = () => <div className="icon-search"><div className="icon-search-shape"></div></div>; // Commented out
// const IconHome = () => <div className="icon-home"><div className="icon-home-vector"></div></div>; // Commented out


const API_URL = 'http://localhost:5000'; // Thay đổi URL này nếu backend của bạn chạy ở cổng khác

// Updated IconArrowDropDown to use SVG and accept an isOpen prop
const IconArrowDropDown = ({ isOpen }) => (
  <img 
    src={arrowDropDownIconSVG} 
    alt="Toggle section" 
    style={{
      transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', // Points down when open, right when closed
      transition: 'transform 0.2s',
      width: '16px', // Adjust size as needed, e.g., 16px or 24px
      height: '16px', // Adjust size as needed
      cursor: 'pointer'
    }}
  />
);

// const IconPin = () => <div className="icon-pin"><div className="icon-pin-vector"></div></div>; // Commented out
const IconUpload = () => <div className="icon-upload"><div className="icon-upload-shape"></div></div>;
const IconMoreVertical = () => <div className="icon-more-vertical"><div className="icon-more-vertical-shape"></div></div>;

// Renamed from ChatbotInterface to ChatbotRegisteredUserView
const ChatbotRegisteredUserView = ({ fadeInClass }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null); // Renamed from sessionId for clarity
  const [initialMessageToSend, setInitialMessageToSend] = useState(null); // Track initial message to send
  const messagesEndRef = useRef(null);
  const location = useLocation();
  const { sessionId: sessionIdFromUrl } = useParams(); // Get sessionId from URL
  const hasSentInitialMessageRef = useRef(false);
  const { refreshChecklists } = useChecklist();

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isLoading, error]);

  // Effect to load chat session messages when sessionIdFromUrl changes
  useEffect(() => {
    const loadSessionMessages = async (sid) => {
      setIsLoading(true);
      setError(null);
      setChatHistory([]); // Clear previous chat history
      setCurrentSessionId(sid); // Set current session ID for sending new messages

      try {
        const response = await apiClient.get(`/chat/sessions/${sid}/messages`);
        const fetchedMessages = response.data.messages || [];
        // Transform fetched messages if necessary (e.g., to match chatHistory structure)
        const formattedMessages = fetchedMessages.map(msg => ({
          sender: msg.sender,
          text: msg.text,
          timestamp: msg.timestamp // Keep timestamp if needed for sorting or display
        }));
        setChatHistory(formattedMessages);
      } catch (err) {
        console.error(`Lỗi tải tin nhắn cho session ${sid}:`, err);
        const errorMessage = err.response?.data?.error || err.message || "Không thể tải lịch sử chat.";
        setError(errorMessage);
        // Optionally, keep chat history empty or show a specific error message in chat
        setChatHistory([{ sender: 'bot', text: `Lỗi: ${errorMessage}` }]); 
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionIdFromUrl) {
      console.log("Loading session from URL:", sessionIdFromUrl);
      loadSessionMessages(sessionIdFromUrl);
      // Reset initial message flag if we are loading a session
    } else {
      // If no sessionIdFromUrl, it's a new chat or navigated away from a session
      // Reset relevant states for a new chat scenario if needed
      // but only if not handling an initial message from location state.
      if (!location.state?.initialMessage) {
          setChatHistory([]);
          setCurrentSessionId(null);
          // Error and isLoading should be handled by other flows or reset as needed
      }
      // DON'T reset hasSentInitialMessageRef here to prevent double sending
      // hasSentInitialMessageRef.current = false; // Commented out to prevent race condition
    }
  }, [sessionIdFromUrl]); // Rerun when sessionIdFromUrl changes

  // Effect to handle initial message from HomePage (e.g., from a prompt button)
  useEffect(() => {
    if (!sessionIdFromUrl && location.state?.initialMessage) {
      const messageFromHome = location.state.initialMessage;

      // Set input value for display
      setInputValue(messageFromHome);

      // Only set the message to send if this is the first time
      if (!hasSentInitialMessageRef.current) {
        hasSentInitialMessageRef.current = true;

        // Clear location.state immediately to prevent re-triggering on future navigation events
        window.history.replaceState({}, document.title);

        // Set the initial message to be sent
        setInitialMessageToSend(messageFromHome);
      }
    }
  }, []); // Empty dependency array means this only runs once when component mounts

  // Effect to send the initial message after it's set
  useEffect(() => {
    if (initialMessageToSend) {
      handleSend(initialMessageToSend);
      setInitialMessageToSend(null); // Clear after sending
    }
  }, [initialMessageToSend]); // Trigger when initialMessageToSend changes

  const handleSend = async (messageText) => {
    const textToSend = typeof messageText === 'string' ? messageText : inputValue;
    if (textToSend.trim() === '') return;

    const userMessage = { sender: 'user', text: textToSend };
    setChatHistory(prev => [...prev, userMessage]);

    // Always clear input after sending
    setInputValue('');
    
    setIsLoading(true);
    setError(null);
    
    const lastMessage = chatHistory[chatHistory.length - 1];
    if (textToSend.toLowerCase().includes('yes') && lastMessage && lastMessage.isChecklistPrompt) {
        try {
            await checklistService.generateChecklistFromPrompt(lastMessage.prompt);
            refreshChecklists();
            setChatHistory(prev => [...prev, { text: 'Done! Your checklist has been created.', sender: 'bot' }]);
        } catch (error) {
            setChatHistory(prev => [...prev, { text: 'Sorry, I couldn\'t create the checklist.', sender: 'bot' }]);
        } finally {
            setIsLoading(false);
        }
        return;
    }

    try {
      // chatService.sendMessage now correctly uses currentSessionId (which might be from URL or new)
      const data = await chatService.sendMessage(textToSend, currentSessionId);

      if (data.session_id && !currentSessionId) { // If it was a new chat, a session_id is returned
        setCurrentSessionId(data.session_id);
        // Emit custom event for sidebar to refresh with new data
        const newChatEvent = new CustomEvent('newChatSessionCreated', {
          detail: { sessionId: data.session_id, title: textToSend.substring(0, 50) }
        });
        window.dispatchEvent(newChatEvent);

        // Navigate to the new chat URL to update the URL bar
        // Use replaceState instead of pushState to avoid triggering useEffect again
        window.history.replaceState({}, '', `/chat/${data.session_id}`);
      }

      const botResponse = { sender: 'bot', text: data.reply };
      // A simple way to detect a checklist prompt
      if (data.reply.toLowerCase().includes('would you like to create a checklist')) {
          botResponse.isChecklistPrompt = true;
          botResponse.prompt = textToSend;
      }

      setChatHistory(prev => [...prev, botResponse]);
    } catch (err) {
      console.error('Lỗi gửi tin nhắn:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Không thể kết nối với chatbot. Vui lòng thử lại sau.';
      setError(errorMessage);
      setChatHistory(prev => [...prev, {
        sender: 'bot',
        text: `Xin lỗi, đã có lỗi xảy ra khi gửi tin nhắn của bạn: ${errorMessage}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Group messages into conversation turns
  const renderConversationTurns = () => {
    const turns = [];
    let currentTurn = [];
    
    // Process the chat history into turns (user + bot response)
    chatHistory.forEach((message, index) => {
      currentTurn.push(message);
      
      // If this is a bot message or the last message in history, complete the turn
      if (message.sender === 'bot' || index === chatHistory.length - 1) {
        turns.push([...currentTurn]);
        currentTurn = [];
      }
    });
    
    // Add loading indicator as part of the current turn if needed
    if (isLoading) {
      const lastTurn = turns[turns.length - 1] || [];
      
      // Create a new array with the last turn plus loading indicator
      const turnWithLoading = [...lastTurn, {
        sender: 'bot', 
        isLoading: true
      }];
      
      // Replace the last turn with our updated version
      if (turns.length > 0) {
        turns[turns.length - 1] = turnWithLoading;
      } else {
        turns.push(turnWithLoading);
      }
    }
    
    return turns.map((turn, turnIndex) => (
      <div className="conversation-turn" key={`turn-${turnIndex}`}>
        {turn.map((message, messageIndex) => {
          if (message.sender === 'user') {
            return (
              <div 
                className="user-message-bubble" 
                key={`message-${turnIndex}-${messageIndex}`}
                style={{ 
                  marginLeft: 'auto', // Push to the right side
                  marginRight: '40px',
                  textAlign: 'right',
                  maxWidth: '70%'
                }}
              >
                <p className="user-message-text">{message.text}</p>
              </div>
            );
          } else if (message.isLoading) {
            return (
              <div 
                className="bot-response-container loading" 
                key={`loading-${turnIndex}`}
                style={{ 
                  marginRight: 'auto', // Push to the left side
                  marginLeft: '10px',
                  textAlign: 'left',
                  maxWidth: '70%'
                }}
              >
                <div className="bot-message-group">
                  <div className="bot-message-text">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            );
          } else {
            // Parse the bot's Markdown text to HTML
            const botHtml = marked.parse(message.text || "");
            
            return (
              <div 
                className="bot-response-container" 
                key={`message-${turnIndex}-${messageIndex}`}
                style={{ 
                  marginRight: 'auto', // Push to the left side
                  marginLeft: '10px',
                  textAlign: 'left',
                  maxWidth: '100%'
                }}
              >
                <div className="bot-message-group">
                  <div 
                    className="bot-message-text" 
                    dangerouslySetInnerHTML={{ __html: botHtml }} 
                  />
                </div>
              </div>
            );
          }
        })}
      </div>
    ));
  };

  return (
    <div className={`chatbot-container ${fadeInClass}`}>
      <Sidebar />
      <div className="main-content">
        <TopBar isLoggedIn={true} pageType="in-chat" /> 

        <div className="chat-area-container">
          <div className="chat-messages-wrapper">
            {chatHistory.length === 0 && !isLoading && !error && (
              <div className="empty-chat-message">
                <p>Hãy bắt đầu trò chuyện với chatbot về hồ sơ du học của bạn.</p>
              </div>
            )}
            
            {renderConversationTurns()}
            
            {error && !chatHistory.some(msg => msg.text.includes('Xin lỗi, đã có lỗi xảy ra')) && (
              <div className="bot-response-container error">
                <div className="bot-message-group">
                  <p className="bot-message-text error-text">{error}</p>
                </div>
              </div>
            )}
            
            {/* Invisible element for auto-scrolling */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="input-area-background">
          <TextInputField 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Hỏi mình về hồ sơ du học nè"
            onSend={handleSend}
            variant="chatbot"
            disabled={isLoading}
            onKeyPress={(e) => { if (e.key === 'Enter' && !isLoading) handleSend(); }}
          />
        </div>
      </div>
    </div>
  );
};

// --- Chatbot Page for GUEST users ---
function ChatbotGuestView() {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([]); // To store chat messages
  const messagesEndRef = useRef(null); // For auto-scrolling
  const location = useLocation(); // Get location object
  const hasSentInitialMessageGuestRef = useRef(false); // Ref for guest view
  const [isLoading, setIsLoading] = useState(false); // Added for API loading state
  const [error, setError] = useState(null); // Added for API error handling
  const [sessionId, setSessionId] = useState(null); // Renamed from currentSessionId for consistency with other usage

  // Simulate guest session initiation for chat (can be expanded)
  useEffect(() => {
    const initiateGuestChat = async () => {
      if (!authService.isGuestSessionActive()) {
        try {
          console.log("No active guest session for chat, initiating (simulated for UI)...");
        } catch (error) {
          console.error("Failed to initiate guest session for chat:", error);
        }
      }
    };
    initiateGuestChat();
  }, []);

  // Effect to handle initial message from HomePage for GuestView
  useEffect(() => {
    if (location.state?.initialMessage && messages.length === 0 && !hasSentInitialMessageGuestRef.current) { 
      hasSentInitialMessageGuestRef.current = true; 
      const initialMsgFromHome = location.state.initialMessage;

      // Clear location.state for guest view as well
      window.history.replaceState({}, document.title);
      
      handleChatSubmit(initialMsgFromHome);
    }
  }, [location.state]); // Removed messages.length and sessionId from dependencies

  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) { // Only scroll if there are messages
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleChatSubmit = async (messageText) => {
    const textToSend = typeof messageText === 'string' ? messageText : chatInput;
    if (textToSend.trim() === '') return;

    const userMessage = { id: Date.now(), text: textToSend, sender: 'user' };
    setMessages(prevMessages => [...prevMessages, userMessage]);

    // Always clear input after sending
    setChatInput('');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await chatService.sendMessage(textToSend, sessionId); // Use chatService
      if (data.session_id && !sessionId) { // If it was a new chat and a session_id is returned
        setSessionId(data.session_id);
      }
      const botResponse = { id: Date.now() + 1, text: data.reply, sender: 'bot' }; 
      setMessages(prevMessages => [...prevMessages, botResponse]);
    } catch (err) {
      console.error('Lỗi gửi tin nhắn (guest):', err);
      setError('Không thể kết nối với chatbot. Vui lòng thử lại sau.');
      setMessages(prevMessages => [...prevMessages, {
        id: Date.now() + 1, // Ensure unique ID for error message
        sender: 'bot',
        text: 'Xin lỗi, đã có lỗi xảy ra khi gửi tin nhắn của bạn.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="chatbot-guest-container" 
      style={{ backgroundColor: '#EDF2FB', minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingTop: '20px' }}
    >
      <div 
        className="topbar-guest-wrapper" 
        style={{ 
          maxWidth: '1191px',
          width: 'calc(100% - 72px)',
          margin: '0 auto 20px auto',
          borderRadius: '88px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden'
      }}>
        <TopBar isLoggedIn={false} pageType="in-chat" />
      </div>
      
      <div 
        className="chatbot-guest-content-wrapper" 
        style={{
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          width: '100%', 
          maxWidth: '760px', 
          margin: '0 auto' 
        }}
      >
        {messages.length === 0 ? (
          // Centered "Chat Onboard" section when no messages
          <div 
            className="chat-onboard-guest-centered"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start', // Align content to the top of this container
              textAlign: 'center',
              flexGrow: 1, // Take up available vertical space to center
              paddingTop: '10vh',    // Adjusted: Push content down from the top, effectively moving it up from true center
              paddingLeft: '20px',
              paddingRight: '20px',
              paddingBottom: '20px'
            }}
          >
            <h1 
              className="chat-main-heading-guest" 
              style={{ fontSize: '30px', fontWeight: 700, color: '#0F172B', marginBottom: '32px' }}
            >
              Mình có thể giúp gì cho bạn?
            </h1>
            {/* Wrapper for TextInputField, ensuring it's full-width and centers the component */}
            <div 
              style={{
                width: '180%',
                display: 'flex', 
                justifyContent: 'center', // Centers the TextInputField component within this div
                marginBottom: '32px' // Gap before prompt buttons
              }}
            >
              <TextInputField
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Hỏi mình về hồ sơ du học nè"
                onSend={handleChatSubmit}
                variant="chatbot"
                disabled={isLoading} // Disable input when loading
                onKeyPress={(e) => { if (e.key === 'Enter' && !isLoading) handleChatSubmit(); }} // Send on Enter
              />
            </div>
            <div 
              className="prompt-buttons-container" // Using the class name from your changes
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '20px',
                flexWrap: 'wrap'
              }}
            >
              <button className="prompt-button">Tra cứu</button>
              <button className="prompt-button">Kiểm tra tiến độ</button>
              <button className="prompt-button">Cập nhật thông tin</button>
              <button className="prompt-button">Tóm tắt văn bản</button>
            </div>
          </div>
        ) : (
          // Regular chat view when messages exist
          <>
            <div 
              className="chat-messages-area guest-chat-messages"
              style={{ flexGrow: 1, overflowY: 'auto', padding: '0 10px' }}
            >
              {messages.map(msg => {
                if (msg.sender === 'user') {
                  return (
                    <div 
                      key={msg.id} 
                      className="user-message-bubble" 
                      style={{ 
                        marginLeft: 'auto', 
                        marginRight: '10px', 
                        textAlign: 'right', 
                        maxWidth: '100%', 
                        marginBottom: '10px' // Add some spacing between messages
                      }}
                    >
                      <p className="user-message-text" style={{ margin: 0 }}>{msg.text}</p>
                    </div>
                  );
                } else { // Bot message
                  const botHtml = marked.parse(msg.text || "");
                  return (
                    <div 
                      key={msg.id} 
                      className="bot-response-container" 
                      style={{ 
                        marginRight: 'auto', 
                        marginLeft: '10px', 
                        textAlign: 'left', 
                        maxWidth: '100%', 
                        marginBottom: '10px' // Add some spacing between messages
                      }}
                    >
                      <div className="bot-message-group">
                        <div 
                          className="bot-message-text" 
                          dangerouslySetInnerHTML={{ __html: botHtml }} 
                        />
                      </div>
                    </div>
                  );
                }
              })}
              {isLoading && (
                <div className="bot-response-container loading" style={{ marginRight: 'auto', marginLeft: '10px', textAlign: 'left', maxWidth: '100%', marginBottom: '10px'}}>
                  <div className="bot-message-group">
                    <div className="bot-message-text">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {error && !messages.some(msg => msg.text.includes('Xin lỗi, đã có lỗi xảy ra')) && (
                <div className="bot-response-container error" style={{ marginRight: 'auto', marginLeft: '10px', textAlign: 'left', maxWidth: '100%', marginBottom: '10px'}}>
                  <div className="bot-message-group">
                    <p className="bot-message-text error-text">{error}</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div 
              className="guest-input-area-background"
              style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '20px 0',
                // marginTop: 'auto' // Not needed here as chat messages will push it down
              }}
            >
              <TextInputField
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Hỏi mình về hồ sơ du học nè"
                onSend={handleChatSubmit}
                variant="chatbot"
                disabled={isLoading} // Disable input when loading
                onKeyPress={(e) => { if (e.key === 'Enter' && !isLoading) handleChatSubmit(); }} // Send on Enter
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// --- Main ChatbotPage Component to decide which view to render ---
function ChatbotPage() {
  const [currentUserInfo, setCurrentUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(false); // Add fade-in effect

  useEffect(() => {
    const fetchUserStatus = async () => {
      try {
        const userInfo = await authService.getCurrentUser();
        setCurrentUserInfo(userInfo);
      } catch (error) {
        console.error("Error fetching user status in ChatbotPage:", error);
        setCurrentUserInfo(null);
      } finally {
        setIsLoading(false);
        // Trigger fade-in animation after user info is loaded
        setTimeout(() => setFadeIn(true), 50);
      }
    };

    fetchUserStatus();
  }, []);

  // Instead of showing "Loading chat...", render an empty div with the same background
  // This creates a seamless visual transition while data loads
  if (isLoading) {
    return <div style={{ 
      backgroundColor: '#EDF2FB', 
      minHeight: '100vh', 
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}></div>;
  }

  // For registered users, directly render ChatbotRegisteredUserView
  // The component already uses chatbot-container class
  if (currentUserInfo && currentUserInfo.type === 'registered') {
    return <ChatbotRegisteredUserView fadeInClass={fadeIn ? 'fade-in' : ''} />;
  } else {
    // For guest users, wrap ChatbotGuestView in a container
    return (
      <div className={`guest-view-wrapper ${fadeIn ? 'fade-in' : ''}`}>
        <ChatbotGuestView />
      </div>
    );
  }
}

export default ChatbotPage; // Export the new main ChatbotPage
