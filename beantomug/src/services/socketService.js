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

        this.socket.on('disconnect', () => {
            this.isConnected = false;
            this.emit('disconnected');
        });

        this.socket.on('connect_error', (error) => {
            this.isConnected = false;
            this.reconnectAttempts++;
            this.emit('connect_error', error);
        });

        // Listen for server events and emit them locally
        this.socket.on('newOrder', (data) => {
            this.emit('newOrder', data);
        });

        this.socket.on('orderUpdate', (data) => {
            this.emit('orderUpdate', data);
        });

        this.socket.on('itemPreparationUpdate', (data) => {
            this.emit('itemPreparationUpdate', data);
        });

        // Financial KPI events for real-time dashboard updates
        this.socket.on('order-completed', (data) => {
            this.emit('order-completed', data);
        });

        this.socket.on('order-status-changed', (data) => {
            this.emit('order-status-changed', data);
        });

        this.socket.on('financial-kpis-updated', (data) => {
            this.emit('financial-kpis-updated', data);
        });

        // Handle reconnection
        this.socket.on('reconnect', (attemptNumber) => {
            this.reconnectAttempts = 0;
            this.emit('reconnected', { attemptNumber });
        });

        this.socket.on('reconnect_error', (error) => {
            this.reconnectAttempts++;
            this.emit('reconnect_error', error);
        });
    }

    // Authenticate user and join appropriate rooms
    authenticate(userData) {
        if (!this.socket || !this.isConnected) {
            console.error('Socket not connected, cannot authenticate');
            return false;
        }

        try {
            // Send authentication data to server
            this.socket.emit('authenticate', userData);
            
            // Join appropriate rooms based on user role
            if (userData.userRole === 'staff' || userData.userRole === 'admin') {
                this.joinRoom('staff-room', 'staff');
            }
            
            return true;
        } catch (error) {
            return false;
        }
    }

    // Join a room
    joinRoom(roomName, roomType = 'general') {
        if (!this.socket || !this.isConnected) {
            return false;
        }

        try {
            this.socket.emit('joinRoom', { roomName, roomType });
            return true;
        } catch (error) {
            return false;
        }
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

    // Send event to server
    sendToServer(event, data) {
        if (!this.socket || !this.isConnected) {
            return false;
        }
        
        this.socket.emit(event, data);
        return true;
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

    // Get the actual Socket.IO client instance
    get socketClient() {
        return this.socket;
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