const { dbSingleton } = require('../dbSingleton');
const databaseConfig = require('../utils/databaseConfig');

class SalesAnalyticsService {
    constructor() {
        this._initialized = false;
        this._cache = new Map();
        this._cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    async _ensureInitialized() {
        if (!this._initialized) {
            await this._initialize();
            this._initialized = true;
        }
    }

    async _initialize() {
        // Service initialization if needed
    }

    async getSalesAnalytics(startDate, endDate, granularity = 'daily') {
        await this._ensureInitialized();

        const cacheKey = `sales_${startDate.toISOString()}_${endDate.toISOString()}_${granularity}`;
        const cached = this._getCached(cacheKey);
        if (cached) {
            return cached;
        }

        const connection = await dbSingleton.getConnection();
        
        try {
            const [revenueTrend, financialSummary, itemRevenue] = await Promise.all([
                this._getRevenueTrend(connection, startDate, endDate, granularity),
                this._getFinancialSummary(connection, startDate, endDate),
                this._getItemRevenue(connection, startDate, endDate)
            ]);

            const result = {
                revenueTrend,
                financialSummary,
                itemRevenue,
                granularity,
                dateRange: {
                    start: startDate.toISOString(),
                    end: endDate.toISOString()
                }
            };

            this._setCached(cacheKey, result);
            return result;

        } catch (error) {
            console.error('SalesAnalyticsService.getSalesAnalytics error:', error);
            throw new Error(`Failed to get sales analytics: ${error.message}`);
        }
    }

    async _getRevenueTrend(connection, startDate, endDate, granularity) {
        let dateFormat, groupBy;
        
        if (granularity === 'weekly') {
            dateFormat = 'YEARWEEK(order_date, 1)';
            groupBy = 'YEARWEEK(order_date, 1)';
        } else {
            dateFormat = 'DATE(order_date)';
            groupBy = 'DATE(order_date)';
        }

        const [rows] = await connection.execute(`
            SELECT 
                ${dateFormat} as date,
                SUM(total_price) as revenue,
                COUNT(*) as orderCount,
                AVG(total_price) as avgOrderValue
            FROM orders 
            WHERE order_date >= ? AND order_date <= ?
                AND status != 'cancelled'
            GROUP BY ${groupBy}
            ORDER BY date
        `, [startDate, endDate]);

        return rows.map(row => ({
            date: row.date,
            revenue: parseFloat(row.revenue || 0),
            orderCount: parseInt(row.orderCount || 0),
            avgOrderValue: parseFloat(row.avgOrderValue || 0)
        }));
    }

    async _getItemRevenue(connection, startDate, endDate) {
        const [rows] = await connection.execute(`
            SELECT 
                d.item_name as itemName,
                c.category_name as itemCategory,
                SUM(oi.quantity * oi.price) as revenue,
                COUNT(DISTINCT o.order_id) as orderCount,
                SUM(oi.quantity) as totalQuantity
            FROM order_item oi
            JOIN orders o ON oi.order_id = o.order_id
            JOIN dish d ON oi.item_id = d.item_id
            JOIN category c ON d.category_id = c.category_id
            WHERE o.order_date >= ? AND o.order_date <= ?
                AND o.status != 'cancelled'
            GROUP BY d.item_id, d.item_name, c.category_name
            ORDER BY revenue DESC
            LIMIT 50
        `, [startDate, endDate]);

        return rows.map(row => ({
            name: row.itemName,
            category: row.itemCategory,
            revenue: parseFloat(row.revenue || 0),
            orderCount: parseInt(row.orderCount || 0),
            totalQuantity: parseInt(row.totalQuantity || 0)
        }));
    }

    async _getFinancialSummary(connection, startDate, endDate) {
        const periodDuration = endDate.getTime() - startDate.getTime();
        const previousStartDate = new Date(startDate.getTime() - periodDuration);
        const previousEndDate = new Date(startDate.getTime());

        const [result] = await connection.execute(`
            SELECT 
                -- Current period
                SUM(CASE WHEN order_date >= ? AND order_date < ? AND status != 'cancelled' THEN total_price ELSE 0 END) as current_revenue,
                COUNT(CASE WHEN order_date >= ? AND order_date < ? AND status != 'cancelled' THEN 1 END) as current_orders,
                AVG(CASE WHEN order_date >= ? AND order_date < ? AND status != 'cancelled' THEN total_price END) as current_avg_order,
                
                -- Previous period
                SUM(CASE WHEN order_date >= ? AND order_date < ? AND status != 'cancelled' THEN total_price ELSE 0 END) as previous_revenue,
                COUNT(CASE WHEN order_date >= ? AND order_date < ? AND status != 'cancelled' THEN 1 END) as previous_orders,
                AVG(CASE WHEN order_date >= ? AND order_date < ? AND status != 'cancelled' THEN total_price END) as previous_avg_order
            FROM orders
        `, [
            startDate, endDate, startDate, endDate, startDate, endDate,
            previousStartDate, previousEndDate, previousStartDate, previousEndDate, previousStartDate, previousEndDate
        ]);

        const data = result[0];
        const currentRevenue = parseFloat(data.current_revenue || 0);
        const previousRevenue = parseFloat(data.previous_revenue || 0);
        const currentOrders = parseInt(data.current_orders || 0);
        const previousOrders = parseInt(data.previous_orders || 0);
        const currentAvgOrder = parseFloat(data.current_avg_order || 0);
        const previousAvgOrder = parseFloat(data.previous_avg_order || 0);

        const daysInPeriod = Math.ceil(periodDuration / (1000 * 60 * 60 * 24));

        return {
            currentPeriod: {
                totalRevenue: currentRevenue,
                totalOrders: currentOrders,
                avgOrderValue: currentAvgOrder,
                revenuePerDay: currentRevenue / daysInPeriod
            },
            previousPeriod: {
                totalRevenue: previousRevenue,
                totalOrders: previousOrders,
                avgOrderValue: previousAvgOrder,
                revenuePerDay: previousRevenue / daysInPeriod
            },
            growth: {
                revenue: this._calculateChange(currentRevenue, previousRevenue),
                orders: this._calculateChange(currentOrders, previousOrders),
                avgOrderValue: this._calculateChange(currentAvgOrder, previousAvgOrder)
            }
        };
    }

    _calculateChange(current, previous) {
        if (previous === 0) return current > 0 ? '+100%' : '0%';
        const change = ((current - previous) / previous) * 100;
        const sign = change >= 0 ? '+' : '';
        return `${sign}${change.toFixed(1)}%`;
    }

    _getCached(key) {
        const cached = this._cache.get(key);
        if (cached && Date.now() - cached.timestamp < this._cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    _setCached(key, data) {
        this._cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this._cache.clear();
    }
}

module.exports = new SalesAnalyticsService();
