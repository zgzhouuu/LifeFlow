/**
 * Chart.js Configuration Utility
 * Provides common chart settings and configurations for LifeFlow
 */

class ChartConfig {
    /**
     * Get default chart options
     * @param {Object} customOptions - Custom options to merge with defaults
     * @returns {Object} Chart options
     */
    static getDefaultOptions(customOptions = {}) {
        const defaults = {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
                            size: 12
                        },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                        size: 13,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 12
                    },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        };

        return this.deepMerge(defaults, customOptions);
    }

    /**
     * Get line chart configuration for exercise trends
     * @param {Array} labels - Chart labels (dates)
     * @param {Array} data - Chart data values
     * @param {Object} options - Additional options
     * @returns {Object} Chart configuration
     */
    static getExerciseLineChart(labels, data, options = {}) {
        return {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: options.label || '运动时长（分钟）',
                    data: data,
                    borderColor: '#4CAF50',
                    backgroundColor: (context) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                        gradient.addColorStop(0, 'rgba(76, 175, 80, 0.3)');
                        gradient.addColorStop(1, 'rgba(76, 175, 80, 0.0)');
                        return gradient;
                    },
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#4CAF50',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#4CAF50',
                    pointHoverBorderWidth: 3,
                    segment: {
                        borderColor: (ctx) => {
                            // Highlight segments with data
                            const prev = ctx.p0.parsed.y;
                            const curr = ctx.p1.parsed.y;
                            if (prev === 0 && curr === 0) {
                                return 'rgba(76, 175, 80, 0.3)';
                            }
                            return '#4CAF50';
                        },
                        borderWidth: (ctx) => {
                            const prev = ctx.p0.parsed.y;
                            const curr = ctx.p1.parsed.y;
                            if (prev === 0 && curr === 0) {
                                return 1;
                            }
                            return 3;
                        }
                    }
                }]
            },
            options: this.getDefaultOptions({
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '时长（分钟）',
                            font: {
                                size: 12,
                                weight: 'bold'
                            },
                            color: '#2C3E50'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            font: {
                                size: 11
                            },
                            color: '#7F8C8D',
                            padding: 8
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            font: {
                                size: 11
                            },
                            color: '#7F8C8D',
                            padding: 8
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        align: 'end',
                        labels: {
                            boxWidth: 12,
                            boxHeight: 12,
                            padding: 15,
                            font: {
                                size: 12,
                                weight: '500'
                            },
                            color: '#2C3E50',
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(44, 62, 80, 0.95)',
                        titleFont: {
                            size: 13,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: true,
                        borderColor: '#4CAF50',
                        borderWidth: 2
                    }
                },
                ...options
            })
        };
    }

    /**
     * Get line chart configuration for learning trends
     * @param {Array} labels - Chart labels (dates)
     * @param {Array} data - Chart data values
     * @param {Object} options - Additional options
     * @returns {Object} Chart configuration
     */
    static getLearningLineChart(labels, data, options = {}) {
        return {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: options.label || '学习时长（分钟）',
                    data: data,
                    borderColor: '#2196F3',
                    backgroundColor: (context) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                        gradient.addColorStop(0, 'rgba(33, 150, 243, 0.3)');
                        gradient.addColorStop(1, 'rgba(33, 150, 243, 0.0)');
                        return gradient;
                    },
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#2196F3',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#2196F3',
                    pointHoverBorderWidth: 3,
                    segment: {
                        borderColor: (ctx) => {
                            // Highlight segments with data
                            const prev = ctx.p0.parsed.y;
                            const curr = ctx.p1.parsed.y;
                            if (prev === 0 && curr === 0) {
                                return 'rgba(33, 150, 243, 0.3)';
                            }
                            return '#2196F3';
                        },
                        borderWidth: (ctx) => {
                            const prev = ctx.p0.parsed.y;
                            const curr = ctx.p1.parsed.y;
                            if (prev === 0 && curr === 0) {
                                return 1;
                            }
                            return 3;
                        }
                    }
                }]
            },
            options: this.getDefaultOptions({
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '时长（分钟）',
                            font: {
                                size: 12,
                                weight: 'bold'
                            },
                            color: '#2C3E50'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            font: {
                                size: 11
                            },
                            color: '#7F8C8D',
                            padding: 8
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            font: {
                                size: 11
                            },
                            color: '#7F8C8D',
                            padding: 8
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        align: 'end',
                        labels: {
                            boxWidth: 12,
                            boxHeight: 12,
                            padding: 15,
                            font: {
                                size: 12,
                                weight: '500'
                            },
                            color: '#2C3E50',
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(44, 62, 80, 0.95)',
                        titleFont: {
                            size: 13,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: true,
                        borderColor: '#2196F3',
                        borderWidth: 2
                    }
                },
                ...options
            })
        };
    }

    /**
     * Get bar chart configuration
     * @param {Array} labels - Chart labels
     * @param {Array} data - Chart data values
     * @param {String} color - Bar color
     * @param {Object} options - Additional options
     * @returns {Object} Chart configuration
     */
    static getBarChart(labels, data, color = '#667eea', options = {}) {
        return {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: options.label || '数据',
                    data: data,
                    backgroundColor: color,
                    borderColor: color,
                    borderWidth: 0,
                    borderRadius: 8,
                    barThickness: 'flex',
                    maxBarThickness: 40
                }]
            },
            options: this.getDefaultOptions({
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: {
                                size: 11
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 11
                            }
                        }
                    }
                },
                ...options
            })
        };
    }

    /**
     * Get doughnut chart configuration
     * @param {Array} labels - Chart labels
     * @param {Array} data - Chart data values
     * @param {Array} colors - Slice colors
     * @param {Object} options - Additional options
     * @returns {Object} Chart configuration
     */
    static getDoughnutChart(labels, data, colors = [], options = {}) {
        const defaultColors = [
            '#FF8C42', // Life
            '#4CAF50', // Exercise
            '#2196F3', // Learning
            '#F39C12', // Warning
            '#E74C3C', // Danger
            '#9B59B6', // Purple
            '#1ABC9C'  // Teal
        ];

        return {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.length > 0 ? colors : defaultColors.slice(0, data.length),
                    borderWidth: 2,
                    borderColor: '#fff',
                    hoverOffset: 10
                }]
            },
            options: this.getDefaultOptions({
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                ...options
            })
        };
    }

    /**
     * Color palette for different modules
     */
    static colors = {
        life: {
            primary: '#FF8C42',
            light: 'rgba(255, 140, 66, 0.1)',
            gradient: ['#FF8C42', '#FFA566']
        },
        exercise: {
            primary: '#4CAF50',
            light: 'rgba(76, 175, 80, 0.1)',
            gradient: ['#4CAF50', '#8BC34A']
        },
        learning: {
            primary: '#2196F3',
            light: 'rgba(33, 150, 243, 0.1)',
            gradient: ['#2196F3', '#64B5F6']
        },
        success: '#27AE60',
        warning: '#F39C12',
        danger: '#E74C3C',
        info: '#3498DB'
    };

    /**
     * Deep merge two objects
     * @param {Object} target - Target object
     * @param {Object} source - Source object
     * @returns {Object} Merged object
     */
    static deepMerge(target, source) {
        const output = Object.assign({}, target);
        
        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target)) {
                        Object.assign(output, { [key]: source[key] });
                    } else {
                        output[key] = this.deepMerge(target[key], source[key]);
                    }
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        
        return output;
    }

    /**
     * Check if value is an object
     * @param {*} item - Value to check
     * @returns {Boolean}
     */
    static isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    /**
     * Format date labels for charts
     * @param {Array} dates - Array of date strings
     * @param {String} format - Format type ('short', 'medium', 'long')
     * @returns {Array} Formatted labels
     */
    static formatDateLabels(dates, format = 'short') {
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

        return dates.map(dateStr => {
            const date = new Date(dateStr);
            
            switch (format) {
                case 'short':
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                case 'medium':
                    return `${months[date.getMonth()]}${date.getDate()}日`;
                case 'long':
                    return `${date.getFullYear()}年${months[date.getMonth()]}${date.getDate()}日`;
                case 'weekday':
                    return `周${weekdays[date.getDay()]}`;
                default:
                    return dateStr;
            }
        });
    }

    /**
     * Calculate statistics from data
     * @param {Array} data - Data array
     * @returns {Object} Statistics (total, average, max, min)
     */
    static calculateStats(data) {
        if (!data || data.length === 0) {
            return { total: 0, average: 0, max: 0, min: 0 };
        }

        const total = data.reduce((sum, val) => sum + val, 0);
        const average = total / data.length;
        const max = Math.max(...data);
        const min = Math.min(...data);

        return {
            total: Math.round(total * 100) / 100,
            average: Math.round(average * 100) / 100,
            max: Math.round(max * 100) / 100,
            min: Math.round(min * 100) / 100
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartConfig;
}
