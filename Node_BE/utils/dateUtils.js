/**
 * Shared date utility functions for backend
 * Formats dates as ISO strings with UTC indicator for frontend consumption
 */

/**
 * Format Unix timestamp as ISO string with UTC indicator
 * UNIX_TIMESTAMP returns seconds since epoch (UTC) - timezone-independent and reliable
 * 
 * @param {number|string|null} unixTimestamp - Unix timestamp in seconds
 * @returns {string|null} ISO string with Z (UTC indicator) or null if invalid
 */
function formatDateForResponse(unixTimestamp) {
    if (unixTimestamp === null || unixTimestamp === undefined) return null;
    
    // Convert to number (handles both string and number from mysql2)
    const timestamp = Number(unixTimestamp);
    if (isNaN(timestamp) || timestamp <= 0) return null;
    
    // Convert seconds to milliseconds and create Date
    const date = new Date(timestamp * 1000);
    if (isNaN(date.getTime())) return null;
    
    // Return ISO string with Z (UTC indicator)
    return date.toISOString();
}

module.exports = {
    formatDateForResponse
};
