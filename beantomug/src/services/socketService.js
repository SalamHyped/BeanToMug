import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.listeners = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    // Initialize socket connection
    connect(userData = null) {
        if (this.socket && this.isConnected) {
            console.log('Socket already connected');
            return;
        }

        // Create socket connection
        this.socket = io('http://localhost:8801', {
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 1000,
            timeout: 20000
        });

        this.setupEventHandlers();

        // Authenticate user if data provided
        if (userData) {
            this.authenticate(userData);
        }
    }

    // Setup socket event handlers
    setupEventHandlers() {
        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket.id);
            this.isConnected = true;
            this.reconnectAttempts = 0;
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            this.isConnected = false;
            
            if (reason === 'io server disconnect') {
                // Server disconnected us, try to reconnect
                this.socket.connect();
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            this.reconnectAttempts++;
            
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('Max reconnection attempts reached');
            }
        });

        // Handle real-time events
        this.socket.on('newOrder', (orderData) => {
            console.log('New order received:', orderData);
            this.emit('newOrder', orderData);
        });

        this.socket.on('orderUpdate', (orderData) => {
            console.log('Order update received:', orderData);
            this.emit('orderUpdate', orderData);
        });

        this.socket.on('newTask', (taskData) => {
            console.log('New task received:', taskData);
            this.emit('newTask', taskData);
        });

        this.socket.on('taskUpdate', (taskData) => {
            console.log('Task update received:', taskData);
            this.emit('taskUpdate', taskData);
        });

        this.socket.on('galleryUpdate', (galleryData) => {
            console.log('Gallery update received:', galleryData);
            this.emit('galleryUpdate', galleryData);
        });

        this.socket.on('notification', (notificationData) => {
            console.log('Notification received:', notificationData);
            this.emit('notification', notificationData);
        });
    }

    // Authenticate user with socket
    authenticate(userData) {
        if (!this.socket || !this.isConnected) {
            console.error('Socket not connected');
            return;
        }

        this.socket.emit('authenticate', userData);
        console.log('User authenticated with socket:', userData);
    }

    // Join a specific room
    joinRoom(roomName, roomType = 'general') {
        if (!this.socket || !this.isConnected) {
            console.error('Socket not connected');
            return;
        }

        this.socket.emit('joinRoom', { roomName, roomType });
        console.log('Joined room:', roomName);
    }

    // Leave a room
    leaveRoom(roomName) {
        if (!this.socket || !this.isConnected) {
            console.error('Socket not connected');
            return;
        }

        this.socket.emit('leaveRoom', { roomName });
        console.log('Left room:', roomName);
    }

    // Add event listener
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    // Remove event listener
    off(event, callback) {
        if (!this.listeners.has(event)) return;
        
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    // Emit event to listeners
    emit(event, data) {
        if (!this.listeners.has(event)) return;
        
        this.listeners.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in ${event} listener:`, error);
            }
        });
    }

    // Disconnect socket
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.listeners.clear();
            console.log('Socket disconnected');
        }
    }

    // Get connection status
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            socketId: this.socket?.id || null,
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService; 