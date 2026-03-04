import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';


const ConnectionManager = ({ onSelectConnections, selectedConnectionIds = [], currentUsername, token, onLogout }) => {
    const [connections, setConnections] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newConnection, setNewConnection] = useState({
        remote_ip: '',
        username: '',
        password: '',
        description: ''
    });

    useEffect(() => {
        fetchConnections();
        // Poll every 3 seconds to get live lock status
        const interval = setInterval(fetchConnections, 3000);
        return () => clearInterval(interval);
    }, []);

    const fetchConnections = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/connections`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setConnections(data);
            } else if (response.status === 401 && onLogout) {
                onLogout();
            }
        } catch (error) {
            console.error("Failed to fetch connections:", error);
        }
    };

    const handleInputChange = (e) => {
        setNewConnection({ ...newConnection, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/connections`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newConnection)
            });
            if (response.ok) {
                fetchConnections();
                setIsAdding(false);
                setNewConnection({ remote_ip: '', username: '', password: '', description: '' });
            } else if (response.status === 401 && onLogout) {
                onLogout();
            } else {
                alert("Failed to save connection.");
            }
        } catch (error) {
            console.error("Error saving connection:", error);
        }
    };

    const handleDelete = async (ip, e) => {
        e.stopPropagation(); // Prevent selection when deleting
        if (!window.confirm(`Delete connection ${ip}?`)) return;

        try {
            const response = await fetch(`${API_BASE_URL}/connections/${ip}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                fetchConnections();
                if (selectedConnectionId === ip) {
                    onSelectConnection(null);
                }
            } else if (response.status === 401 && onLogout) {
                onLogout();
            }
        } catch (error) {
            console.error("Error deleting connection:", error);
        }
    };

    return (
        <div className="connection-manager">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: '#fff' }}>Saved Connections</h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="btn-secondary"
                    style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
                >
                    {isAdding ? 'Cancel' : '+ Add New'}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSave} style={{ background: '#222', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #444' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
                        <input
                            type="text"
                            name="remote_ip"
                            placeholder="IP Address"
                            value={newConnection.remote_ip}
                            onChange={handleInputChange}
                            required
                            style={inputStyle}
                        />
                        <input
                            type="text"
                            name="username"
                            placeholder="Username"
                            value={newConnection.username}
                            onChange={handleInputChange}
                            required
                            style={inputStyle}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={newConnection.password}
                            onChange={handleInputChange}
                            required
                            style={inputStyle}
                        />
                        <input
                            type="text"
                            name="description"
                            placeholder="Description (Optional)"
                            value={newConnection.description}
                            onChange={handleInputChange}
                            style={inputStyle}
                        />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>Save Connection</button>
                    </div>
                </form>
            )}

            <div style={{ display: 'grid', gap: '0.8rem' }}>
                {connections.length === 0 && !isAdding && (
                    <p style={{ color: '#888', fontStyle: 'italic', textAlign: 'center' }}>No saved connections found.</p>
                )}
                {connections.map(conn => {
                    const lockedBy = conn.in_use_by;
                    const isLockedByOther = lockedBy && lockedBy !== currentUsername;
                    const isSelected = selectedConnectionIds.includes(conn.remote_ip);

                    return (
                        <div
                            key={conn.remote_ip}
                            onClick={() => {
                                if (isLockedByOther) return; // block selection
                                const nextIds = isSelected
                                    ? selectedConnectionIds.filter(id => id !== conn.remote_ip)
                                    : [...selectedConnectionIds, conn.remote_ip];

                                // Map IDs back to full connection objects
                                const nextObjects = connections.filter(c => nextIds.includes(c.remote_ip));
                                onSelectConnections(nextObjects);
                            }}
                            title={isLockedByOther ? `In use by ${lockedBy}` : ''}
                            style={{
                                ...cardStyle,
                                border: isSelected ? '2px solid var(--accent-color)' : isLockedByOther ? '1px solid #ff8c00' : '1px solid #333',
                                background: isSelected ? '#2a2a2a' : isLockedByOther ? 'rgba(255,140,0,0.07)' : '#222',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                cursor: isLockedByOther ? 'not-allowed' : 'pointer',
                                opacity: isLockedByOther ? 0.75 : 1
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={isSelected}
                                readOnly
                                disabled={isLockedByOther}
                                style={{ width: '20px', height: '20px', cursor: isLockedByOther ? 'not-allowed' : 'pointer' }}
                            />
                            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#fff' }}>
                                        {conn.description || conn.remote_ip}
                                    </div>
                                    <div style={{ color: '#aaa', fontSize: '0.9rem' }}>
                                        {conn.username}@{conn.remote_ip}
                                    </div>
                                    {lockedBy && (
                                        <div style={{
                                            marginTop: '0.3rem',
                                            display: 'inline-block',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold',
                                            color: isLockedByOther ? '#ff8c00' : '#27C93F',
                                            background: isLockedByOther ? 'rgba(255,140,0,0.15)' : 'rgba(39,201,63,0.15)',
                                            border: `1px solid ${isLockedByOther ? '#ff8c00' : '#27C93F'}`,
                                            borderRadius: '4px',
                                            padding: '0.1rem 0.5rem'
                                        }}>
                                            {isLockedByOther ? `🔒 In Use by ${lockedBy}` : `🟢 In Use by You`}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={(e) => handleDelete(conn.remote_ip, e)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#dc3545',
                                        cursor: 'pointer',
                                        padding: '0.5rem',
                                        fontSize: '1.2rem'
                                    }}
                                    title="Delete"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const inputStyle = {
    padding: '0.6rem',
    borderRadius: '4px',
    background: '#333',
    border: '1px solid #555',
    color: '#fff',
    width: '100%'
};

const cardStyle = {
    padding: '1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
};

export default ConnectionManager;
