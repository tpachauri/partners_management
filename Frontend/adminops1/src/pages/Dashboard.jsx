import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import '../components/Sidebar.css';
import './Dashboard.css';

import StatsCard from '../components/dashboard/StatsCard';
import SearchBar from '../components/dashboard/SearchBar';
import UniversityTable from '../components/dashboard/UniversityTable';
import Pagination from '../components/dashboard/Pagination';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const ITEMS_PER_PAGE = 8;

const Dashboard = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [universities, setUniversities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'

    // Fetch universities from the API on mount
    useEffect(() => {
        const fetchUniversities = async () => {
            try {
                // Try new endpoint first, fallback to old one
                let res = await fetch(`${BACKEND_URL}/api/universities/all-with-progress`);
                let usedProgressEndpoint = res.ok;
                if (!res.ok) {
                    res = await fetch(`${BACKEND_URL}/api/universities/all`);
                }
                if (res.ok) {
                    const data = await res.json();
                    // Map API data to the shape expected by UniversityTable
                    const mapped = (data || []).map(u => ({
                        id: u.id,
                        name: u.short_name || u.full_legal_name || 'Unnamed University',
                        location: [u.city, u.state].filter(Boolean).join(', ') || '-',
                        status: usedProgressEndpoint
                            ? (u.progress === 100 ? 'LIVE' : u.progress > 0 ? 'IN PROGRESS' : 'PENDING')
                            : 'PENDING',
                        progress: usedProgressEndpoint ? (u.progress || 0) : 0,
                    }));
                    setUniversities(mapped);
                }
            } catch (err) {
                console.error('Error fetching universities:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchUniversities();
    }, []);

    // Dynamic stats
    const totalUniversities = universities.length;
    const pendingVerification = universities.length; // all are pending for now
    const liveOnCRM = 0;
    const inDraft = 0;

    // Filter data based on search
    const filteredData = universities.filter((uni) => {
        const q = searchQuery.toLowerCase();
        return (
            uni.name.toLowerCase().includes(q) ||
            uni.id.toLowerCase().includes(q) ||
            uni.location.toLowerCase().includes(q)
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
                            <h1 className="dashboard-title">Dashboard</h1>
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
                            <SearchBar value={searchQuery} onChange={(val) => { setSearchQuery(val); setCurrentPage(1); }} />
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

export default Dashboard;