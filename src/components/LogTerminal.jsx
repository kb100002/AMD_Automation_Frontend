import React, { useEffect, useRef } from 'react';

const LogTerminal = ({ logs }) => {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="card" style={{
            backgroundColor: '#000',
            fontFamily: 'monospace',
            height: '500px',
            overflowY: 'auto',
            border: '1px solid #333',
            padding: '1.5rem'
        }}>
            <div style={{ color: '#666', marginBottom: '1rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>
                &gt; Validation Logs
            </div>
            {logs.map((log, index) => (
                <div key={index} style={{ marginBottom: '0.25rem', color: log.message.includes('Error') ? '#ef4444' : '#22c55e' }}>
                    <span style={{ color: '#666', marginRight: '1rem' }}>[{log.timestamp}]</span>
                    {log.message}
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
    );
};

export default LogTerminal;
