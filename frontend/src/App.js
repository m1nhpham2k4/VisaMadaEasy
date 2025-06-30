import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  // Link, // Link không còn được dùng trong App.js nếu SiteHeader bị xóa
  // useLocation // useLocation không còn cần thiết
} from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ChatbotInterface from './pages/ChatbotInterface'; // Import from new location
import ChecklistPage from './pages/ChecklistPage'; // Import the new ChecklistPage
import ViewDocsPage from './pages/ViewDocsPage'; // Import the new ViewDocsPage
import './App.css'; // Default CRA import for styling
import { AuthProvider } from './services/authService';
import { ToastProvider } from './context/ToastContext'; // Import ToastProvider
import { ChecklistProvider } from './context/ChecklistContext';

// SiteHeader component đã được xóa

function App() {
  // useLocation và noHeaderPaths đã được xóa

  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <ChecklistProvider>
            <div className="App">
              {/* SiteHeader đã được xóa hoàn toàn */}

              <main>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/chat" element={<ChatbotInterface />} />
                  <Route path="/chat/:sessionId" element={<ChatbotInterface />} /> {/* New route for accessing specific chat sessions */}
                  <Route path="/checklists/:profileId" element={<ChecklistPage />} /> {/* Old route for ChecklistPage */}
                  <Route path="/checklist/:profileId" element={<ChecklistPage />} /> {/* New route for ChecklistPage */}
                  <Route path="/checklist/:profileId/documents" element={<ViewDocsPage />} /> {/* Route for ViewDocsPage */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="*" element={<LandingPage />} />
                </Routes>
              </main>
            </div>
          </ChecklistProvider>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
