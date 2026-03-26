import React from 'react';

const Pagination = ({ currentPage, totalPages, totalResults, perPage, onPageChange }) => {
    const startItem = (currentPage - 1) * perPage + 1;
    const endItem = Math.min(currentPage * perPage, totalResults);

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        for (let i = 1; i <= Math.min(maxVisible, totalPages); i++) {
            pages.push(i);
        }
        if (totalPages > maxVisible + 1) {
            pages.push('...');
        }
        if (totalPages > maxVisible) {
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="pagination">
            <span className="pagination-info">
                SHOWING {startItem} TO {endItem} OF {totalResults} RESULTS
            </span>
            <div className="pagination-controls">
                <button
                    className="pagination-arrow"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M14 7L9 12L14 17" stroke={currentPage === 1 ? '#AAB4C1' : '#000'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <div className="pagination-pages">
                    {getPageNumbers().map((page, idx) => (
                        <button
                            key={idx}
                            className={`pagination-page ${page === currentPage ? 'active' : ''} ${page === '...' ? 'dots' : ''}`}
                            onClick={() => typeof page === 'number' && onPageChange(page)}
                            disabled={page === '...'}
                        >
                            {page}
                        </button>
                    ))}
                </div>
                <button
                    className="pagination-arrow"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M10 7L15 12L10 17" stroke={currentPage === totalPages ? '#AAB4C1' : '#000'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Pagination;
