/**
 * Chart Data Calculator Utility
 * Provides functions to calculate and format data for Chart.js consumption
 * Requirements: 15.1, 15.2, 15.5
 */

/**
 * Calculate weekly trend data (past 7 days)
 * Aggregates exercise or learning data by date for the past week
 * 
 * @param {Array} activities - Array of activity objects with date and duration properties
 * @param {string} type - Activity type ('exercise' | 'learning')
 * @returns {Object} Object with labels, values, and dates arrays formatted for Chart.js
 * 
 * Requirements: 15.1, 15.5
 */
function calculateWeeklyTrend(activities, type = 'exercise') {
    const today = new Date();
    const weekData = [];
    const dates = [];
    const labels = [];
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    // Get data for the past 7 days (including today)
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = formatDate(date);
        
        dates.push(dateStr);
        labels.push(weekdays[date.getDay()]);
        
        // Calculate total duration for this date
        const duration = aggregateDurationByDate(activities, dateStr);
        weekData.push(duration);
    }

    return {
        labels: labels,           // Day names for x-axis
        values: weekData,         // Duration values for y-axis
        dates: dates,             // ISO date strings for reference
        type: type,               // Activity type
        period: 'weekly'          // Period identifier
    };
}

/**
 * Calculate monthly trend data (past 30 days)
 * Aggregates exercise or learning data by date for the past month
 * 
 * @param {Array} activities - Array of activity objects with date and duration properties
 * @param {string} type - Activity type ('exercise' | 'learning')
 * @returns {Object} Object with labels, values, and dates arrays formatted for Chart.js
 * 
 * Requirements: 15.2, 15.5
 */
function calculateMonthlyTrend(activities, type = 'exercise') {
    const today = new Date();
    const monthData = [];
    const dates = [];
    const labels = [];

    // Get data for the past 30 days (including today)
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = formatDate(date);
        
        dates.push(dateStr);
        
        // Format label as MM/DD
        const label = `${date.getMonth() + 1}/${date.getDate()}`;
        labels.push(label);
        
        // Calculate total duration for this date
        const duration = aggregateDurationByDate(activities, dateStr);
        monthData.push(duration);
    }

    return {
        labels: labels,           // Date labels for x-axis (MM/DD format)
        values: monthData,        // Duration values for y-axis
        dates: dates,             // ISO date strings for reference
        type: type,               // Activity type
        period: 'monthly'         // Period identifier
    };
}

/**
 * Aggregate activity duration by specific date
 * Filters activities for a given date and sums their durations
 * 
 * @param {Array} activities - Array of activity objects
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {number} Total duration in minutes for the specified date
 * 
 * Requirements: 15.5
 */
function aggregateDurationByDate(activities, dateStr) {
    if (!Array.isArray(activities)) {
        return 0;
    }

    // Filter activities for the specific date
    const dayActivities = activities.filter(activity => {
        return activity.date === dateStr;
    });

    // Sum up all durations for that day
    const totalDuration = dayActivities.reduce((sum, activity) => {
        const duration = activity.duration || 0;
        return sum + duration;
    }, 0);

    return totalDuration;
}

/**
 * Format date to YYYY-MM-DD string
 * Converts a Date object to ISO date string format
 * 
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date string (YYYY-MM-DD)
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Format data for Chart.js line chart
 * Converts calculated trend data into Chart.js dataset format
 * 
 * @param {Object} trendData - Trend data object from calculateWeeklyTrend or calculateMonthlyTrend
 * @param {string} label - Dataset label
 * @param {string} color - Line color (hex or rgb)
 * @returns {Object} Chart.js formatted dataset object
 * 
 * Requirements: 15.5
 */
function formatForChartJS(trendData, label, color) {
    return {
        labels: trendData.labels,
        datasets: [{
            label: label,
            data: trendData.values,
            borderColor: color,
            backgroundColor: `${color}20`, // Add transparency to background
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: color,
            pointBorderColor: '#fff',
            pointBorderWidth: 2
        }]
    };
}

/**
 * Calculate statistics from trend data
 * Computes total, average, max, and min values
 * 
 * @param {Array} values - Array of numeric values
 * @returns {Object} Statistics object with total, average, max, min
 * 
 * Requirements: 15.5
 */
function calculateStatistics(values) {
    if (!Array.isArray(values) || values.length === 0) {
        return {
            total: 0,
            average: 0,
            max: 0,
            min: 0,
            count: 0
        };
    }

    const total = values.reduce((sum, val) => sum + val, 0);
    const average = Math.round(total / values.length);
    const max = Math.max(...values);
    const min = Math.min(...values);

    return {
        total: total,
        average: average,
        max: max,
        min: min,
        count: values.length
    };
}

/**
 * Get date range for a specific period
 * Returns start and end dates for weekly or monthly periods
 * 
 * @param {string} period - Period type ('weekly' | 'monthly')
 * @returns {Object} Object with startDate and endDate
 */
function getDateRange(period) {
    const today = new Date();
    const endDate = formatDate(today);
    
    let startDate;
    if (period === 'weekly') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 6);
        startDate = formatDate(weekAgo);
    } else if (period === 'monthly') {
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 29);
        startDate = formatDate(monthAgo);
    }

    return {
        startDate: startDate,
        endDate: endDate,
        period: period
    };
}

/**
 * Filter activities by date range
 * Returns activities that fall within the specified date range
 * 
 * @param {Array} activities - Array of activity objects
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Array} Filtered activities
 */
function filterActivitiesByDateRange(activities, startDate, endDate) {
    if (!Array.isArray(activities)) {
        return [];
    }

    return activities.filter(activity => {
        return activity.date >= startDate && activity.date <= endDate;
    });
}

/**
 * Group activities by date
 * Creates a map of dates to activities
 * 
 * @param {Array} activities - Array of activity objects
 * @returns {Object} Map of date strings to arrays of activities
 */
function groupActivitiesByDate(activities) {
    if (!Array.isArray(activities)) {
        return {};
    }

    const grouped = {};
    
    activities.forEach(activity => {
        const date = activity.date;
        if (!grouped[date]) {
            grouped[date] = [];
        }
        grouped[date].push(activity);
    });

    return grouped;
}

/**
 * Calculate daily totals from grouped activities
 * Computes total duration for each date
 * 
 * @param {Object} groupedActivities - Activities grouped by date
 * @returns {Object} Map of dates to total durations
 */
function calculateDailyTotals(groupedActivities) {
    const dailyTotals = {};
    
    Object.keys(groupedActivities).forEach(date => {
        const activities = groupedActivities[date];
        const total = activities.reduce((sum, activity) => {
            return sum + (activity.duration || 0);
        }, 0);
        dailyTotals[date] = total;
    });

    return dailyTotals;
}

// Export functions for use in other modules
// Make available globally for non-module scripts
if (typeof window !== 'undefined') {
    window.chartDataCalculator = {
        calculateWeeklyTrend,
        calculateMonthlyTrend,
        aggregateDurationByDate,
        formatDate,
        formatForChartJS,
        calculateStatistics,
        getDateRange,
        filterActivitiesByDateRange,
        groupActivitiesByDate,
        calculateDailyTotals
    };
}

// Also export for ES6 modules (only if in module context)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateWeeklyTrend,
        calculateMonthlyTrend,
        aggregateDurationByDate,
        formatDate,
        formatForChartJS,
        calculateStatistics,
        getDateRange,
        filterActivitiesByDateRange,
        groupActivitiesByDate,
        calculateDailyTotals
    };
}
