import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.listeners = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.connectionUrl = 'http://localhost:8801';
        this.isConnecting = false;
        this.pendingAuthentication = null;
    }

    // Initialize socket connection
    connect(userData = null) {
        if (this.socket && this.isConnected) {
            return Promise.resolve();
        }

        if (this.isConnecting) {
            if (userData) {
                this.pendingAuthentication = userData;
            }
            return Promise.resolve();
        }

        this.isConnecting = true;

        return new Promise((resolve, reject) => {
            try {
                // Create socket connection
                this.socket = io(this.connectionUrl, {
                    transports: ['websocket', 'polling'],
                    autoConnect: true,
                    reconnection: true,
                    reconnectionAttempts: this.maxReconnectAttempts,
                    reconnectionDelay: 1000,
                    timeout: 20000,
                    forceNew: true
                });

                this.setupEventHandlers();

                // Set up connection timeout
                const connectionTimeout = setTimeout(() => {
                    if (!this.isConnected) {
                        this.isConnecting = false;
                        reject(new Error('Connection timeout'));
                    }
                }, 10000);

                // Handle successful connection
                const onConnect = () => {
                    clearTimeout(connectionTimeout);
                    this.isConnecting = false;
                    
                    // Handle pending authentication
                    if (this.pendingAuthentication) {
                        this.authenticate(this.pendingAuthentication);
                        this.pendingAuthentication = null;
                    }
                    
                    resolve();
                };

                // Handle connection error
                const onConnectError = (error) => {
                    clearTimeout(connectionTimeout);
                    this.isConnecting = false;
                    reject(error);
                };

                this.socket.on('connect', onConnect);
                this.socket.on('connect_error', onConnectError);

                // Authenticate user if data provided and already connected
                if (userData && this.isConnected) {
                    this.authenticate(userData);
                }
            } catch (error) {
                this.isConnecting = false;
                console.error('Error creating socket connection:', error);
                reject(error);
            }
        });
    }

    // Setup socket event handlers
    setupEventHandlers() {
        if (!this.socket) {
            return;
        }

        this.socket.on('connect', () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.emit('connected', { socketId: this.socket.id });
        });

        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;
            this.emit('disconnected', { reason });
            
            if (reason === 'io server disconnect') {
                this.socket.connect();
            }
        });

        this.socket.on('connect_error', (error) => {
            this.reconnectAttempts++;
            this.emit('error', error);
            
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                this.emit('maxReconnectAttemptsReached', { attempts: this.reconnectAttempts });
            }
        });

        this.socket.on('reconnect', (attemptNumber) => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.emit('reconnected', { attemptNumber });
        });

        this.socket.on('reconnect_error', (error) => {
            this.emit('error', error);
        });

        this.socket.on('reconnect_failed', () => {
            this.emit('reconnectFailed');
        });

        // Handle real-time events
        this.socket.on('newOrder', (orderData) => {
            this.emit('newOrder', orderData);
        });

        this.socket.on('orderUpdate', (orderData) => {
            this.emit('orderUpdate', orderData);
        });

        this.socket.on('newTask', (taskData) => {
            this.emit('newTask', taskData);
        });

        this.socket.on('taskUpdate', (taskData) => {
            this.emit('taskUpdate', taskData);
        });

        this.socket.on('galleryUpdate', (galleryData) => {
            this.emit('galleryUpdate', galleryData);
        });

        this.socket.on('notification', (notificationData) => {
            this.emit('notification', notificationData);
        });

        // Handle test events
        this.socket.on('test', (data) => {
            this.emit('test', data);
        });
    }

    // Authenticate user with socket
    authenticate(userData) {
        if (!this.socket) {
            this.pendingAuthentication = userData;
            return;
        }

        if (!this.isConnected) {
            this.pendingAuthentication = userData;
            return;
        }

        this.socket.emit('authenticate', userData);
        this.pendingAuthentication = null;
    }

    // Join a specific room
    joinRoom(roomName, roomType = 'general') {
        if (!this.socket || !this.isConnected) {
            return;
        }

        this.socket.emit('joinRoom', { roomName, roomType });
    }

    // Leave a room
    leaveRoom(roomName) {
        if (!this.socket || !this.isConnected) {
            return;
        }

        this.socket.emit('leaveRoom', { roomName });
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
            this.reconnectAttempts = 0;
            this.isConnecting = false;
            this.pendingAuthentication = null;
            this.listeners.clear();
        }
    }

    // Get connection status
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            isConnecting: this.isConnecting,
            socketId: this.socket?.id || null,
            reconnectAttempts: this.reconnectAttempts,
            maxReconnectAttempts: this.maxReconnectAttempts,
            connectionUrl: this.connectionUrl,
            pendingAuthentication: !!this.pendingAuthentication
        };
    }

    // Test connection
    testConnection() {
        if (!this.socket || !this.isConnected) {
            return Promise.resolve(false);
        }

        return new Promise((resolve) => {
            const testData = { test: true, timestamp: Date.now() };
            
            const timeout = setTimeout(() => {
                this.socket.off('test', handleTest);
                resolve(false);
            }, 5000);

            const handleTest = (data) => {
                clearTimeout(timeout);
                this.socket.off('test', handleTest);
                resolve(true);
            };

            this.socket.on('test', handleTest);
            this.socket.emit('test', testData);
        });
    }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService; 