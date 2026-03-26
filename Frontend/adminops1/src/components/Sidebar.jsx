import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ onToggle }) => {
    const navigate = useNavigate();
    const [activeItem, setActiveItem] = useState('dashboard');
    const [collapsed, setCollapsed] = useState(false);

    // Derive display name and initials from stored email
    const userEmail = localStorage.getItem('userEmail') || '';
    const getUserDisplayInfo = (email) => {
        if (!email) return { name: 'User', initials: 'U' };
        const localPart = email.split('@')[0]; // e.g. "keshav.laddha"
        const parts = localPart.split(/[._-]/).filter(Boolean); // split by . _ or -
        const name = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
        const initials = parts.map(p => p.charAt(0).toUpperCase()).slice(0, 2).join('');
        return { name, initials };
    };
    const { name: userName, initials: userInitials } = getUserDisplayInfo(userEmail);

    const [showLogoutPopup, setShowLogoutPopup] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userId');
        setShowLogoutPopup(false);
        navigate('/');
    };

    const handleDashboardClick = () => {
        setActiveItem('dashboard');
        navigate('/dashboard');
    };

    const handleToggle = () => {
        const next = !collapsed;
        setCollapsed(next);
        if (onToggle) onToggle(next);
    };

    return (
        <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            {/* Toggle Button */}
            <button className="sidebar-toggle" onClick={handleToggle} title={collapsed ? 'Expand' : 'Collapse'}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    {collapsed ? (
                        <path d="M5 3L10 7L5 11" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    ) : (
                        <path d="M9 3L4 7L9 11" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                </svg>
            </button>

            {/* Top Section */}
            <div className="sidebar-top">
                {/* Logo */}
                <div className="sidebar-logo">
                    {collapsed ? (
                        <span className="sidebar-logo-collapsed">
                            <span className="logo-u">U</span>
                            <span className="logo-a">A</span>
                        </span>

                    ) : (
                        <img src="/UniAdvantage.png" alt="UniAdvantage" />
                    )}
                </div>

                {/* Divider */}
                <div className="sidebar-divider"></div>

                {/* Nav Items */}
                <div className="sidebar-nav">
                    <div className={`sidebar-nav-item ${activeItem === 'dashboard' ? 'active' : ''}`} onClick={handleDashboardClick}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <rect x="2.5" y="2.5" width="6" height="9" fill="currentColor" />
                            <rect x="11.5" y="2.5" width="6" height="5" fill="currentColor" />
                            <rect x="2.5" y="13.5" width="6" height="4" fill="currentColor" />
                            <rect x="11.5" y="9.5" width="6" height="8" fill="currentColor" />
                        </svg>
                        <span>Dashboard</span>
                    </div>

                    {/* Dashboard Dropdown */}
                    <div className={`sidebar-nav-item ${activeItem === 'universities' ? 'active' : ''}`} onClick={() => { setActiveItem('universities'); navigate('/dashboard/university-repositories'); }}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M2 17H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M3 17V7L10 3L17 7V17" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                            <path d="M8 17V12H12V17" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                            <path d="M10 5.5V5.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <span>Universities</span>
                    </div>

                    <div className={`sidebar-nav-item ${activeItem === 'partners' ? 'active' : ''}`} onClick={() => { setActiveItem('partners'); navigate('/dashboard/partners'); }}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M14 17.5V16C14 14.6193 12.8807 13.5 11.5 13.5H5.5C4.11929 13.5 3 14.6193 3 16V17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="8.5" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M17 17.5V16C17 14.9 16.35 13.96 15.4 13.58" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M13 4.58C13.96 4.96 14.6 5.9 14.6 7C14.6 8.1 13.96 9.04 13 9.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>Partners</span>
                    </div>

                    <div className={`sidebar-nav-item ${activeItem === 'leads' ? 'active' : ''}`} onClick={() => setActiveItem('leads')}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="7" cy="7" r="3" fill="currentColor" />
                            <circle cx="14" cy="7" r="2.5" fill="currentColor" />
                            <path d="M1 16.5C1 13.5 3.5 12 7 12C10.5 12 13 13.5 13 16.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                            <path d="M12 16C12 13.8 13.5 12.5 15.5 12.5C17.5 12.5 19 13.8 19 16" stroke="currentColor" strokeWidth="1.3" fill="none" />
                        </svg>
                        <span>Leads</span>
                    </div>

                    <div className={`sidebar-nav-item ${activeItem === 'payments' ? 'active' : ''}`} onClick={() => setActiveItem('payments')}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <rect x="1.5" y="4" width="17" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                            <line x1="1.5" y1="8.5" x2="18.5" y2="8.5" stroke="currentColor" strokeWidth="1.5" />
                            <rect x="4" y="11" width="5" height="2" rx="0.5" fill="currentColor" />
                        </svg>
                        <span>Payments</span>
                    </div>

                    <div className={`sidebar-nav-item ${activeItem === 'reports' ? 'active' : ''}`} onClick={() => setActiveItem('reports')}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <rect x="3" y="2.5" width="14" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                            <line x1="6" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="1.2" />
                            <line x1="6" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="1.2" />
                            <line x1="6" y1="13" x2="11" y2="13" stroke="currentColor" strokeWidth="1.2" />
                        </svg>
                        <span>Reports</span>
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="sidebar-bottom">
                <div className="sidebar-bottom-item">
                    <div className="sidebar-avatar">
                        <span>{userInitials}</span>
                    </div>
                    <span>{userName}</span>
                </div>

                <div className="sidebar-bottom-item">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                        <circle cx="10" cy="7.5" r="1" fill="currentColor" />
                        <line x1="10" y1="10" x2="10" y2="14" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                    <span>Support</span>
                </div>

                <div className="sidebar-bottom-item" onClick={() => setShowLogoutPopup(true)} style={{ cursor: 'pointer' }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M7 3H4C3.45 3 3 3.45 3 4V16C3 16.55 3.45 17 4 17H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                        <path d="M13 14L17 10L13 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="7" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span>Logout</span>
                </div>
            </div>

            {/* Logout Confirmation Popup */}
            {showLogoutPopup && (
                <>
                    <div className="logout-overlay" />
                    <div className="logout-popup">
                        <div className="logout-popup-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="#930051" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M16 17L21 12L16 7" stroke="#930051" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M21 12H9" stroke="#930051" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h3>Do you want to logout?</h3>
                        <p>You are currently logged in. Are you sure you want to sign out?</p>
                        <div className="logout-popup-actions">
                            <button className="logout-btn-cancel" onClick={() => setShowLogoutPopup(false)}>Cancel</button>
                            <button className="logout-btn-confirm" onClick={handleLogout}>Logout</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Sidebar;
