import React from 'react';

const SearchBar = ({ value, onChange, placeholder }) => {
    return (
        <div className="search-bar">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="9" cy="9" r="6" stroke="#66758A" strokeWidth="1.8" fill="none" />
                <line x1="13.5" y1="13.5" x2="17.5" y2="17.5" stroke="#66758A" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
                type="text"
                className="search-input"
                placeholder={placeholder || "Search universities, city or ID ..."}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
};

export default SearchBar;
