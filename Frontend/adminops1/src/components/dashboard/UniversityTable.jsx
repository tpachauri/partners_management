import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import ProgressBar from './ProgressBar';

const UniversityTable = ({ data, sortOrder, onSortChange, startIndex = 0 }) => {
    const navigate = useNavigate();
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowSortDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="table-wrapper">
            {/* Table Header */}
            <div className="table-header">
                <div className="table-col" style={{ width: '6%', minWidth: '45px' }}>SR NO</div>
                <div className="table-col col-name">UNIVERSITY NAME</div>
                <div className="table-col col-id" style={{ flex: 1.5 }}>UNIVERSITY ID</div>
                <div className="table-col col-status">STATUS</div>
                <div className="table-col col-progress" ref={dropdownRef} style={{ position: 'relative', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        PROGRESS
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                            <path d={sortOrder === 'desc' ? "M3 5L7 9L11 5" : "M3 9L7 5L11 9"} stroke="#66758A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </span>

                    {/* Sort Dropdown */}
                    {showSortDropdown && (
                        <div style={{
                            position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                            background: '#fff', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                            border: '1px solid #E8E8E8', zIndex: 100, minWidth: '150px',
                            overflow: 'hidden',
                        }}>
                            <div
                                style={{
                                    padding: '10px 16px', fontFamily: 'Manrope, sans-serif', fontSize: '12px',
                                    fontWeight: sortOrder === 'desc' ? 700 : 500,
                                    color: sortOrder === 'desc' ? '#930051' : '#333',
                                    background: sortOrder === 'desc' ? 'rgba(147,0,81,0.06)' : 'transparent',
                                    cursor: 'pointer', transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => { if (sortOrder !== 'desc') e.currentTarget.style.background = '#F5F5F5'; }}
                                onMouseLeave={e => { if (sortOrder !== 'desc') e.currentTarget.style.background = 'transparent'; }}
                                onClick={(e) => { e.stopPropagation(); onSortChange('desc'); setShowSortDropdown(false); }}
                            >
                                ↓ Descending
                            </div>
                            <div style={{ height: '1px', background: '#F0F0F0' }} />
                            <div
                                style={{
                                    padding: '10px 16px', fontFamily: 'Manrope, sans-serif', fontSize: '12px',
                                    fontWeight: sortOrder === 'asc' ? 700 : 500,
                                    color: sortOrder === 'asc' ? '#930051' : '#333',
                                    background: sortOrder === 'asc' ? 'rgba(147,0,81,0.06)' : 'transparent',
                                    cursor: 'pointer', transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => { if (sortOrder !== 'asc') e.currentTarget.style.background = '#F5F5F5'; }}
                                onMouseLeave={e => { if (sortOrder !== 'asc') e.currentTarget.style.background = 'transparent'; }}
                                onClick={(e) => { e.stopPropagation(); onSortChange('asc'); setShowSortDropdown(false); }}
                            >
                                ↑ Ascending
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Table Rows */}
            {data.map((uni, index) => (
                <div
                    className={`table-row ${index % 2 === 0 ? 'row-light' : 'row-white'}`}
                    key={uni.id || index}
                    onClick={() => navigate(`/dashboard/university/${uni.id}`, { state: { universityData: uni } })}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="table-col" style={{ width: '6%', minWidth: '45px' }}>{startIndex + index + 1}</div>
                    <div className="table-col col-name">
                        <div className="uni-avatar">
                            <span>{uni.name.charAt(0)}</span>
                        </div>
                        <span className="uni-name">{uni.name}</span>
                    </div>
                    <div className="table-col col-id" style={{ flex: 1.5 }}>
                        <span className="uni-id">{uni.id}</span>
                    </div>
                    <div className="table-col col-status">
                        <StatusBadge status={uni.status} />
                    </div>
                    <div className="table-col col-progress">
                        <ProgressBar percent={uni.progress} />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default UniversityTable;
