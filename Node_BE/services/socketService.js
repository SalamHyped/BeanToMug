const socketIO = require('socket.io');

class SocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map(); // Map to store user connections
    }

    initialize(server) {
        this.io = socketIO(server, {
            cors: {
                origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://localhost:8080'],
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
                credentials: true
            },
            transports: ['websocket', 'polling'],
            allowEIO3: true
        });

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            // Handle user authentication
            socket.on('authenticate', (userData) => {
                this.authenticateUser(socket, userData);
            });

            // Handle user joining specific rooms
            socket.on('joinRoom', (roomData) => {
                this.joinRoom(socket, roomData);
            });

            // Handle user leaving rooms
            socket.on('leaveRoom', (roomData) => {
                this.leaveRoom(socket, roomData);
            });

            // Handle test events for debugging
            socket.on('test', (data) => {
                // Echo back the test data with server timestamp
                socket.emit('test', {
                    ...data,
                    serverTimestamp: new Date().toISOString(),
                    serverId: socket.id,
                    message: 'Test response from server'
                });
            });

            // Handle staff viewing inventory alerts
            socket.on('staffViewingAlerts', (data) => {
                this.handleStaffViewingAlerts(socket, data);
            });

            // Handle staff alert interactions
            socket.on('staffAlertInteraction', (data) => {
                this.handleStaffAlertInteraction(socket, data);
            });

            // Handle item preparation toggle for cross-view sync
            socket.on('itemPreparationToggle', (data) => {
                this.handleItemPreparationToggle(socket, data);
            });

        socket.on('testNotification', (data) => {
            // Broadcast to admin room
            this.io.to('admin-room').emit('testNotification', data);
        });

            // Handle disconnection
            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            });
        });
    }

    authenticateUser(socket, userData) {
        const { userId, userRole } = userData;
        
        // Store user connection info
        this.connectedUsers.set(socket.id, {
            userId,
            userRole,
            socketId: socket.id,
            rooms: []
        });

        // Join role-specific rooms
        if (userRole === 'admin') {
            socket.join('admin-room');
            socket.join('staff-room');
        } else if (userRole === 'staff') {
            socket.join('staff-room');
        }

        // Join user-specific room for personal notifications
        socket.join(`user-${userId}`);
    }

    joinRoom(socket, roomData) {
        const { roomName, roomType } = roomData;
        const userInfo = this.connectedUsers.get(socket.id);
        
        if (userInfo) {
            socket.join(roomName);
            userInfo.rooms.push(roomName);
        }
    }

    leaveRoom(socket, roomData) {
        const { roomName } = roomData;
        const userInfo = this.connectedUsers.get(socket.id);
        
        if (userInfo) {
            socket.leave(roomName);
            userInfo.rooms = userInfo.rooms.filter(room => room !== roomName);
        }
    }

    handleDisconnect(socket) {
        const userInfo = this.connectedUsers.get(socket.id);
        if (userInfo) {
            this.connectedUsers.delete(socket.id);
        }
    }

    // Real-time event emitters
    emitNewTask(taskData) {
        this.io.to('staff-room').emit('newTask', taskData);
    }

    emitTaskUpdate(taskData) {
        this.io.to('staff-room').emit('taskUpdate', taskData);
    }

    emitNewOrder(orderData) {
        // Backend now always sends complete order data with items
        // Ensure consistent field names - use order_id
        const normalizedData = {
            ...orderData,
            order_id: orderData.order_id || orderData.orderId
        };

        this.io.to('staff-room').emit('newOrder', normalizedData);
    }

    emitOrderUpdate(orderData) {
        // Normalize order_id to ensure consistency
        const order_id = orderData.order_id || orderData.orderId;
        const status = orderData.status;

        if (!order_id || !status) {
            return;
        }

        // Backend now always sends complete order data with items
        // Ensure consistent field names - use order_id
        const normalizedData = {
            ...orderData,
            order_id: order_id
        };

        // Emit complete order data to staff room
        this.io.to('staff-room').emit('orderUpdate', normalizedData);

        // Also notify the specific customer with basic data
        if (orderData.customerId) {
            this.io.to(`user-${orderData.customerId}`).emit('orderUpdate', {
                order_id: order_id,
                status: status,
                timestamp: new Date().toISOString()
            });
        }
    }

    emitItemPreparationUpdate(preparationData) {
        // Emit to staff room for real-time synchronization
        this.io.to('staff-room').emit('itemPreparationUpdate', {
            order_id: preparationData.order_id || preparationData.orderId,
            itemIndex: preparationData.itemIndex,
            isPrepared: preparationData.isPrepared,
            itemName: preparationData.itemName,
            updatedBy: preparationData.updatedBy,
            updatedAt: preparationData.updatedAt,
            timestamp: new Date().toISOString()
        });

        // Also emit to the specific user who made the change for immediate feedback
        if (preparationData.updatedBy) {
            this.io.to(`user-${preparationData.updatedBy}`).emit('itemPreparationUpdate', {
                order_id: preparationData.order_id || preparationData.orderId,
                itemIndex: preparationData.itemIndex,
                isPrepared: preparationData.isPrepared,
                itemName: preparationData.itemName,
                updatedBy: preparationData.updatedBy,
                updatedAt: preparationData.updatedAt,
                timestamp: new Date().toISOString()
            });
        }
    }

    emitGalleryUpdate(galleryData) {
        this.io.to('admin-room').emit('galleryUpdate', galleryData);
        this.io.to('staff-room').emit('galleryUpdate', galleryData);
    }

    emitNotification(notificationData) {
        const { targetUserId, targetRole, message, type } = notificationData;
        
        // Send to specific user if userId provided
        if (targetUserId) {
            this.io.to(`user-${targetUserId}`).emit('notification', {
                message,
                type,
                timestamp: new Date().toISOString()
            });
        }
        
        // Send to role-based rooms
        if (targetRole === 'admin') {
            this.io.to('admin-room').emit('notification', {
                message,
                type,
                timestamp: new Date().toISOString()
            });
        } else if (targetRole === 'staff') {
            this.io.to('staff-room').emit('notification', {
                message,
                type,
                timestamp: new Date().toISOString()
            });
        }
    }

    handleStaffViewingAlerts(socket, data) {
        const userInfo = this.connectedUsers.get(socket.id);
        
        // Notify admins that staff is viewing alerts
        this.io.to('admin-room').emit('staffAlertActivity', {
            type: 'viewing_alerts',
            alertCount: data.alertCount,
            alerts: data.alerts,
            viewedBy: data.viewedBy,
            timestamp: data.timestamp,
            staffInfo: userInfo ? { userId: userInfo.userId, userRole: userInfo.userRole } : null
        });

        // Also send a general notification to admins
        const notificationData = {
            message: `Staff member is viewing ${data.alertCount} inventory alert(s)`,
            type: 'staff_alert_activity',
            timestamp: new Date().toISOString(),
            data: {
                alertCount: data.alertCount,
                viewedBy: data.viewedBy
            }
        };
        
        this.io.to('admin-room').emit('notification', notificationData);
    }

    handleStaffAlertInteraction(socket, data) {
        const userInfo = this.connectedUsers.get(socket.id);
        
        // Notify admins of staff interaction with specific alert
        this.io.to('admin-room').emit('staffAlertActivity', {
            type: 'alert_interaction',
            alertId: data.alertId,
            alertType: data.alertType,
            message: data.message,
            action: data.action,
            timestamp: data.timestamp,
            staffInfo: userInfo ? { userId: userInfo.userId, userRole: userInfo.userRole } : null
        });

        // Send specific notification to admins
        const notificationData = {
            message: `Staff member ${data.action} alert: ${data.message}`,
            type: 'staff_alert_interaction',
            timestamp: new Date().toISOString(),
            data: {
                alertId: data.alertId,
                alertType: data.alertType,
                action: data.action
            }
        };
        
        this.io.to('admin-room').emit('notification', notificationData);
    }

    handleItemPreparationToggle(socket, data) {
        // Broadcast the preparation status change to all staff members
        this.io.to('staff-room').emit('itemPreparationUpdate', {
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    // Financial KPI WebSocket Methods
    emitOrderCompleted(orderData) {
        // Validate required data
        if (!orderData.orderId || !orderData.totalPrice || isNaN(orderData.totalPrice)) {
            console.error('❌ Invalid order data for WebSocket emission:', orderData);
            return;
        }
        
        // Ensure numeric values are properly converted
        const totalPrice = parseFloat(orderData.totalPrice);
        const profitIncrease = parseFloat(orderData.profitIncrease || (totalPrice * 0.4));
        
        // Emit to admin room for real-time KPI updates
        this.io.to('admin-room').emit('order-completed', {
            type: 'order-completed',
            orderId: orderData.orderId,
            totalPrice: totalPrice,
            revenue: totalPrice,
            timestamp: new Date().toISOString(),
            message: `Order ${orderData.orderId} completed - Revenue: $${totalPrice}`,
            // Send only the incremental changes for efficient updates
            kpiChanges: {
                revenueIncrease: totalPrice,
                profitIncrease: profitIncrease, // Default 40% margin
                orderCountIncrease: 1,
                // Include current totals for percentage calculations
                currentTotals: orderData.currentTotals || null
            }
        });
        
        // Note: Removed duplicate financial-kpis-updated emission to prevent double-counting
        // The order-completed event is sufficient for KPI updates
    }

    emitOrderStatusChanged(orderData) {
        // Validate required data
        if (!orderData.orderId || !orderData.totalPrice || isNaN(orderData.totalPrice)) {
            console.error('❌ Invalid order data for WebSocket emission:', orderData);
            return;
        }
        
        // Ensure numeric values are properly converted
        const totalPrice = parseFloat(orderData.totalPrice);
        const profitDecrease = parseFloat(orderData.profitDecrease || (totalPrice * 0.4));
        
        // Emit to admin room for real-time KPI updates
        this.io.to('admin-room').emit('order-status-changed', {
            type: 'order-status-changed',
            orderId: orderData.orderId,
            totalPrice: totalPrice,
            status: orderData.status,
            previousStatus: orderData.previousStatus,
            timestamp: new Date().toISOString(),
            message: orderData.message,
            // Send KPI decrease data with proper numeric types
            kpiChanges: {
                revenueDecrease: totalPrice,
                profitDecrease: profitDecrease,
                orderCountDecrease: 1,
                isDecrease: true // Flag to indicate this is a decrease
            }
        });
    }

    emitFinancialKPIsUpdated(kpiData) {
        this.io.to('admin-room').emit('financial-kpis-updated', {
            type: 'financial-kpis-updated',
            ...kpiData,
            timestamp: new Date().toISOString(),
            message: 'Financial KPIs have been updated'
        });
    }

    // Get connected users count for monitoring
    getConnectedUsersCount() {
        return this.connectedUsers.size;
    }

    // Get users in specific room
    getUsersInRoom(roomName) {
        const room = this.io.sockets.adapter.rooms.get(roomName);
        return room ? room.size : 0;
    }

    // Debug method to show current connections
    debugConnections() {
        console.log('=== Socket.IO Debug Info ===');
        console.log('Connected users:', this.connectedUsers.size);
        console.log('Users in staff-room:', this.getUsersInRoom('staff-room'));
        console.log('Users in admin-room:', this.getUsersInRoom('admin-room'));
        console.log('Connected users details:', Array.from(this.connectedUsers.values()));
        console.log('===========================');
    }
}

module.exports = new SocketService(); 