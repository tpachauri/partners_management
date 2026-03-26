import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import PartnerReviewModal from '../components/PartnerReviewModal';
import '../components/Sidebar.css';
import './PartnersManagement.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const ITEMS_PER_PAGE = 10;

const PartnersManagement = () => {
    const [partners, setPartners]             = useState([]);
    const [archivedPartners, setArchivedPartners] = useState([]);
    const [activeTab, setActiveTab]           = useState('active'); // 'active' | 'rejected'
    const [loading, setLoading]               = useState(true);
    const [searchQuery, setSearchQuery]       = useState('');
    const [statusFilter, setStatusFilter]     = useState('All');
    const [currentPage, setCurrentPage]       = useState(1);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [selectedPartner, setSelectedPartner]   = useState(null);

    const fetchPartners = async () => {
        setLoading(true);
        try {
            const [activeRes, archivedRes] = await Promise.all([
                fetch(`${BACKEND_URL}/api/partners`),
                fetch(`${BACKEND_URL}/api/partners/archived`),
            ]);
            if (activeRes.ok) {
                const json = await activeRes.json();
                setPartners(json.data || []);
            }
            if (archivedRes.ok) {
                const json = await archivedRes.json();
                setArchivedPartners(json.data || []);
            }
        } catch (err) {
            console.error('Error fetching partners:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPartners(); }, []);

    // Stats (always from active list)
    const totalPartners  = partners.length;
    const blockedCount   = partners.filter(p => p.status === 'Blocked').length;
    const completedCount = partners.filter(p => p.status === 'Completed').length;
    const pendingCount   = partners.filter(p => p.status === 'Pending').length;
    const rejectedCount  = archivedPartners.length;

    // Source depends on active tab
    const sourceList = activeTab === 'rejected' ? archivedPartners : partners;

    // Filter + Search
    const filtered = sourceList.filter(p => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
            (p.auth_user_id || '').toLowerCase().includes(q) ||
            (p.partner_name || '').toLowerCase().includes(q) ||
            (p.pan_number || '').toLowerCase().includes(q) ||
            String(p.id).includes(q);
        const matchesFilter = activeTab === 'rejected' || statusFilter === 'All' || p.status === statusFilter;
        return matchesSearch && matchesFilter;
    });

    const totalResults = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalResults / ITEMS_PER_PAGE));
    const paginatedData = filtered.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Completed': return 'badge-completed';
            case 'Blocked': return 'badge-blocked';
            case 'Pending': return 'badge-pending';
            default: return 'badge-in-progress';
        }
    };

    const renderStepDots = (partner) => {
        const steps = [
            { done: partner.pan_completed, label: 'PAN' },
            { done: partner.entity_completed, label: 'Entity' },
            { done: partner.bank_completed, label: 'Bank' },
            { done: partner.agreement_completed, label: 'Agreement' },
        ];

        let foundCurrent = false;
        return (
            <div className="partners-step-indicators">
                {steps.map((s, i) => {
                    let cls = 'step-dot ';
                    if (s.done) {
                        cls += 'done';
                    } else if (!foundCurrent) {
                        cls += 'current';
                        foundCurrent = true;
                    } else {
                        cls += 'locked';
                    }
                    return <span key={i} className={cls} title={s.label}>{i + 1}</span>;
                })}
            </div>
        );
    };

    // Generate page numbers for pagination
    const renderPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

        if (start > 1) {
            pages.push(<button key={1} className="partners-pagination-page" onClick={() => handlePageChange(1)}>1</button>);
            if (start > 2) pages.push(<span key="dots-start" className="partners-pagination-page dots">…</span>);
        }
        for (let i = start; i <= end; i++) {
            pages.push(
                <button key={i} className={`partners-pagination-page ${i === currentPage ? 'active' : ''}`} onClick={() => handlePageChange(i)}>
                    {i}
                </button>
            );
        }
        if (end < totalPages) {
            if (end < totalPages - 1) pages.push(<span key="dots-end" className="partners-pagination-page dots">…</span>);
            pages.push(<button key={totalPages} className="partners-pagination-page" onClick={() => handlePageChange(totalPages)}>{totalPages}</button>);
        }
        return pages;
    };

    return (
        <>
            <Sidebar onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
            <div className={`dashboard-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <div className="partners-main">
                    {/* Header */}
                    <div className="partners-header">
                        <div className="partners-header-left">
                            <span className="partners-subtitle">Manual verification queue</span>
                            <h1 className="partners-title">Partners Management</h1>
                        </div>
                        <div className="partners-stats-row">
                            <div className="partners-stats-card">
                                <span className="partners-stats-label">Total Partners</span>
                                <span className="partners-stats-value">{totalPartners}</span>
                            </div>
                            <div className="partners-stats-card">
                                <span className="partners-stats-label">Blocked</span>
                                <span className="partners-stats-value" style={{ color: '#DC2626' }}>{blockedCount}</span>
                            </div>
                            <div className="partners-stats-card">
                                <span className="partners-stats-label">Completed</span>
                                <span className="partners-stats-value" style={{ color: '#16A34A' }}>{completedCount}</span>
                            </div>
                            <div className="partners-stats-card">
                                <span className="partners-stats-label">Pending</span>
                                <span className="partners-stats-value" style={{ color: '#CA8A04' }}>{pendingCount}</span>
                            </div>
                            <div className="partners-stats-card">
                                <span className="partners-stats-label">Rejected</span>
                                <span className="partners-stats-value" style={{ color: '#7C3AED' }}>{rejectedCount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="partners-tabs">
                        <button
                            className={`partners-tab ${activeTab === 'active' ? 'partners-tab-active' : ''}`}
                            onClick={() => { setActiveTab('active'); setCurrentPage(1); setSearchQuery(''); setStatusFilter('All'); }}
                        >
                            Active Partners
                            <span className="partners-tab-count">{partners.length}</span>
                        </button>
                        <button
                            className={`partners-tab ${activeTab === 'rejected' ? 'partners-tab-rejected-active' : ''}`}
                            onClick={() => { setActiveTab('rejected'); setCurrentPage(1); setSearchQuery(''); }}
                        >
                            Rejected
                            <span className="partners-tab-count">{archivedPartners.length}</span>
                        </button>
                    </div>

                    {/* Table Card */}
                    <div className="partners-table-container">
                        <div className="partners-table-header-bar">
                            <div className="partners-table-title-section">
                                <svg className="partners-table-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span className="partners-table-title">Partner Queue</span>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <select
                                    className="partners-filter-select"
                                    value={statusFilter}
                                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                >
                                    <option value="All">All Status</option>
                                    <option value="Blocked">Blocked</option>
                                    <option value="Pending">Pending</option>
                                    <option value="PAN Verified">PAN Verified</option>
                                    <option value="Entity Verified">Entity Verified</option>
                                    <option value="Bank Verified">Bank Verified</option>
                                    <option value="Agreement Done">Agreement Done</option>
                                    <option value="Completed">Completed</option>
                                </select>
                                <div className="partners-search-bar">
                                    <svg className="partners-search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
                                        <line x1="11" y1="11" x2="14.5" y2="14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                    </svg>
                                    <input
                                        className="partners-search-input"
                                        type="text"
                                        placeholder="Search by Partner ID or Name..."
                                        value={searchQuery}
                                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        {loading ? (
                            <div className="partners-loading">
                                <div className="partners-loading-spinner"></div>
                                Loading partners...
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="partners-empty">
                                <div className="partners-empty-icon">📋</div>
                                No partners found.
                            </div>
                        ) : (
                            <>
                                <div className="partners-table-wrapper">
                                    <div className="partners-table-head">
                                        <div className="partners-col partners-col-sno">S.No</div>
                                        <div className="partners-col partners-col-id">Partner ID</div>
                                        <div className="partners-col partners-col-name">Entity Name</div>
                                        {activeTab === 'rejected' ? (
                                            <>
                                                <div className="partners-col partners-col-reason">Rejection Reason</div>
                                                <div className="partners-col partners-col-date">Rejected On</div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="partners-col partners-col-status">Status</div>
                                                <div className="partners-col partners-col-steps">Steps</div>
                                                <div className="partners-col partners-col-action">Action</div>
                                            </>
                                        )}
                                    </div>
                                    {paginatedData.map((partner, idx) => (
                                        <div key={`${partner.id}-${partner.archived_at || ''}`} className={`partners-table-row ${idx % 2 === 0 ? 'row-light' : 'row-white'}`}>
                                            <div className="partners-col partners-col-sno">
                                                <span className="partners-text-sno">{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</span>
                                            </div>
                                            <div className="partners-col partners-col-id">
                                                <span className="partners-text-id" title={partner.auth_user_id}>{partner.auth_user_id}</span>
                                            </div>
                                            <div className="partners-col partners-col-name">
                                                <span className="partners-text-name">{partner.partner_name}</span>
                                            </div>
                                            {activeTab === 'rejected' ? (
                                                <>
                                                    <div className="partners-col partners-col-reason">
                                                        <span className="partners-rejection-reason">{partner.rejection_reason || '—'}</span>
                                                    </div>
                                                    <div className="partners-col partners-col-date">
                                                        <span className="partners-text-date">
                                                            {partner.archived_at ? new Date(partner.archived_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="partners-col partners-col-status">
                                                        <span className={`partners-status-badge ${getStatusBadgeClass(partner.status)}`}>
                                                            {partner.status}
                                                        </span>
                                                    </div>
                                                    <div className="partners-col partners-col-steps">
                                                        {renderStepDots(partner)}
                                                    </div>
                                                    <div className="partners-col partners-col-action">
                                                        <button className="partners-view-btn" onClick={() => setSelectedPartner(partner)}>View</button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                <div className="partners-pagination">
                                    <span className="partners-pagination-info">
                                        Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, totalResults)} of {totalResults} results
                                    </span>
                                    <div className="partners-pagination-controls">
                                        <button className="partners-pagination-arrow" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M10 3L5 8L10 13" stroke="#4A5666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                        <div className="partners-pagination-pages">
                                            {renderPageNumbers()}
                                        </div>
                                        <button className="partners-pagination-arrow" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M6 3L11 8L6 13" stroke="#4A5666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

        {selectedPartner && (
            <PartnerReviewModal
                partner={selectedPartner}
                onClose={() => setSelectedPartner(null)}
                onActionComplete={() => { fetchPartners(); setSelectedPartner(null); }}
            />
        )}
    </>
    );
};

export default PartnersManagement;
