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

            // Handle disconnection
            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            });
        });
    }

    authenticateUser(socket, userData) {
        const { userId, userRole } = userData;
        
        console.log('Backend SocketService: Authenticating user:', { userId, userRole, socketId: socket.id });
        
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
            console.log('Backend SocketService: User joined admin-room and staff-room');
        } else if (userRole === 'staff') {
            socket.join('staff-room');
            console.log('Backend SocketService: User joined staff-room');
        }

        // Join user-specific room for personal notifications
        socket.join(`user-${userId}`);
        console.log('Backend SocketService: User joined user-specific room:', `user-${userId}`);
        
        console.log('Backend SocketService: Current connected users:', this.connectedUsers.size);
        console.log('Backend SocketService: Users in staff-room:', this.getUsersInRoom('staff-room'));
        console.log('Backend SocketService: Users in admin-room:', this.getUsersInRoom('admin-room'));
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
        console.log('Backend SocketService: Emitting new task:', taskData);
        console.log('Backend SocketService: Users in staff-room:', this.getUsersInRoom('staff-room'));
        this.io.to('staff-room').emit('newTask', taskData);
    }

    emitTaskUpdate(taskData) {
        this.io.to('staff-room').emit('taskUpdate', taskData);
    }

    emitNewOrder(orderData) {
        console.log('Backend SocketService: Emitting new order data:', orderData);
        
        // Check if we have complete order data with items
        if (orderData.items && Array.isArray(orderData.items)) {
            console.log('Backend SocketService: Emitting complete order data with items');
            this.io.to('staff-room').emit('newOrder', orderData);
        } else {
            console.log('Backend SocketService: Emitting basic order notification');
            this.io.to('staff-room').emit('newOrder', {
                orderId: orderData.orderId || orderData.order_id,
                status: orderData.status || 'processing',
                customerId: orderData.customerId,
                orderType: orderData.orderType,
                timestamp: new Date().toISOString()
            });
        }
    }

    emitOrderUpdate(orderData) {
        console.log('Backend SocketService: Emitting order update:', orderData);
        
        // Check if we have complete order data with items
        if (orderData.items && Array.isArray(orderData.items)) {
            console.log('Backend SocketService: Emitting complete order update data');
            this.io.to('staff-room').emit('orderUpdate', orderData);
        } else {
            console.log('Backend SocketService: Emitting basic order update notification');
            this.io.to('staff-room').emit('orderUpdate', {
                orderId: orderData.orderId || orderData.order_id,
                status: orderData.status,
                customerId: orderData.customerId,
                orderType: orderData.orderType,
                timestamp: new Date().toISOString()
            });
        }
        
        // Also notify the specific customer with basic data
        if (orderData.customerId) {
            this.io.to(`user-${orderData.customerId}`).emit('orderUpdate', {
                orderId: orderData.orderId || orderData.order_id,
                status: orderData.status,
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
        
        console.log('Backend SocketService: Emitting notification:', notificationData);
        console.log('Backend SocketService: Connected users:', this.connectedUsers.size);
        console.log('Backend SocketService: Users in staff-room:', this.getUsersInRoom('staff-room'));
        console.log('Backend SocketService: Users in admin-room:', this.getUsersInRoom('admin-room'));
        
        // Send to specific user if userId provided
        if (targetUserId) {
            console.log('Backend SocketService: Sending to user-specific room:', `user-${targetUserId}`);
            this.io.to(`user-${targetUserId}`).emit('notification', {
                message,
                type,
                timestamp: new Date().toISOString()
            });
        }
        
        // Send to role-based rooms
        if (targetRole === 'admin') {
            console.log('Backend SocketService: Sending to admin-room');
            this.io.to('admin-room').emit('notification', {
                message,
                type,
                timestamp: new Date().toISOString()
            });
        } else if (targetRole === 'staff') {
            console.log('Backend SocketService: Sending to staff-room');
            this.io.to('staff-room').emit('notification', {
                message,
                type,
                timestamp: new Date().toISOString()
            });
        }
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