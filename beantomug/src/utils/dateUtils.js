/**
 * Shared date utility functions for timezone handling
 * Backend sends dates as ISO strings with Z (UTC), we parse and convert to local time
 */

/**
 * Parse date value as UTC (backend sends ISO strings with Z)
 * @param {string|Date} dateValue - Date string or Date object
 * @returns {Date|null} Parsed Date object or null if invalid
 */
export const parseDateAsUTC = (dateValue) => {
    if (!dateValue) return null;
    try {
        if (dateValue instanceof Date) {
            return dateValue;
        }
        // Ensure string is treated as UTC
        let dateStr = String(dateValue);
        // If it doesn't end with Z and is ISO format, add Z to indicate UTC
        if (dateStr.includes('T') && !dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 19)) {
            dateStr += 'Z';
        }
        // If it's MySQL format "YYYY-MM-DD HH:MM:SS", convert to ISO with Z
        else if (dateStr.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
            dateStr = dateStr.replace(' ', 'T') + 'Z';
        }
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
    } catch (e) {
        return null;
    }
};

/**
 * Format date in local timezone
 * @param {string|Date} dateValue - Date string or Date object
 * @returns {string} Formatted date string or empty string
 */
export const formatLocalDate = (dateValue) => {
    const date = parseDateAsUTC(dateValue);
    return date ? date.toLocaleDateString() : '';
};

/**
 * Format time in local timezone
 * @param {string|Date} dateValue - Date string or Date object
 * @param {Object} options - toLocaleTimeString options
 * @returns {string} Formatted time string or empty string
 */
export const formatLocalTime = (dateValue, options = {}) => {
    const date = parseDateAsUTC(dateValue);
    if (!date) return '';
    const defaultOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    return date.toLocaleTimeString('en-US', { ...defaultOptions, ...options });
};

/**
 * Format date and time in local timezone
 * @param {string|Date} dateValue - Date string or Date object
 * @returns {string} Formatted date and time string or empty string
 */
export const formatLocalDateTime = (dateValue) => {
    const date = parseDateAsUTC(dateValue);
    return date ? date.toLocaleString() : '';
};
