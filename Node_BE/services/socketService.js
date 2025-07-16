const socketIO = require('socket.io');

class SocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map(); // Map to store user connections
    }

    initialize(server) {
        this.io = socketIO(server, {
            cors: {
                origin: ['http://localhost:5173', 'http://localhost:5174'],
                methods: ['GET', 'POST'],
                credentials: true
            }
        });

        this.setupEventHandlers();
        console.log('Socket.IO server initialized');
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`User connected: ${socket.id}`);

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

        console.log(`User ${userId} (${userRole}) authenticated on socket ${socket.id}`);
    }

    joinRoom(socket, roomData) {
        const { roomName, roomType } = roomData;
        const userInfo = this.connectedUsers.get(socket.id);
        
        if (userInfo) {
            socket.join(roomName);
            userInfo.rooms.push(roomName);
            console.log(`User ${userInfo.userId} joined room: ${roomName}`);
        }
    }

    leaveRoom(socket, roomData) {
        const { roomName } = roomData;
        const userInfo = this.connectedUsers.get(socket.id);
        
        if (userInfo) {
            socket.leave(roomName);
            userInfo.rooms = userInfo.rooms.filter(room => room !== roomName);
            console.log(`User ${userInfo.userId} left room: ${roomName}`);
        }
    }

    handleDisconnect(socket) {
        const userInfo = this.connectedUsers.get(socket.id);
        if (userInfo) {
            console.log(`User ${userInfo.userId} disconnected from socket ${socket.id}`);
            this.connectedUsers.delete(socket.id);
        }
    }

    // Real-time event emitters
    emitNewOrder(orderData) {
        this.io.to('staff-room').emit('newOrder', orderData);
        console.log('New order notification sent to staff');
    }

    emitOrderUpdate(orderData) {
        this.io.to('staff-room').emit('orderUpdate', orderData);
        this.io.to(`user-${orderData.customerId}`).emit('orderUpdate', orderData);
        console.log('Order update notification sent');
    }

    emitNewTask(taskData) {
        this.io.to('staff-room').emit('newTask', taskData);
        console.log('New task notification sent to staff');
    }

    emitTaskUpdate(taskData) {
        this.io.to('staff-room').emit('taskUpdate', taskData);
        console.log('Task update notification sent');
    }

    emitGalleryUpdate(galleryData) {
        this.io.to('admin-room').emit('galleryUpdate', galleryData);
        this.io.to('staff-room').emit('galleryUpdate', galleryData);
        console.log('Gallery update notification sent');
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
        
        console.log('Notification sent:', message);
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
}

module.exports = new SocketService(); 