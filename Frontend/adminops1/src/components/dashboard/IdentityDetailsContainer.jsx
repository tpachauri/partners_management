import React from 'react';
import './IdentityDetailsContainer.css';

const IdentityDetailsContainer = ({
    title,
    sectionName = 'Identity',
    progress = 0,
    onBack,
    onSave,
    children
}) => {
    return (
        <div className="identity-details-wrapper">
            {/* Breadcrumb */}
            <div className="identity-breadcrumb">
                <span className="breadcrumb-root" onClick={onBack}>{sectionName}</span>
                <div className="breadcrumb-separator">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 18L15 12L9 6" stroke="#66758A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <span className="breadcrumb-current">{title}</span>
            </div>

            {/* Main Gradient Card */}
            <div className="identity-card-container">
                {/* Header inside card */}
                <div className="identity-card-header-text">
                    {sectionName} {title}
                </div>

                <div className="identity-card-divider"></div>

                {/* Content Slot (Questions) */}
                <div className="identity-card-content">
                    {children}
                </div>

                {/* Footer Buttons */}
                <div className="identity-card-footer">
                    <button className="btn-back-tables" onClick={onBack}>
                        Back to Tables
                    </button>
                    <button className="btn-save-changes" onClick={onSave}>
                        <span>Save Changes</span>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.33334 8H12.6667" stroke="white" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M8 3.33333L12.6667 8L8 12.6667" stroke="white" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Bottom Progress Bar */}
            <div className="identity-bottom-progress">
                <div className="identity-progress-track">
                    <div
                        className="identity-progress-fill"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <span className="identity-progress-text">{progress}%</span>
            </div>
        </div>
    );
};

export default IdentityDetailsContainer;
