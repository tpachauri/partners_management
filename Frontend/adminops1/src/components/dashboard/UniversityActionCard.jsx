import React from 'react';
import './UniversityActionCard.css';

const UniversityActionCard = ({ title, subtitle, status, progress, icon, onClick }) => {
    return (
        <div className="uni-action-card" onClick={onClick}>
            {/* Header */}
            <div className="uni-card-header">
                <div className="uni-card-icon-box">
                    <div className="uni-card-icon">
                        {/* Render customized icon or default vector */}
                        {icon || (
                            <svg width="100%" height="100%" viewBox="0 0 20 20" fill="none">
                                <rect x="3.5" y="3.5" width="13" height="13" stroke="currentColor" strokeWidth="1.66" />
                                <line x1="3.5" y1="10" x2="16.5" y2="10" stroke="currentColor" strokeWidth="1.66" />
                                <line x1="10" y1="3.5" x2="10" y2="16.5" stroke="currentColor" strokeWidth="1.66" />
                            </svg>
                        )}
                    </div>
                </div>
                <div className="uni-card-status">
                    <span className="uni-card-status-text">{status || 'Offline'}</span>
                </div>
            </div>

            {/* Body */}
            <div className="uni-card-body">
                <span className="uni-card-title">{title}</span>
                <span className="uni-card-subtitle">{subtitle}</span>
            </div>

            {/* Footer / Progress */}
            <div className="uni-card-footer">
                <div className="uni-card-progress-track">
                    <div
                        className="uni-card-progress-fill"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <span className="uni-card-progress-text">{progress}%</span>
            </div>
        </div>
    );
};

export default UniversityActionCard;
