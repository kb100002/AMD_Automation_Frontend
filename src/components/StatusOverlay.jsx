import React from 'react';

const StatusOverlay = ({ result, error, logs, onClose }) => {
    if (!result) return null;
    const isPass = result === 'pass';

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(5px)'
        }}>
            <div className="card" style={{
                maxWidth: '500px',
                width: '90%',
                textAlign: 'center',
                borderColor: isPass ? 'var(--success-color)' : 'var(--error-color)',
                borderWidth: '2px'
            }}>
                <h2 style={{
                    fontSize: '3rem',
                    color: isPass ? 'var(--success-color)' : 'var(--error-color)',
                    marginBottom: '1rem'
                }}>
                    {isPass ? 'PASSED' : 'FAILED'}
                </h2>

                <p style={{ fontSize: '1.2rem', color: '#fff' }}>
                    {isPass ? 'Validation completed successfully. All tests passed.' : 'Validation failed.'}
                </p>

                {!isPass && (
                    <div style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginTop: '1rem',
                        color: '#ffaaaa',
                        textAlign: 'left'
                    }}>
                        <strong>Error Details:</strong>
                        <pre style={{ margin: '0.5rem 0 0 0', whiteSpace: 'pre-wrap' }}>{error}</pre>
                    </div>
                )}

                <button className="btn-primary" onClick={onClose} style={{ marginTop: '2rem', width: '100%' }}>
                    Close & Reset
                </button>

                <div style={{ marginTop: '2rem', textAlign: 'left', borderTop: '1px solid #333', paddingTop: '1rem' }}>
                    <h3 style={{ marginBottom: '0.5rem', color: '#ccc', fontSize: '1.2rem' }}>Full Validation Report</h3>
                    <div style={{
                        backgroundColor: '#000',
                        padding: '1rem',
                        borderRadius: '8px',
                        height: '200px',
                        overflowY: 'auto',
                        fontFamily: 'monospace',
                        fontSize: '0.9rem',
                        color: '#aaa',
                        whiteSpace: 'pre-wrap'
                    }}>
                        {logs && logs.join('\n')}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatusOverlay;
