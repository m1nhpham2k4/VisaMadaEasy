import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './TopBar.css';
// Import icons
import { ReactComponent as ShareIcon } from '../../assets/icons/share.svg';
import { ReactComponent as MoreIcon } from '../../assets/icons/more_vertical.svg';
import { ReactComponent as EditIcon } from '../../assets/icons/edit.svg';
import { ReactComponent as AvatarIcon } from '../../assets/icons/avatar.svg';
// Import additional icons for dropdown menu
import trashIconSVG from '../../assets/icons/trash.svg';
import pencilIconSVG from '../../assets/icons/pencil.svg';
// Import ConfirmationModal for delete functionality
import ConfirmationModal from '../common/ConfirmationModal';
// Import apiClient for delete functionality
import apiClient from '../../services/apiClient';
// import { ReactComponent as MenuIcon } from '../../assets/icons/menu.svg'; // Thay thế bằng icon chuẩn nếu có

const TopBar = ({ isLoggedIn, pageType }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // State for dropdown menu
    const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Get current session ID from URL if it exists (similar to Sidebar logic)
    const currentSessionId = React.useMemo(() => {
        const match = location.pathname.match(/\/chat\/(\d+)/);
        return match ? match[1] : null;
    }, [location.pathname]);
    
    // Xử lý cuộn đến section khi URL có fragment
    useEffect(() => {
        if (location.hash) {
            const sectionId = location.hash.substring(1); // Loại bỏ dấu # từ hash
            const element = document.getElementById(sectionId);
            if (element) {
                // Thêm độ trễ nhỏ để đảm bảo DOM đã tải hoàn toàn
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }
    }, [location.hash]);

    // Hàm điều hướng đến section với hiệu ứng trượt
    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            // Cập nhật URL fragment mà không reload trang
            window.history.pushState(null, '', `#${sectionId}`);
        } else if (location.pathname !== '/') {
            // Nếu không ở trang chủ, điều hướng về trang chủ với fragment
            navigate(`/#${sectionId}`);
        }
    };

    // Placeholder for user information, replace with actual auth context or props
    const user = isLoggedIn ? { avatar: AvatarIcon } : null; // Using SVG component

    const handleLogout = () => {
        // Add logout logic here
        console.log('User logged out');
        navigate('/login');
    };

    // Handler functions for dropdown menu
    const handleMoreOptionsClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsMoreOptionsOpen(!isMoreOptionsOpen);
    };

    const handleRename = () => {
        console.log('Rename functionality - to be implemented');
        setIsMoreOptionsOpen(false);
        // Future implementation: Show a modal or inline edit for renaming
    };

    const handleDelete = () => {
        if (!currentSessionId) {
            console.warn('No current session ID found for deletion');
            return;
        }
        setIsDeleteModalOpen(true);
        setIsMoreOptionsOpen(false);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
    };

    const handleConfirmDelete = async () => {
        if (currentSessionId) {
            try {
                await apiClient.delete(`/chat/sessions/${currentSessionId}`);
                // Navigate to home after successful deletion
                navigate('/home');
            } catch (error) {
                console.error("Failed to delete chat:", error);
                alert("Không thể xóa đoạn chat. Vui lòng thử lại sau.");
            } finally {
                setIsDeleteModalOpen(false);
            }
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setIsMoreOptionsOpen(false);
        };

        if (isMoreOptionsOpen) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isMoreOptionsOpen]);

    const renderLogo = () => (
        <Link to="/home" className="topbar-logo">
            <span className="logo-visamade">visamade</span>
            <span className="logo-easy">easy</span>
        </Link>
    );

    // Chuẩn bị classes cho thanh topbar
    const getTopBarClasses = (baseClass) => {
        return `topbar ${baseClass}`;
    };

    // Render the main TopBar content
    let topBarContent;

    if (!isLoggedIn) {
        if (pageType === 'in-chat') {
            topBarContent = (
                <nav className={getTopBarClasses('topbar-not-logged-in-chat')}>
                    <div className="topbar-left">
                        <button className="topbar-icon-button">
                            <EditIcon className="topbar-icon" />
                        </button>
                        {renderLogo()}
                    </div>
                    <div className="topbar-center">
                        <Link to="/" className="topbar-link">Trang chủ</Link>
                        <Link to="/chatbot" className="topbar-link">Chatbot</Link>
                    </div>
                    <div className="topbar-right">
                        <Link to="/login" className="topbar-button topbar-button-login">Đăng nhập</Link>
                        <Link to="/register" className="topbar-button topbar-button-register">Đăng ký</Link>
                    </div>
                </nav>
            );
        } else if (pageType === 'started') {
            topBarContent = (
                <nav className={getTopBarClasses('topbar-not-logged-in-started')}>
                    <div className="topbar-left">
                        {renderLogo()}
                    </div>
                    <div className="topbar-center">
                        <Link to="/" className="topbar-link">Trang chủ</Link>
                        <Link to="/chatbot" className="topbar-link">Chatbot</Link>
                    </div>
                    <div className="topbar-right">
                        <Link to="/login" className="topbar-button topbar-button-login-alt">Đăng nhập</Link>
                        <Link to="/register" className="topbar-button topbar-button-register-alt">Đăng ký</Link>
                    </div>
                </nav>
            );
        } else {
            topBarContent = (
                <nav className={getTopBarClasses('topbar-not-logged-in-default')}>
                    <div className="topbar-left">
                        {renderLogo()}
                    </div>
                    <div className="topbar-center">
                        <button onClick={() => scrollToSection('features')} className="topbar-link">Tính năng</button>
                        <button onClick={() => scrollToSection('about')} className="topbar-link">Về chúng tôi</button>
                        <button onClick={() => scrollToSection('faq')} className="topbar-link">FAQs</button>
                    </div>
                    <div className="topbar-right">
                        <Link to="/login" className="topbar-button topbar-button-login">Đăng nhập</Link>
                        <Link to="/register" className="topbar-button topbar-button-register">Đăng ký</Link>
                    </div>
                </nav>
            );
        }
    } else {
        if (pageType === 'in-chat') {
            topBarContent = (
                <nav className={getTopBarClasses('topbar-logged-in-chat')}>
                    <div className="topbar-left">
                        {renderLogo()}
                    </div>
                    <div className="topbar-right">
                        <button className="topbar-button topbar-button-share">
                            <ShareIcon className="topbar-icon" />
                            Chia sẻ
                        </button>
                        {currentSessionId && (
                            <div className="topbar-more-options-container">
                                <button className="topbar-icon-button" onClick={handleMoreOptionsClick}>
                                    <MoreIcon className="topbar-icon" />
                                </button>
                                {isMoreOptionsOpen && (
                                    <div className="topbar-more-options-dropdown">
                                        <button onClick={handleRename} className="topbar-more-options-item">
                                            <img src={pencilIconSVG} alt="Rename" />
                                            Đổi tên
                                        </button>
                                        <button onClick={handleDelete} className="topbar-more-options-item topbar-more-options-item-delete">
                                            <img src={trashIconSVG} alt="Delete" />
                                            Xóa
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        <user.avatar className="topbar-avatar" onClick={handleLogout} />
                    </div>
                </nav>
            );
        } else {
            topBarContent = (
                <nav className={getTopBarClasses('topbar-logged-in-default')}>
                    <div className="topbar-left">
                        {renderLogo()}
                    </div>
                    <div className="topbar-right">
                        <user.avatar className="topbar-avatar" onClick={handleLogout} />
                    </div>
                </nav>
            );
        }
    }

    return (
        <>
            {topBarContent}

            {/* Confirmation Modal for delete functionality */}
            {isDeleteModalOpen && (
                <ConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={handleCloseDeleteModal}
                    onConfirm={handleConfirmDelete}
                    title="Xác nhận xóa đoạn chat"
                >
                    <p>Bạn có chắc chắn muốn xóa đoạn chat này? Hành động này không thể hoàn tác.</p>
                </ConfirmationModal>
            )}
        </>
    );
};

export default TopBar;
