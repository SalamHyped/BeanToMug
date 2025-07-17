import React, { useEffect, useState } from 'react';
import socketService from '../services/socketService';

const WebSocketTest = () => {
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);
    const [connectionDetails, setConnectionDetails] = useState({});
    const [isConnecting, setIsConnecting] = useState(false);

    useEffect(() => {
        // Clear any previous errors
        setError(null);
        
        // Test connection with error handling
        const attemptConnection = async () => {
            try {
                setIsConnecting(true);
                console.log('Attempting to connect to WebSocket...');
                
                await socketService.connect();
                
                // Check status every 2 seconds
                const interval = setInterval(() => {
                    const status = socketService.getConnectionStatus();
                    setConnectionStatus(status.isConnected ? 'connected' : 'disconnected');
                    setConnectionDetails(status);
                    setIsConnecting(status.isConnecting);
                    
                    // Log connection attempts
                    if (!status.isConnected && status.reconnectAttempts > 0) {
                        console.log(`Reconnection attempt ${status.reconnectAttempts}/${status.maxReconnectAttempts}`);
                    }
                }, 2000);

                // Listen for test events
                const handleTest = (data) => {
                    setMessages(prev => [...prev, `Test event: ${JSON.stringify(data)}`]);
                };

                const handleError = (error) => {
                    setError(`Socket error: ${error.message}`);
                    console.error('Socket error:', error);
                };

                const handleConnected = (data) => {
                    setMessages(prev => [...prev, `Connected: ${JSON.stringify(data)}`]);
                };

                const handleDisconnected = (data) => {
                    setMessages(prev => [...prev, `Disconnected: ${JSON.stringify(data)}`]);
                };

                socketService.on('test', handleTest);
                socketService.on('error', handleError);
                socketService.on('connected', handleConnected);
                socketService.on('disconnected', handleDisconnected);

                return () => {
                    clearInterval(interval);
                    socketService.off('test', handleTest);
                    socketService.off('error', handleError);
                    socketService.off('connected', handleConnected);
                    socketService.off('disconnected', handleDisconnected);
                };
            } catch (err) {
                setError(`Connection error: ${err.message}`);
                console.error('Connection error:', err);
                setIsConnecting(false);
            }
        };

        attemptConnection();
    }, []);

    const sendTestMessage = async () => {
        if (socketService.socket && socketService.isConnected) {
            try {
                socketService.socket.emit('test', { 
                    message: 'Hello from frontend!', 
                    timestamp: new Date().toISOString() 
                });
                setMessages(prev => [...prev, 'Test message sent']);
            } catch (err) {
                setError(`Send error: ${err.message}`);
            }
        } else {
            setError('Cannot send message - socket not connected');
        }
    };

    const forceReconnect = async () => {
        try {
            setError(null);
            setIsConnecting(true);
            socketService.disconnect();
            
            setTimeout(async () => {
                try {
                    await socketService.connect();
                } catch (err) {
                    setError(`Reconnection error: ${err.message}`);
                } finally {
                    setIsConnecting(false);
                }
            }, 1000);
        } catch (err) {
            setError(`Reconnection error: ${err.message}`);
            setIsConnecting(false);
        }
    };

    const testConnection = async () => {
        try {
            const result = await socketService.testConnection();
            setMessages(prev => [...prev, `Connection test result: ${result ? 'SUCCESS' : 'FAILED'}`]);
        } catch (err) {
            setError(`Test error: ${err.message}`);
        }
    };

    const testNotification = async () => {
        try {
            const response = await fetch('http://localhost:8801/test-notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'task',
                    message: 'Test notification from WebSocket test component'
                })
            });
            
            const result = await response.json();
            setMessages(prev => [...prev, `Test notification sent: ${JSON.stringify(result)}`]);
        } catch (err) {
            setError(`Notification test error: ${err.message}`);
        }
    };

    return (
        <div style={{ padding: '1rem', border: '1px solid #ccc', margin: '1rem', maxWidth: '600px' }}>
            <h3>WebSocket Connection Test</h3>
            
            <div style={{ marginBottom: '1rem' }}>
                <p><strong>Status:</strong> 
                    <span style={{ 
                        color: connectionStatus === 'connected' ? 'green' : 
                               isConnecting ? 'orange' : 'red',
                        fontWeight: 'bold',
                        marginLeft: '0.5rem'
                    }}>
                        {isConnecting ? 'CONNECTING' : connectionStatus.toUpperCase()}
                    </span>
                </p>
                
                <p><strong>Socket ID:</strong> {connectionDetails.socketId || 'Not connected'}</p>
                <p><strong>Reconnection Attempts:</strong> {connectionDetails.reconnectAttempts || 0}</p>
                
                {error && (
                    <div style={{ 
                        padding: '0.5rem', 
                        background: '#ffebee', 
                        border: '1px solid #f44336',
                        borderRadius: '4px',
                        marginTop: '0.5rem'
                    }}>
                        <strong>Error:</strong> {error}
                    </div>
                )}
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
                <button 
                    onClick={sendTestMessage} 
                    disabled={connectionStatus !== 'connected' || isConnecting}
                    style={{ marginRight: '0.5rem' }}
                >
                    Send Test Message
                </button>
                
                <button 
                    onClick={forceReconnect}
                    disabled={isConnecting}
                    style={{ marginRight: '0.5rem' }}
                >
                    Force Reconnect
                </button>
                
                <button 
                    onClick={testConnection}
                    disabled={connectionStatus !== 'connected' || isConnecting}
                >
                    Test Connection
                </button>
                
                <button 
                    onClick={testNotification}
                    disabled={connectionStatus !== 'connected' || isConnecting}
                    style={{ marginLeft: '0.5rem' }}
                >
                    Test Notification
                </button>
            </div>
            
            <div>
                <h4>Debug Information:</h4>
                <ul style={{ fontSize: '0.9rem', color: '#666' }}>
                    <li>Backend URL: http://localhost:8801</li>
                    <li>Frontend URL: {window.location.origin}</li>
                    <li>Socket.IO Client Version: 4.8.1</li>
                    <li>Connection Time: {new Date().toLocaleTimeString()}</li>
                    <li>Is Connecting: {isConnecting ? 'Yes' : 'No'}</li>
                </ul>
            </div>
            
            <div style={{ marginTop: '1rem' }}>
                <h4>Messages:</h4>
                {messages.length === 0 ? (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>No messages received yet...</p>
                ) : (
                    messages.map((msg, index) => (
                        <div key={index} style={{ 
                            padding: '0.5rem', 
                            background: '#f0f0f0', 
                            margin: '0.25rem 0',
                            borderRadius: '4px',
                            fontSize: '0.9rem'
                        }}>
                            {msg}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default WebSocketTest; 