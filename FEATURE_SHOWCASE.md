# BeanToMug - תצוגת תכונות מפורטת
## הדגמת יכולות המערכת עם הסברים טכניים

---

## תוכן עניינים
1. [תכונות עיקריות](#תכונות-עיקריות)
2. [ממשקי משתמש](#ממשקי-משתמש)
3. [תכונות טכניות מתקדמות](#תכונות-טכניות-מתקדמות)
4. [אינטגרציות חיצוניות](#אינטגרציות-חיצוניות)
5. [ביצועים ואופטימיזציה](#ביצועים-ואופטימיזציה)
6. [אבטחה ופרטיות](#אבטחה-ופרטיות)

---

## תכונות עיקריות

### 1. מערכת ניהול תפריט דינמית

#### תכונות מרכזיות:
- **ניהול קטגוריות**: יצירה ועריכה של קטגוריות עם תמונות
- **התאמות אישיות**: הוספת רכיבים לפריטים עם חישוב מחיר אוטומטי
- **ניהול מלאי**: מעקב אחר מלאי רכיבים עם התראות
- **השפעות רכיבים**: רכיבים שמשפיעים על רכיבים אחרים

#### דוגמת קוד - ניהול תפריט:
```javascript
// רכיב ניהול תפריט
const MenuManagement = () => {
    const [categories, setCategories] = useState([]);
    const [dishes, setDishes] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    
    const addDish = async (dishData) => {
        try {
            const response = await api.post('/dishes', dishData);
            setDishes(prev => [...prev, response.data]);
            showNotification('פריט נוסף בהצלחה', 'success');
        } catch (error) {
            showNotification('שגיאה בהוספת פריט', 'error');
        }
    };
    
    const updateStock = async (ingredientId, quantity) => {
        try {
            await api.put(`/ingredients/${ingredientId}/stock`, { quantity });
            // עדכון בזמן אמת
            socketService.emit('stockUpdated', { ingredientId, quantity });
        } catch (error) {
            showNotification('שגיאה בעדכון מלאי', 'error');
        }
    };
    
    return (
        <div className="menu-management">
            <CategoryManager categories={categories} />
            <DishManager dishes={dishes} onAddDish={addDish} />
            <IngredientManager 
                ingredients={ingredients} 
                onUpdateStock={updateStock} 
            />
        </div>
    );
};
```

### 2. מערכת עגלת קניות מתקדמת

#### תכונות:
- **עגלה מתמשכת**: שמירת עגלה בין סשנים
- **התאמות אישיות**: שמירת העדפות משתמש
- **חישוב מחירים בזמן אמת**: עדכון מחירים אוטומטי
- **ניהול כמות**: עדכון כמויות עם אימות מלאי

#### דוגמת קוד - ניהול עגלה:
```javascript
// Context לניהול עגלה
const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [total, setTotal] = useState(0);
    
    const addToCart = async (item, customizations) => {
        try {
            // חישוב מחיר עם התאמות
            const price = await calculateItemPrice(item.id, customizations);
            
            const cartItem = {
                id: Date.now(),
                item,
                customizations,
                quantity: 1,
                price
            };
            
            setCartItems(prev => [...prev, cartItem]);
            await saveCartToServer(cartItem);
            
            // עדכון בזמן אמת
            socketService.emit('cartUpdated', { userId: user.id });
        } catch (error) {
            showNotification('שגיאה בהוספה לעגלה', 'error');
        }
    };
    
    const updateQuantity = async (itemId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(itemId);
            return;
        }
        
        setCartItems(prev => 
            prev.map(item => 
                item.id === itemId 
                    ? { ...item, quantity }
                    : item
            )
        );
        
        await updateCartOnServer(itemId, quantity);
    };
    
    const calculateTotal = () => {
        const total = cartItems.reduce((sum, item) => 
            sum + (item.price * item.quantity), 0
        );
        setTotal(total);
    };
    
    useEffect(() => {
        calculateTotal();
    }, [cartItems]);
    
    return (
        <CartContext.Provider value={{
            cartItems,
            total,
            addToCart,
            updateQuantity,
            removeFromCart: (itemId) => {
                setCartItems(prev => prev.filter(item => item.id !== itemId));
            }
        }}>
            {children}
        </CartContext.Provider>
    );
};
```

### 3. מערכת תשלומים מאובטחת

#### אינטגרציה עם PayPal:
- **PayPal Checkout**: תשלום מאובטח
- **Webhook handling**: עדכון סטטוס הזמנות
- **החזרות**: ניהול החזרות אוטומטי
- **היסטוריית תשלומים**: מעקב אחר תשלומים

#### דוגמת קוד - תשלום PayPal:
```javascript
// שירות תשלום PayPal
class PayPalService {
    async createOrder(orderData) {
        try {
            const response = await api.post('/paypal/create-order', {
                items: orderData.items,
                total: orderData.total,
                currency: 'ILS'
            });
            
            return response.data;
        } catch (error) {
            throw new Error(`PayPal order creation failed: ${error.message}`);
        }
    }
    
    async captureOrder(orderID) {
        try {
            const response = await api.post('/paypal/capture-order', {
                orderID
            });
            
            return response.data;
        } catch (error) {
            throw new Error(`PayPal order capture failed: ${error.message}`);
        }
    }
    
    handleWebhook(webhookData) {
        // עיבוד webhook מ-PayPal
        const { event_type, resource } = webhookData;
        
        switch (event_type) {
            case 'PAYMENT.CAPTURE.COMPLETED':
                this.handlePaymentSuccess(resource);
                break;
            case 'PAYMENT.CAPTURE.DENIED':
                this.handlePaymentFailure(resource);
                break;
            default:
                console.log('Unhandled PayPal event:', event_type);
        }
    }
    
    handlePaymentSuccess(paymentData) {
        // עדכון סטטוס הזמנה
        this.updateOrderStatus(paymentData.custom_id, 'completed');
        
        // עדכון מלאי
        this.updateInventory(paymentData.custom_id);
        
        // שליחת התראה
        socketService.emit('orderCompleted', {
            orderId: paymentData.custom_id,
            amount: paymentData.amount.value
        });
    }
}
```

---

## ממשקי משתמש

### 1. דף הבית - ממשק לקוח

#### רכיבי הממשק:
```jsx
// דף הבית הראשי
const Home = () => {
    const [featuredItems, setFeaturedItems] = useState([]);
    const [galleryImages, setGalleryImages] = useState([]);
    
    useEffect(() => {
        loadFeaturedItems();
        loadGalleryImages();
    }, []);
    
    return (
        <div className="home-container">
            <HeroSection />
            <FeaturedMenu items={featuredItems} />
            <GalleryPreview images={galleryImages} />
            <RestaurantInfo />
            <Testimonials />
            <CallToAction />
        </div>
    );
};

// רכיב תפריט מומלץ
const FeaturedMenu = ({ items }) => {
    return (
        <section className="featured-menu">
            <h2>התפריט המומלץ שלנו</h2>
            <div className="menu-grid">
                {items.map(item => (
                    <MenuItem 
                        key={item.id}
                        item={item}
                        showCustomization={true}
                        onAddToCart={handleAddToCart}
                    />
                ))}
            </div>
        </section>
    );
};
```

### 2. דשבורד מנהל - ממשק ניהול

#### תכונות מתקדמות:
```jsx
// דשבורד מנהל ראשי
const AdminDashboard = () => {
    const [kpis, setKpis] = useState({});
    const [analytics, setAnalytics] = useState({});
    const [recentOrders, setRecentOrders] = useState([]);
    const [lowStockAlerts, setLowStockAlerts] = useState([]);
    
    useEffect(() => {
        loadDashboardData();
        
        // עדכון בזמן אמת
        socketService.on('newOrder', handleNewOrder);
        socketService.on('stockAlert', handleStockAlert);
        
        return () => {
            socketService.off('newOrder');
            socketService.off('stockAlert');
        };
    }, []);
    
    const loadDashboardData = async () => {
        try {
            const [kpisData, analyticsData, ordersData, stockData] = await Promise.all([
                api.get('/admin/financial-kpis'),
                api.get('/admin/order-analytics'),
                api.get('/admin/recent-orders'),
                api.get('/admin/low-stock')
            ]);
            
            setKpis(kpisData.data);
            setAnalytics(analyticsData.data);
            setRecentOrders(ordersData.data);
            setLowStockAlerts(stockData.data);
        } catch (error) {
            showNotification('שגיאה בטעינת נתונים', 'error');
        }
    };
    
    return (
        <div className="admin-dashboard">
            <div className="dashboard-header">
                <h1>דשבורד מנהל</h1>
                <div className="dashboard-actions">
                    <button onClick={exportData}>ייצוא נתונים</button>
                    <button onClick={refreshData}>רענון</button>
                </div>
            </div>
            
            <div className="kpi-cards">
                <KPICard 
                    title="הכנסות היום"
                    value={kpis.dailyRevenue}
                    change={kpis.revenueChange}
                    icon="💰"
                />
                <KPICard 
                    title="הזמנות היום"
                    value={kpis.dailyOrders}
                    change={kpis.ordersChange}
                    icon="📦"
                />
                <KPICard 
                    title="מלאי נמוך"
                    value={lowStockAlerts.length}
                    change={0}
                    icon="⚠️"
                />
            </div>
            
            <div className="dashboard-charts">
                <RevenueChart data={analytics.revenue} />
                <OrderTrendChart data={analytics.orders} />
                <PopularItemsChart data={analytics.popularItems} />
            </div>
            
            <div className="dashboard-tables">
                <RecentOrdersTable orders={recentOrders} />
                <LowStockTable items={lowStockAlerts} />
            </div>
        </div>
    );
};
```

### 3. ממשק עובד - ביצוע משימות

#### תכונות:
```jsx
// דשבורד עובד
const StaffDashboard = () => {
    const [assignedTasks, setAssignedTasks] = useState([]);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [inventoryUpdates, setInventoryUpdates] = useState([]);
    
    useEffect(() => {
        loadStaffData();
        
        // עדכון בזמן אמת
        socketService.on('newTask', handleNewTask);
        socketService.on('newOrder', handleNewOrder);
        
        return () => {
            socketService.off('newTask');
            socketService.off('newOrder');
        };
    }, []);
    
    const updateTaskStatus = async (taskId, status) => {
        try {
            await api.put(`/tasks/${taskId}/status`, { status });
            
            setAssignedTasks(prev => 
                prev.map(task => 
                    task.id === taskId 
                        ? { ...task, status }
                        : task
                )
            );
            
            // התראה למנהל
            socketService.emit('taskUpdated', { taskId, status });
            
            showNotification('סטטוס משימה עודכן', 'success');
        } catch (error) {
            showNotification('שגיאה בעדכון משימה', 'error');
        }
    };
    
    return (
        <div className="staff-dashboard">
            <div className="staff-header">
                <h1>דשבורד עובד</h1>
                <div className="staff-info">
                    <span>שלום, {user.name}</span>
                    <span>תפקיד: {user.role}</span>
                </div>
            </div>
            
            <div className="staff-sections">
                <TaskManager 
                    tasks={assignedTasks}
                    onUpdateStatus={updateTaskStatus}
                />
                <OrderProcessor 
                    orders={pendingOrders}
                    onUpdateOrder={updateOrderStatus}
                />
                <InventoryManager 
                    updates={inventoryUpdates}
                    onUpdateStock={updateStock}
                />
            </div>
        </div>
    );
};
```

---

## תכונות טכניות מתקדמות

### 1. מערכת WebSocket בזמן אמת

#### שירות WebSocket:
```javascript
// שירות WebSocket מתקדם
class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 1000;
    }
    
    async connect() {
        try {
            this.socket = io(process.env.REACT_APP_SOCKET_URL, {
                auth: {
                    token: localStorage.getItem('token')
                },
                transports: ['websocket']
            });
            
            this.setupEventHandlers();
            this.isConnected = true;
            
            console.log('WebSocket connected successfully');
        } catch (error) {
            console.error('WebSocket connection failed:', error);
            this.handleReconnect();
        }
    }
    
    setupEventHandlers() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.isConnected = true;
            this.reconnectAttempts = 0;
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.isConnected = false;
            this.handleReconnect();
        });
        
        this.socket.on('notification', (data) => {
            this.handleNotification(data);
        });
        
        this.socket.on('orderUpdate', (data) => {
            this.handleOrderUpdate(data);
        });
        
        this.socket.on('stockAlert', (data) => {
            this.handleStockAlert(data);
        });
    }
    
    authenticate(userData) {
        if (this.isConnected) {
            this.socket.emit('authenticate', userData);
            return true;
        }
        return false;
    }
    
    emit(event, data) {
        if (this.isConnected) {
            this.socket.emit(event, data);
        }
    }
    
    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }
    
    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }
    
    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
                console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                this.connect();
            }, this.reconnectInterval * this.reconnectAttempts);
        }
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.isConnected = false;
        }
    }
}

export default new SocketService();
```

### 2. מערכת אנליטיקה מתקדמת

#### שירות אנליטיקה פיננסית:
```javascript
// שירות אנליטיקה פיננסית
class FinancialAnalyticsService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 דקות
    }
    
    async getFinancialKPIs(userId, dateRange = '30d') {
        const cacheKey = `kpis_${userId}_${dateRange}`;
        
        // בדיקת cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }
        
        try {
            const connection = await getConnection();
            
            // חישוב KPIs מתקדמים
            const kpis = await this.calculateKPIs(connection, dateRange);
            
            // שמירה ב-cache
            this.cache.set(cacheKey, {
                data: kpis,
                timestamp: Date.now()
            });
            
            return kpis;
        } catch (error) {
            throw new Error(`Financial KPIs calculation failed: ${error.message}`);
        }
    }
    
    async calculateKPIs(connection, dateRange) {
        const { startDate, endDate } = this.getDateRange(dateRange);
        
        // חישוב הכנסות
        const revenue = await this.calculateRevenue(connection, startDate, endDate);
        
        // חישוב עלויות
        const costs = await this.calculateCosts(connection, startDate, endDate);
        
        // חישוב רווח
        const profit = revenue.total - costs.total;
        const profitMargin = (profit / revenue.total) * 100;
        
        // חישוב הזמנות
        const orders = await this.calculateOrders(connection, startDate, endDate);
        
        // חישוב ערך הזמנה ממוצע
        const averageOrderValue = revenue.total / orders.count;
        
        // חישוב שינוי מהתקופה הקודמת
        const previousPeriod = await this.getPreviousPeriodData(connection, dateRange);
        
        return {
            revenue: {
                total: revenue.total,
                change: this.calculateChange(revenue.total, previousPeriod.revenue)
            },
            costs: {
                total: costs.total,
                change: this.calculateChange(costs.total, previousPeriod.costs)
            },
            profit: {
                total: profit,
                margin: profitMargin,
                change: this.calculateChange(profit, previousPeriod.profit)
            },
            orders: {
                count: orders.count,
                change: this.calculateChange(orders.count, previousPeriod.orders)
            },
            averageOrderValue: {
                value: averageOrderValue,
                change: this.calculateChange(averageOrderValue, previousPeriod.aov)
            }
        };
    }
    
    async calculateRevenue(connection, startDate, endDate) {
        const query = `
            SELECT 
                COALESCE(SUM(oi.price * oi.quantity), 0) as total_revenue,
                COUNT(DISTINCT o.order_id) as order_count
            FROM orders o
            JOIN order_item oi ON o.order_id = oi.order_id
            WHERE o.status = 'completed'
                AND o.is_cart = 0
                AND o.created_at >= ? AND o.created_at < ?
        `;
        
        const [rows] = await connection.execute(query, [startDate, endDate]);
        return rows[0];
    }
    
    async calculateCosts(connection, startDate, endDate) {
        const query = `
            SELECT 
                COALESCE(SUM(
                    CASE 
                        WHEN ing.price IS NOT NULL 
                        THEN ing.price * oi.quantity 
                        ELSE 0 
                    END
                ), 0) as ingredient_costs
            FROM orders o
            JOIN order_item oi ON o.order_id = oi.order_id
            LEFT JOIN order_item_ingredient oii ON oi.order_item_id = oii.order_item_id
            LEFT JOIN ingredient ing ON oii.ingredient_id = ing.ingredient_id
            WHERE o.status = 'completed'
                AND o.is_cart = 0
                AND o.created_at >= ? AND o.created_at < ?
        `;
        
        const [rows] = await connection.execute(query, [startDate, endDate]);
        return { total: rows[0].ingredient_costs };
    }
    
    calculateChange(current, previous) {
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
    }
}

export default new FinancialAnalyticsService();
```

### 3. מערכת ניהול מלאי חכמה

#### שירות ניהול מלאי:
```javascript
// שירות ניהול מלאי מתקדם
class StockManagementService {
    async deductStockForOrder(orderId) {
        const connection = await getConnection();
        
        try {
            await connection.beginTransaction();
            
            // קבלת פריטי ההזמנה
            const orderItems = await this.getOrderItems(connection, orderId);
            
            // חישוב השפעות רכיבים
            const ingredientEffects = await this.calculateIngredientEffects(connection, orderItems);
            
            // עדכון מלאי עם bulk operations
            await this.updateStockBulk(connection, ingredientEffects);
            
            // בדיקת מלאי נמוך
            const lowStockItems = await this.checkLowStock(connection);
            
            // שליחת התראות
            if (lowStockItems.length > 0) {
                await this.sendLowStockNotifications(lowStockItems);
            }
            
            await connection.commit();
            
            return { success: true, lowStockItems };
        } catch (error) {
            await connection.rollback();
            throw new Error(`Stock update failed: ${error.message}`);
        }
    }
    
    async calculateIngredientEffects(connection, orderItems) {
        const effects = new Map();
        
        for (const item of orderItems) {
            // קבלת רכיבים בסיסיים
            const baseIngredients = await this.getBaseIngredients(connection, item.item_id);
            
            // קבלת רכיבים אופציונליים
            const optionIngredients = await this.getOptionIngredients(connection, item.customizations);
            
            // חישוב השפעות
            const itemEffects = await this.calculateItemEffects(connection, item.item_id, item.customizations);
            
            // עדכון מפת השפעות
            for (const [ingredientId, quantity] of itemEffects) {
                const currentQuantity = effects.get(ingredientId) || 0;
                effects.set(ingredientId, currentQuantity + (quantity * item.quantity));
            }
        }
        
        return effects;
    }
    
    async updateStockBulk(connection, ingredientEffects) {
        const updatePromises = [];
        
        for (const [ingredientId, quantity] of ingredientEffects) {
            const updateQuery = `
                UPDATE ingredient 
                SET stock_quantity = stock_quantity - ? 
                WHERE ingredient_id = ? AND stock_quantity >= ?
            `;
            
            updatePromises.push(
                connection.execute(updateQuery, [quantity, ingredientId, quantity])
            );
        }
        
        await Promise.all(updatePromises);
    }
    
    async checkLowStock(connection) {
        const query = `
            SELECT 
                ingredient_id,
                name,
                stock_quantity,
                min_stock_level
            FROM ingredient 
            WHERE stock_quantity <= min_stock_level
                AND is_available = 1
        `;
        
        const [rows] = await connection.execute(query);
        return rows;
    }
    
    async sendLowStockNotifications(lowStockItems) {
        // שליחת התראה למנהלים
        socketService.emitNotification({
            targetRole: 'admin',
            message: `מלאי נמוך: ${lowStockItems.length} פריטים`,
            type: 'stock_alert',
            data: lowStockItems
        });
        
        // שליחת התראה לעובדים
        socketService.emitNotification({
            targetRole: 'staff',
            message: `מלאי נמוך: ${lowStockItems.length} פריטים`,
            type: 'stock_alert',
            data: lowStockItems
        });
    }
}

export default new StockManagementService();
```

---

## אינטגרציות חיצוניות

### 1. אינטגרציה עם PayPal

#### תכונות:
- **PayPal Checkout**: תשלום מאובטח
- **Webhook handling**: עדכון סטטוס הזמנות
- **החזרות**: ניהול החזרות אוטומטי
- **היסטוריית תשלומים**: מעקב אחר תשלומים

#### דוגמת קוד - PayPal Integration:
```javascript
// PayPal Service
class PayPalService {
    constructor() {
        this.clientId = process.env.PAYPAL_CLIENT_ID;
        this.clientSecret = process.env.PAYPAL_CLIENT_SECRET;
        this.environment = process.env.NODE_ENV === 'production' ? 'live' : 'sandbox';
        
        this.paypalClient = new paypal.core.PayPalHttpClient(
            new paypal.core.SandboxEnvironment(this.clientId, this.clientSecret)
        );
    }
    
    async createOrder(orderData) {
        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'ILS',
                    value: orderData.total.toString()
                },
                custom_id: orderData.orderId.toString(),
                description: `הזמנה #${orderData.orderId}`
            }],
            application_context: {
                return_url: `${process.env.FRONTEND_URL}/payment-success`,
                cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`
            }
        });
        
        try {
            const response = await this.paypalClient.execute(request);
            return response.result;
        } catch (error) {
            throw new Error(`PayPal order creation failed: ${error.message}`);
        }
    }
    
    async captureOrder(orderID) {
        const request = new paypal.orders.OrdersCaptureRequest(orderID);
        request.requestBody({});
        
        try {
            const response = await this.paypalClient.execute(request);
            return response.result;
        } catch (error) {
            throw new Error(`PayPal order capture failed: ${error.message}`);
        }
    }
    
    async handleWebhook(webhookData) {
        const { event_type, resource } = webhookData;
        
        switch (event_type) {
            case 'PAYMENT.CAPTURE.COMPLETED':
                await this.handlePaymentSuccess(resource);
                break;
            case 'PAYMENT.CAPTURE.DENIED':
                await this.handlePaymentFailure(resource);
                break;
            default:
                console.log('Unhandled PayPal event:', event_type);
        }
    }
    
    async handlePaymentSuccess(paymentData) {
        const orderId = paymentData.custom_id;
        
        // עדכון סטטוס הזמנה
        await this.updateOrderStatus(orderId, 'completed');
        
        // עדכון מלאי
        await stockService.deductStockForOrder(orderId);
        
        // שליחת התראה
        socketService.emit('orderCompleted', {
            orderId,
            amount: paymentData.amount.value,
            currency: paymentData.amount.currency_code
        });
        
        // שליחת אימייל אישור
        await emailService.sendOrderConfirmation(orderId);
    }
}

export default new PayPalService();
```

### 2. אינטגרציה עם שירותי אימייל

#### תכונות:
- **אישור הזמנה**: שליחת אימייל אישור
- **אימות אימייל**: שליחת קוד אימות
- **איפוס סיסמה**: שליחת קישור איפוס
- **התראות**: שליחת התראות חשובות

#### דוגמת קוד - Email Service:
```javascript
// Email Service
class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }
    
    async sendOrderConfirmation(orderId) {
        try {
            const order = await this.getOrderDetails(orderId);
            const user = await this.getUserDetails(order.user_id);
            
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: `אישור הזמנה #${orderId}`,
                html: this.generateOrderConfirmationHTML(order, user)
            };
            
            await this.transporter.sendMail(mailOptions);
            console.log(`Order confirmation sent for order ${orderId}`);
        } catch (error) {
            console.error(`Failed to send order confirmation: ${error.message}`);
        }
    }
    
    async sendEmailVerification(email, token) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'אימות כתובת אימייל',
                html: this.generateEmailVerificationHTML(token)
            };
            
            await this.transporter.sendMail(mailOptions);
            console.log(`Email verification sent to ${email}`);
        } catch (error) {
            console.error(`Failed to send email verification: ${error.message}`);
        }
    }
    
    generateOrderConfirmationHTML(order, user) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>תודה על ההזמנה שלך!</h2>
                <p>שלום ${user.name},</p>
                <p>ההזמנה שלך התקבלה בהצלחה:</p>
                
                <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0;">
                    <h3>פרטי ההזמנה</h3>
                    <p><strong>מספר הזמנה:</strong> #${order.order_id}</p>
                    <p><strong>תאריך:</strong> ${new Date(order.created_at).toLocaleDateString('he-IL')}</p>
                    <p><strong>סכום:</strong> ₪${order.total_price}</p>
                    <p><strong>סטטוס:</strong> ${order.status}</p>
                </div>
                
                <p>נשמח לראות אותך שוב בקרוב!</p>
                <p>צוות BeanToMug</p>
            </div>
        `;
    }
}

export default new EmailService();
```

---

## ביצועים ואופטימיזציה

### 1. אסטרטגיית Caching

#### Cache במערכת:
```javascript
// Cache Service
class CacheService {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5 דקות
    }
    
    set(key, value, ttl = this.defaultTTL) {
        const expiry = Date.now() + ttl;
        this.cache.set(key, { value, expiry });
    }
    
    get(key) {
        const item = this.cache.get(key);
        
        if (!item) {
            return null;
        }
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }
    
    delete(key) {
        this.cache.delete(key);
    }
    
    clear() {
        this.cache.clear();
    }
    
    // Cache עם fallback function
    async getOrSet(key, fallbackFunction, ttl = this.defaultTTL) {
        let value = this.get(key);
        
        if (value === null) {
            value = await fallbackFunction();
            this.set(key, value, ttl);
        }
        
        return value;
    }
}

export default new CacheService();
```

### 2. אופטימיזציה של שאילתות

#### Query Optimization:
```javascript
// Database Query Optimizer
class QueryOptimizer {
    static async getOptimizedMenuData(connection, filters = {}) {
        // שימוש ב-query עם joins מותאמים
        const query = `
            SELECT 
                d.item_id,
                d.item_name,
                d.price,
                d.description,
                d.is_available,
                c.category_name,
                c.category_image,
                GROUP_CONCAT(
                    CONCAT(i.name, ':', i.price, ':', i.stock_quantity)
                    SEPARATOR '|'
                ) as ingredients
            FROM dishes d
            LEFT JOIN categories c ON d.category_id = c.category_id
            LEFT JOIN dish_ingredient di ON d.item_id = di.item_id
            LEFT JOIN ingredient i ON di.ingredient_id = i.ingredient_id
            WHERE d.is_available = 1
            ${filters.category ? 'AND d.category_id = ?' : ''}
            GROUP BY d.item_id
            ORDER BY d.item_name
        `;
        
        const params = filters.category ? [filters.category] : [];
        const [rows] = await connection.execute(query, params);
        
        // עיבוד התוצאות
        return rows.map(row => ({
            ...row,
            ingredients: row.ingredients ? 
                row.ingredients.split('|').map(ing => {
                    const [name, price, stock] = ing.split(':');
                    return { name, price: parseFloat(price), stock: parseInt(stock) };
                }) : []
        }));
    }
    
    static async getBulkStockUpdate(connection, stockUpdates) {
        // Bulk update יעיל
        const query = `
            UPDATE ingredient 
            SET stock_quantity = CASE ingredient_id
                ${stockUpdates.map(() => 'WHEN ? THEN ?').join(' ')}
            END
            WHERE ingredient_id IN (${stockUpdates.map(() => '?').join(',')})
        `;
        
        const params = [];
        stockUpdates.forEach(update => {
            params.push(update.ingredientId, update.quantity);
        });
        stockUpdates.forEach(update => {
            params.push(update.ingredientId);
        });
        
        await connection.execute(query, params);
    }
}
```

### 3. Lazy Loading ו-Code Splitting

#### Frontend Optimization:
```javascript
// Lazy Loading של רכיבים
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
const StaffDashboard = lazy(() => import('../pages/staff/Dashboard'));
const MenuManagement = lazy(() => import('../pages/admin/MenuManagement'));

// Code Splitting עם Suspense
const App = () => {
    return (
        <Router>
            <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                    <Route path="/admin" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AdminLayout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<AdminDashboard />} />
                        <Route path="menu" element={<MenuManagement />} />
                    </Route>
                </Routes>
            </Suspense>
        </Router>
    );
};

// Dynamic Import עם error handling
const loadComponent = async (componentPath) => {
    try {
        const module = await import(componentPath);
        return module.default;
    } catch (error) {
        console.error(`Failed to load component: ${componentPath}`, error);
        return () => <div>Error loading component</div>;
    }
};
```

---

## אבטחה ופרטיות

### 1. מערכת אימות מתקדמת

#### JWT Authentication:
```javascript
// Authentication Service
class AuthService {
    generateToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 שעות
        };
        
        return jwt.sign(payload, process.env.JWT_SECRET);
    }
    
    verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }
    
    async hashPassword(password) {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    }
    
    async comparePassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }
    
    generatePasswordResetToken(email) {
        const payload = {
            email,
            type: 'password_reset',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (60 * 60) // שעה
        };
        
        return jwt.sign(payload, process.env.JWT_SECRET);
    }
}

export default new AuthService();
```

### 2. Middleware אבטחה

#### Security Middleware:
```javascript
// Security Middleware
const securityMiddleware = {
    // Rate Limiting
    rateLimit: (windowMs = 15 * 60 * 1000, max = 100) => {
        const requests = new Map();
        
        return (req, res, next) => {
            const ip = req.ip;
            const now = Date.now();
            const windowStart = now - windowMs;
            
            // ניקוי בקשות ישנות
            if (requests.has(ip)) {
                const userRequests = requests.get(ip).filter(time => time > windowStart);
                requests.set(ip, userRequests);
            } else {
                requests.set(ip, []);
            }
            
            const userRequests = requests.get(ip);
            
            if (userRequests.length >= max) {
                return res.status(429).json({
                    error: 'Too many requests',
                    retryAfter: Math.ceil(windowMs / 1000)
                });
            }
            
            userRequests.push(now);
            next();
        };
    },
    
    // Input Validation
    validateInput: (schema) => {
        return (req, res, next) => {
            const { error } = schema.validate(req.body);
            
            if (error) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: error.details.map(detail => detail.message)
                });
            }
            
            next();
        };
    },
    
    // SQL Injection Prevention
    sanitizeInput: (req, res, next) => {
        const sanitize = (obj) => {
            for (const key in obj) {
                if (typeof obj[key] === 'string') {
                    obj[key] = obj[key].replace(/['"\\]/g, '');
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    sanitize(obj[key]);
                }
            }
        };
        
        sanitize(req.body);
        sanitize(req.query);
        sanitize(req.params);
        
        next();
    }
};

export default securityMiddleware;
```

### 3. הגנת פרטיות

#### Privacy Protection:
```javascript
// Privacy Service
class PrivacyService {
    // הצפנת נתונים רגישים
    encryptSensitiveData(data) {
        const algorithm = 'aes-256-gcm';
        const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipher(algorithm, key);
        cipher.setAAD(Buffer.from('additional-data'));
        
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }
    
    // פענוח נתונים מוצפנים
    decryptSensitiveData(encryptedData) {
        const algorithm = 'aes-256-gcm';
        const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
        
        const decipher = crypto.createDecipher(algorithm, key);
        decipher.setAAD(Buffer.from('additional-data'));
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
        
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    }
    
    // הסרת נתונים רגישים מהתגובה
    sanitizeResponse(data, fieldsToRemove = ['password', 'token', 'secret']) {
        if (Array.isArray(data)) {
            return data.map(item => this.sanitizeResponse(item, fieldsToRemove));
        }
        
        if (typeof data === 'object' && data !== null) {
            const sanitized = { ...data };
            
            fieldsToRemove.forEach(field => {
                delete sanitized[field];
            });
            
            for (const key in sanitized) {
                sanitized[key] = this.sanitizeResponse(sanitized[key], fieldsToRemove);
            }
            
            return sanitized;
        }
        
        return data;
    }
}

export default new PrivacyService();
```

---

## סיכום

מערכת **BeanToMug** מציגה פתרון מקיף ומתקדם לניהול מסעדה מודרנית עם תכונות טכניות מתקדמות:

### תכונות מרכזיות:
1. **מערכת תפריט דינמית** עם התאמות אישיות
2. **עגלת קניות מתקדמת** עם חישוב מחירים בזמן אמת
3. **תשלומים מאובטחים** עם PayPal
4. **דשבורד אנליטי** עם KPIs מתקדמים
5. **תקשורת בזמן אמת** עם WebSocket
6. **ניהול מלאי חכם** עם התראות אוטומטיות
7. **אבטחה מתקדמת** עם JWT ו-bcrypt
8. **ביצועים מותאמים** עם caching ו-optimization

### יתרונות טכניים:
- **ארכיטקטורה מודולרית** עם הפרדת שכבות ברורה
- **קוד נקי וניתן לתחזוקה** עם תבניות עיצוב מוכחות
- **ביצועים גבוהים** עם אופטימיזציה מתקדמת
- **אבטחה רב-שכבתית** עם הגנות מקיפות
- **חוויית משתמש מעולה** עם ממשק רספונסיבי

המערכת מוכנה לשימוש מסחרי ומספקת בסיס איתן לפיתוח עתידי של תכונות נוספות.

---

*תיעוד זה נוצר עבור פרויקט BeanToMug - מערכת ניהול מסעדה מתקדמת*
*כל הדוגמאות מבוססות על הקוד האמיתי של המערכת*
