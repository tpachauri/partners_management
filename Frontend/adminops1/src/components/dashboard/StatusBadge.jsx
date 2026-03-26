import React from 'react';

const statusConfig = {
    'IN PROGRESS': { bg: '#FEF3C6', color: '#973C00' },
    'DRAFT': { bg: '#F1F5F9', color: '#45556C' },
    'LIVE': { bg: '#D0FAE5', color: '#496045' },
};

const StatusBadge = ({ status }) => {
    const config = statusConfig[status] || statusConfig['DRAFT'];
    return (
        <span
            className="status-badge"
            style={{ background: config.bg, color: config.color }}
        >
            {status}
        </span>
    );
};

export default StatusBadge;
