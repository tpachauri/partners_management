import React from 'react';

const StatsCard = ({ label, value }) => {
    return (
        <div className="stats-card">
            <span className="stats-card-label">{label}</span>
            <span className="stats-card-value">{value}</span>
        </div>
    );
};

export default StatsCard;
