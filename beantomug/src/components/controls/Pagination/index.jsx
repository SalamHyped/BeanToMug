import React from 'react';
import styles from './pagination.module.css';

const Pagination = ({
    currentPage,
    totalPages,
    totalCount,
    pageSize,
    onPageChange,
    onPageSizeChange,
    showPageSizeSelector = true,
    showPageInfo = true,
    className = '',
    variant = 'default' // 'default', 'compact', 'minimal'
}) => {
    // Don't render if only one page
    if (totalPages <= 1) return null;

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            onPageChange(newPage);
        }
    };

    const handlePageSizeChange = (newPageSize) => {
        if (onPageSizeChange) {
            onPageSizeChange(parseInt(newPageSize));
        }
    };

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        
        if (totalPages <= maxVisible) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show smart range around current page
            let start = Math.max(1, currentPage - 2);
            let end = Math.min(totalPages, start + maxVisible - 1);
            
            // Adjust start if we're near the end
            if (end === totalPages) {
                start = Math.max(1, end - maxVisible + 1);
            }
            
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
        }
        
        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className={`${styles.pagination} ${styles[variant]} ${className}`}>
            {/* Page Size Selector */}
            {showPageSizeSelector && onPageSizeChange && (
                <div className={styles.pageSizeSection}>
                    <label htmlFor="pageSize" className={styles.pageSizeLabel}>
                        Show:
                    </label>
                    <select
                        id="pageSize"
                        value={pageSize}
                        onChange={(e) => handlePageSizeChange(e.target.value)}
                        className={styles.pageSizeSelect}
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            )}

            {/* Page Info */}
            {showPageInfo && (
                <div className={styles.pageInfo}>
                    <span className={styles.pageInfoText}>
                        Page {currentPage} of {totalPages}
                    </span>
                    {totalCount > 0 && (
                        <span className={styles.totalInfo}>
                            ({totalCount} total items)
                        </span>
                    )}
                </div>
            )}

            {/* Navigation Controls */}
            <div className={styles.navigation}>
                {/* Previous Button */}
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className={`${styles.navButton} ${styles.prevButton} ${
                        currentPage <= 1 ? styles.disabled : ''
                    }`}
                    aria-label="Previous page"
                >
                    ← Previous
                </button>

                {/* Page Numbers */}
                <div className={styles.pageNumbers}>
                    {/* First page if not in range */}
                    {pageNumbers[0] > 1 && (
                        <>
                            <button
                                onClick={() => handlePageChange(1)}
                                className={styles.pageNumber}
                            >
                                1
                            </button>
                            {pageNumbers[0] > 2 && (
                                <span className={styles.ellipsis}>...</span>
                            )}
                        </>
                    )}

                    {/* Page numbers */}
                    {pageNumbers.map((pageNum) => (
                        <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`${styles.pageNumber} ${
                                pageNum === currentPage ? styles.active : ''
                            }`}
                        >
                            {pageNum}
                        </button>
                    ))}

                    {/* Last page if not in range */}
                    {pageNumbers[pageNumbers.length - 1] < totalPages && (
                        <>
                            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                                <span className={styles.ellipsis}>...</span>
                            )}
                            <button
                                onClick={() => handlePageChange(totalPages)}
                                className={styles.pageNumber}
                            >
                                {totalPages}
                            </button>
                        </>
                    )}
                </div>

                {/* Next Button */}
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className={`${styles.navButton} ${styles.nextButton} ${
                        currentPage >= totalPages ? styles.disabled : ''
                    }`}
                    aria-label="Next page"
                >
                    Next →
                </button>
            </div>
        </div>
    );
};

export default Pagination; 