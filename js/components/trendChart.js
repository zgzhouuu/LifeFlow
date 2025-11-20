/**
 * TrendChart Component
 * Displays weekly and monthly trend charts for exercise and learning activities
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6
 */

class TrendChart {
    /**
     * Create a TrendChart instance
     * @param {string} canvasId - Canvas element ID
     * @param {string} type - Chart type ('exercise' | 'learning')
     * @param {Object} storageManager - Storage manager instance
     */
    constructor(canvasId, type, storageManager) {
        this.canvasId = canvasId;
        this.type = type; // 'exercise' or 'learning'
        this.storageManager = storageManager;
        this.chart = null;
        this.currentView = 'weekly'; // 'weekly' or 'monthly'
        this.canvas = document.getElementById(canvasId);
        
        if (!this.canvas) {
            console.error(`Canvas element with id "${canvasId}" not found`);
        }
    }

    /**
     * Initialize the chart with default view
     */
    init() {
        this.renderWeeklyChart();
    }

    /**
     * Render weekly trend chart (past 7 days)
     * Requirements: 15.1, 15.2, 15.3, 15.6
     */
    renderWeeklyChart() {
        this.currentView = 'weekly';
        const trendData = this.calculateWeeklyTrend();
        
        // Check if there's any data
        const hasData = trendData.values.some(val => val > 0);
        
        // Destroy existing chart if any
        if (this.chart) {
            this.chart.destroy();
        }

        // Show empty state if no data
        if (!hasData) {
            this.showEmptyState('weekly');
            this.updateStatistics(trendData.values);
            return;
        }

        // Hide empty state if it exists
        this.hideEmptyState();

        // Get chart configuration based on type with enhanced styling
        const config = this.type === 'exercise' 
            ? ChartConfig.getExerciseLineChart(trendData.labels, trendData.values, {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                return `运动时长: ${value} 分钟`;
                            }
                        }
                    }
                }
            })
            : ChartConfig.getLearningLineChart(trendData.labels, trendData.values, {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                return `学习时长: ${value} 分钟`;
                            }
                        }
                    }
                }
            });

        // Enhance point styling for better visibility
        config.data.datasets[0].pointRadius = (context) => {
            const value = context.parsed.y;
            return value > 0 ? 5 : 3;
        };
        config.data.datasets[0].pointHoverRadius = 8;
        
        // Highlight points with data
        config.data.datasets[0].pointBackgroundColor = (context) => {
            const value = context.parsed.y;
            if (value === 0) return 'rgba(200, 200, 200, 0.5)';
            return this.type === 'exercise' ? '#4CAF50' : '#2196F3';
        };

        // Create new chart
        this.chart = new Chart(this.canvas, config);

        // Update statistics display
        this.updateStatistics(trendData.values);
    }

    /**
     * Render monthly trend chart (past 30 days)
     * Requirements: 15.1, 15.2, 15.3, 15.6
     */
    renderMonthlyChart() {
        this.currentView = 'monthly';
        const trendData = this.calculateMonthlyTrend();
        
        // Check if there's any data
        const hasData = trendData.values.some(val => val > 0);
        
        // Destroy existing chart if any
        if (this.chart) {
            this.chart.destroy();
        }

        // Show empty state if no data
        if (!hasData) {
            this.showEmptyState('monthly');
            this.updateStatistics(trendData.values);
            return;
        }

        // Hide empty state if it exists
        this.hideEmptyState();

        // Get chart configuration based on type with enhanced styling
        const config = this.type === 'exercise' 
            ? ChartConfig.getExerciseLineChart(trendData.labels, trendData.values, {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                return `运动时长: ${value} 分钟`;
                            }
                        }
                    }
                }
            })
            : ChartConfig.getLearningLineChart(trendData.labels, trendData.values, {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                return `学习时长: ${value} 分钟`;
                            }
                        }
                    }
                }
            });

        // Enhance point styling for better visibility
        config.data.datasets[0].pointRadius = (context) => {
            const value = context.parsed.y;
            return value > 0 ? 5 : 3;
        };
        config.data.datasets[0].pointHoverRadius = 8;
        
        // Highlight points with data
        config.data.datasets[0].pointBackgroundColor = (context) => {
            const value = context.parsed.y;
            if (value === 0) return 'rgba(200, 200, 200, 0.5)';
            return this.type === 'exercise' ? '#4CAF50' : '#2196F3';
        };

        // Create new chart
        this.chart = new Chart(this.canvas, config);

        // Update statistics display
        this.updateStatistics(trendData.values);
    }

    /**
     * Calculate weekly trend data (past 7 days)
     * Uses utility function from chartDataCalculator
     * Requirements: 15.1, 15.5
     * @returns {Object} Object with labels and values arrays
     */
    calculateWeeklyTrend() {
        const activities = this.getActivities();
        return window.chartDataCalculator.calculateWeeklyTrend(activities, this.type);
    }

    /**
     * Calculate monthly trend data (past 30 days)
     * Uses utility function from chartDataCalculator
     * Requirements: 15.2, 15.5
     * @returns {Object} Object with labels and values arrays
     */
    calculateMonthlyTrend() {
        const activities = this.getActivities();
        return window.chartDataCalculator.calculateMonthlyTrend(activities, this.type);
    }

    /**
     * Get activities based on chart type
     * @returns {Array} Array of activities (completed only)
     */
    getActivities() {
        const allActivities = this.storageManager.loadActivities(this.type);
        
        // Convert to old format for compatibility with chartDataCalculator
        // Only include completed activities
        return allActivities
            .filter(a => a.completed)
            .map(a => ({
                date: a.date,
                duration: a.duration,
                type: a.name,
                name: a.name,
                notes: a.notes
            }));
    }

    /**
     * Toggle between weekly and monthly views
     * Requirements: 15.4
     */
    toggleView() {
        if (this.currentView === 'weekly') {
            this.renderMonthlyChart();
        } else {
            this.renderWeeklyChart();
        }
    }

    /**
     * Update statistics display (average and total values)
     * Uses utility function from chartDataCalculator
     * Requirements: 15.5
     * @param {Array} data - Array of data values
     */
    updateStatistics(data) {
        const stats = window.chartDataCalculator.calculateStatistics(data);
        
        // Find statistics container
        const statsContainer = document.getElementById(`${this.canvasId}-stats`);
        
        if (statsContainer) {
            const periodText = this.currentView === 'weekly' ? '本周' : '本月';
            const unitText = this.type === 'exercise' ? '运动' : '学习';
            
            statsContainer.innerHTML = `
                <div class="chart-statistics">
                    <div class="stat-item">
                        <span class="stat-label">${periodText}总计</span>
                        <span class="stat-value">${stats.total} 分钟</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">日均${unitText}</span>
                        <span class="stat-value">${stats.average} 分钟</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">最高记录</span>
                        <span class="stat-value">${stats.max} 分钟</span>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Update chart with new data
     * @param {Array} newData - New data values
     */
    updateChart(newData) {
        if (this.chart) {
            this.chart.data.datasets[0].data = newData;
            this.chart.update();
            this.updateStatistics(newData);
        }
    }

    /**
     * Destroy the chart instance
     */
    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    /**
     * Refresh the chart (re-render current view)
     */
    refresh() {
        if (this.currentView === 'weekly') {
            this.renderWeeklyChart();
        } else {
            this.renderMonthlyChart();
        }
    }

    /**
     * Show empty state message when no data is available
     * @param {string} period - 'weekly' or 'monthly'
     */
    showEmptyState(period) {
        const canvasWrapper = this.canvas.parentElement;
        
        // Remove existing empty state if any
        this.hideEmptyState();
        
        // Create empty state element
        const emptyState = document.createElement('div');
        emptyState.className = 'chart-empty-state';
        emptyState.id = `${this.canvasId}-empty`;
        
        const periodText = period === 'weekly' ? '七天内' : '本月内';
        const activityText = this.type === 'exercise' ? '运动' : '学习';
        const emoji = this.type === 'exercise' ? '💪' : '📚';
        const encouragement = this.type === 'exercise' ? '快去运动吧！' : '快去学习吧！';
        const color = this.type === 'exercise' ? '#4CAF50' : '#2196F3';
        
        emptyState.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #95A5A6;">
                <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;">${emoji}</div>
                <div style="font-size: 18px; font-weight: 600; color: #7F8C8D; margin-bottom: 10px;">
                    ${periodText}暂未${activityText}
                </div>
                <div style="font-size: 16px; color: ${color}; font-weight: 500;">
                    ${encouragement}
                </div>
            </div>
        `;
        
        // Hide canvas and show empty state
        this.canvas.style.display = 'none';
        canvasWrapper.appendChild(emptyState);
    }

    /**
     * Hide empty state message
     */
    hideEmptyState() {
        const emptyState = document.getElementById(`${this.canvasId}-empty`);
        if (emptyState) {
            emptyState.remove();
        }
        this.canvas.style.display = 'block';
    }

    /**
     * Get current view type
     * @returns {string} Current view ('weekly' or 'monthly')
     */
    getCurrentView() {
        return this.currentView;
    }

    /**
     * Create a complete trend chart UI with toggle buttons
     * Requirements: 15.4
     * @param {string} containerId - Container element ID
     * @returns {string} HTML string for the trend chart UI
     */
    static createChartUI(containerId, canvasId, type) {
        const title = type === 'exercise' ? '运动趋势' : '学习趋势';
        const color = type === 'exercise' ? '#4CAF50' : '#2196F3';
        
        return `
            <div class="trend-chart-container" id="${containerId}">
                <div class="chart-header">
                    <h3 class="chart-title" style="color: ${color};">${title}</h3>
                    <div class="chart-toggle-buttons">
                        <button class="toggle-btn active" data-view="weekly">周视图</button>
                        <button class="toggle-btn" data-view="monthly">月视图</button>
                    </div>
                </div>
                <div class="chart-canvas-wrapper">
                    <canvas id="${canvasId}"></canvas>
                </div>
                <div id="${canvasId}-stats" class="chart-stats-container"></div>
            </div>
        `;
    }

    /**
     * Setup toggle button event listeners
     * Requirements: 15.4
     * @param {string} containerId - Container element ID
     * @param {TrendChart} chartInstance - TrendChart instance
     */
    static setupToggleButtons(containerId, chartInstance) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const buttons = container.querySelectorAll('.toggle-btn');
        
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                buttons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                button.classList.add('active');
                
                // Toggle chart view
                const view = button.getAttribute('data-view');
                if (view === 'weekly') {
                    chartInstance.renderWeeklyChart();
                } else if (view === 'monthly') {
                    chartInstance.renderMonthlyChart();
                }
            });
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrendChart;
}
