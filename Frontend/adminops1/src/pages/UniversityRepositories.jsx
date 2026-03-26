import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../components/Sidebar.css';
import './Dashboard.css';

import StatsCard from '../components/dashboard/StatsCard';
import SearchBar from '../components/dashboard/SearchBar';
import UniversityTable from '../components/dashboard/UniversityTable';
import Pagination from '../components/dashboard/Pagination';

const ITEMS_PER_PAGE = 8;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

const UniversityRepositories = () => {
    const navigate = useNavigate();
    const [universityData, setUniversityData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [sortOrder, setSortOrder] = useState('desc');

    // Fetch data from API
    useEffect(() => {
        fetchUniversities();
    }, []);

    const fetchUniversities = async () => {
        try {
            // Try new endpoint first, fallback to old one
            let response = await fetch(`${BACKEND_URL}/api/universities/all-with-progress`);
            let usedProgressEndpoint = response.ok;
            if (!response.ok) {
                response = await fetch(`${BACKEND_URL}/api/universities/all`);
            }
            if (response.ok) {
                const data = await response.json();
                // Normalize API data to match table component expectations
                const normalized = data.map(uni => ({
                    ...uni,
                    name: uni.short_name || uni.full_legal_name || uni.name || 'Unnamed',
                    location: [uni.city, uni.state].filter(Boolean).join(', ') || '-',
                    status: usedProgressEndpoint
                        ? (uni.progress === 100 ? 'LIVE' : uni.progress > 0 ? 'IN PROGRESS' : 'PENDING')
                        : 'IN PROGRESS',
                    progress: usedProgressEndpoint ? (uni.progress || 0) : 0,
                }));
                setUniversityData(normalized);
            } else {
                console.error('Failed to fetch universities');
            }
        } catch (error) {
            console.error('Error fetching universities:', error);
        } finally {
            setLoading(false);
        }
    };

    // Dynamic stats
    const totalUniversities = universityData.length;
    const pendingVerification = universityData.length;
    const liveOnCRM = 0;
    const inDraft = 0;

    // Filter data based on search
    const filteredData = universityData.filter((uni) => {
        const q = searchQuery.toLowerCase();
        return (
            uni.name.toLowerCase().includes(q) ||
            (uni.id && uni.id.toLowerCase().includes(q)) ||
            (uni.location && uni.location.toLowerCase().includes(q))
        );
    });

    // Sort filtered data by progress
    const sortedData = [...filteredData].sort((a, b) =>
        sortOrder === 'desc' ? b.progress - a.progress : a.progress - b.progress
    );

    const totalResults = sortedData.length;
    const totalPages = Math.max(1, Math.ceil(totalResults / ITEMS_PER_PAGE));
    const paginatedData = sortedData.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
            <div className={`dashboard-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <div className="dashboard-main">
                    {/* Header */}
                    <div className="dashboard-header">
                        <div className="dashboard-header-left">
                            <span className="dashboard-subtitle">Manage university verifications</span>
                            <h1 className="dashboard-title">University Repositories</h1>
                        </div>
                        <div className="stats-row">
                            <StatsCard label="Total Universities" value={String(totalUniversities)} />
                            <StatsCard label="Pending Verification" value={String(pendingVerification)} />
                            <StatsCard label="Live on CRM" value={String(liveOnCRM)} />
                            <StatsCard label="In Draft" value={String(inDraft)} />
                        </div>
                    </div>

                    {/* Queue Section */}
                    <div className="queue-container">
                        <div className="queue-header">
                            <div className="queue-title-section">
                                <svg className="queue-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <rect x="2" y="4" width="3" height="7" fill="#930051" />
                                    <rect x="10.5" y="4" width="3" height="7" fill="#930051" />
                                    <rect x="2" y="17" width="20" height="3" fill="#930051" />
                                    <rect x="19" y="4" width="3" height="7" fill="#930051" />
                                    <rect x="2" y="2" width="20" height="3" fill="#930051" />
                                </svg>
                                <span className="queue-title">University Queue</span>
                            </div>
                            <div className="queue-header-right">
                                <SearchBar value={searchQuery} onChange={(val) => { setSearchQuery(val); setCurrentPage(1); }} />
                                <button
                                    className="add-university-btn"
                                    onClick={() => navigate('/dashboard/add-university')}
                                >
                                    + Add New University
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'Manrope, sans-serif', color: '#66758A', fontSize: '14px' }}>
                                Loading universities...
                            </div>
                        ) : (
                            <UniversityTable data={paginatedData} sortOrder={sortOrder} onSortChange={setSortOrder} startIndex={(currentPage - 1) * ITEMS_PER_PAGE} />
                        )}

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages > 10 ? 10 : totalPages}
                            totalResults={totalResults}
                            perPage={ITEMS_PER_PAGE}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UniversityRepositories;
