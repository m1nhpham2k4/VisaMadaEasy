import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import '../../Chatbot.css';

const MainLayout = ({ children, pageType = "default" }) => {
  // Apply specific styling for checklist pages
  const contentClass = pageType === "checklist" ? "main-content checklist-layout" : "main-content";
  
  return (
    <div className="chatbot-container">
      <Sidebar />
      <div className={contentClass}>
        <TopBar isLoggedIn={true} pageType={pageType} />
        {children}
      </div>
    </div>
  );
};

export default MainLayout; 