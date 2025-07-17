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
        this.io.to('staff-room').emit('newOrder', orderData);
    }

    emitOrderUpdate(orderData) {
        this.io.to('staff-room').emit('orderUpdate', orderData);
        this.io.to(`user-${orderData.customerId}`).emit('orderUpdate', orderData);
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