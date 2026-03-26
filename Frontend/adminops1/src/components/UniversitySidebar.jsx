import React, { useState } from 'react';
import './UniversitySidebar.css';

const UniversitySidebar = ({
    university,
    activeTab,
    onTabChange,
    programs = [],
    selectedProgram,
    onProgramSelect,
    onAddProgram
}) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newProgramName, setNewProgramName] = useState('');

    const navItems = [
        { id: 'university-master', label: 'University Master', icon: <path d="M3 21H21M5 21V7H19V21M7 10H9M7 14H9M7 18H9M11 10H17M11 14H17M11 18H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /> },
        { id: 'program-master', label: 'Program Master', icon: <path d="M22 10L12 5L2 10L12 15L22 10ZM6 12V17C6 17.55 8.69 18 12 18C15.31 18 18 17.55 18 17M12 15V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /> },
        { id: 'specialization-master', label: 'Specialization Master', icon: <><path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></> },
        { id: 'offering-master', label: 'Offering Master', icon: <><path d="M4 7H20M4 12H20M4 17H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></> },
        { id: 'incentives', label: 'Incentives / Scholarships', icon: <path d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z M8.21 13.89L7 23L12 20L17 23L15.79 13.88" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /> },
        { id: 'legal', label: 'Legal/Admin', icon: <path d="M3 6H21M7 6V19M17 6V19M8 11H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /> },
        { id: 'commercials', label: 'Commercials', icon: <path d="M21 4H3C1.89543 4 1 4.89543 1 6V18C1 19.1046 1.89543 20 3 20H21C22.1046 20 23 19.1046 23 18V6C23 4.89543 22.1046 4 21 4Z M1 10H23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /> },
        { id: 'lead', label: 'Lead', icon: <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /> },
        { id: 'live-source-queue', label: 'Live Source Queue', icon: <><path d="M4 6H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M4 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M4 18H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><circle cx="19" cy="15" r="4" stroke="currentColor" strokeWidth="1.5" /><path d="M19 13V15L20 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></> },
    ];

    const getName = (name) => name || 'University';
    const getId = (id) => id || 'ID: N/A';
    const getInitial = (name) => name ? name.charAt(0) : 'U';

    const handleSaveProgram = () => {
        if (newProgramName.trim()) {
            onAddProgram && onAddProgram(newProgramName.trim());
            setNewProgramName('');
            setShowAddForm(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSaveProgram();
        if (e.key === 'Escape') { setShowAddForm(false); setNewProgramName(''); }
    };

    return (
        <div className="university-sidebar">
            {/* Header */}
            <div className="uni-sidebar-header">
                <div className="uni-sidebar-logo" style={{ background: '#F2F2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold', color: '#66758A' }}>
                    {getInitial(university?.name)}
                </div>
                <div className="uni-sidebar-info">
                    <span className="uni-sidebar-name" title={getName(university?.name)}>{getName(university?.name)}</span>
                    <span className="uni-sidebar-id">{getId(university?.id)}</span>
                </div>
            </div>

            <div className="uni-sidebar-divider"></div>

            {/* Nav Container */}
            <div className="uni-sidebar-nav-container">
                <div className="uni-sidebar-subheader">
                    SUB GROUPS
                </div>
                <div className="uni-sidebar-nav-group">
                    {navItems.map((item) => (
                        <React.Fragment key={item.id}>
                            <div
                                className={`uni-sidebar-item ${activeTab === item.id ? 'active' : ''}`}
                                onClick={() => onTabChange && onTabChange(item.id)}
                            >
                                <div className="uni-sidebar-item-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        {item.icon}
                                    </svg>
                                </div>
                                <span className="uni-sidebar-item-text">
                                    {item.label}
                                </span>
                                {activeTab === item.id && (
                                    <div className="uni-sidebar-item-arrow">
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                            <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                )}
                            </div>


                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UniversitySidebar;
