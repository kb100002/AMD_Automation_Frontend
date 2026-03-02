import React, { useState, useEffect } from 'react';

const BenchmarkResults = ({ onClose, token }) => {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('chart'); // 'chart' or 'table'

    const fetchResults = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('https://amd-automation-1.onrender.com/benchmark-results', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setResults(data);
        } catch (err) {
            setError('Failed to fetch benchmark results');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResults();
    }, []);

    if (loading) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }}>
                <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Run the Phoronix Test Suite to generate the results.</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }}>
                <div className="card" style={{ padding: '2rem', textAlign: 'center', maxWidth: '400px' }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#ff6b6b' }}>Error</div>
                    <div style={{ color: '#aaa', marginBottom: '1.5rem' }}>{error}</div>
                    <button onClick={onClose} style={{
                        padding: '0.6rem 1.5rem',
                        background: 'var(--accent-color)',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'white',
                        cursor: 'pointer'
                    }}>Close</button>
                </div>
            </div>
        );
    }

    const maxFps = results?.results ? Math.max(...results.results.map(r => r.fps)) : 100;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
        }} onClick={onClose}>
            <div className="card" style={{
                width: '90%',
                maxWidth: '900px',
                maxHeight: '90vh',
                overflow: 'auto',
                padding: '2rem'
            }} onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                    borderBottom: '2px solid var(--accent-color)',
                    paddingBottom: '1rem'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>GPU Benchmark Results</h2>
                        <div style={{ color: '#888', fontSize: '0.9rem', marginTop: '0.3rem' }}>
                            {results?.test_name || 'Unknown Test'}
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#888',
                        fontSize: '2rem',
                        cursor: 'pointer',
                        padding: '0',
                        lineHeight: '1'
                    }}>&times;</button>
                </div>

                {/* System Info */}
                {results?.system_info && (
                    <div style={{
                        background: '#2a2a2a',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        border: '1px solid #444'
                    }}>
                        <h3 style={{ margin: '0 0 0.8rem 0', fontSize: '1rem', color: 'var(--accent-color)' }}>System Information</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                            {results.system_info.gpu && (
                                <>
                                    <div style={{ color: '#aaa' }}>GPU:</div>
                                    <div style={{ color: '#fff' }}>{results.system_info.gpu}</div>
                                </>
                            )}
                            {results.system_info.driver && (
                                <>
                                    <div style={{ color: '#aaa' }}>Driver:</div>
                                    <div style={{ color: '#fff' }}>{results.system_info.driver}</div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* View Mode Toggle */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <button
                        onClick={() => setViewMode('chart')}
                        style={{
                            padding: '0.5rem 1rem',
                            background: viewMode === 'chart' ? 'var(--accent-color)' : '#333',
                            border: 'none',
                            borderRadius: '4px',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: viewMode === 'chart' ? 'bold' : 'normal'
                        }}
                    >
                        📊 Chart View
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        style={{
                            padding: '0.5rem 1rem',
                            background: viewMode === 'table' ? 'var(--accent-color)' : '#333',
                            border: 'none',
                            borderRadius: '4px',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: viewMode === 'table' ? 'bold' : 'normal'
                        }}
                    >
                        📋 Table View
                    </button>
                    <button
                        onClick={fetchResults}
                        style={{
                            padding: '0.5rem 1rem',
                            background: '#28a745',
                            border: 'none',
                            borderRadius: '4px',
                            color: 'white',
                            cursor: 'pointer',
                            marginLeft: 'auto'
                        }}
                    >
                        🔄 Refresh
                    </button>
                </div>

                {/* Chart View */}
                {viewMode === 'chart' && results?.results && (
                    <div style={{ marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>FPS Performance</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {results.results.map((result, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        minWidth: '180px',
                                        fontSize: '0.85rem',
                                        color: '#aaa',
                                        textAlign: 'right'
                                    }}>
                                        {result.configuration}
                                    </div>
                                    <div style={{ flex: 1, position: 'relative', height: '30px' }}>
                                        <div style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            bottom: 0,
                                            width: `${(result.fps / maxFps) * 100}%`,
                                            background: `linear-gradient(90deg, var(--accent-color), #ff6b6b)`,
                                            borderRadius: '4px',
                                            transition: 'width 0.3s ease'
                                        }}></div>
                                    </div>
                                    <div style={{
                                        minWidth: '60px',
                                        fontWeight: 'bold',
                                        color: '#fff',
                                        fontSize: '0.9rem'
                                    }}>
                                        {result.fps.toFixed(1)} FPS
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Table View */}
                {viewMode === 'table' && results?.results && (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '0.9rem'
                        }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #444' }}>
                                    <th style={{ padding: '0.8rem', textAlign: 'left', color: 'var(--accent-color)' }}>Configuration</th>
                                    <th style={{ padding: '0.8rem', textAlign: 'right', color: 'var(--accent-color)' }}>FPS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.results.map((result, idx) => (
                                    <tr key={idx} style={{
                                        borderBottom: '1px solid #333',
                                        background: idx % 2 === 0 ? '#1a1a1a' : 'transparent'
                                    }}>
                                        <td style={{ padding: '0.8rem' }}>{result.configuration}</td>
                                        <td style={{ padding: '0.8rem', textAlign: 'right', fontWeight: 'bold' }}>
                                            {result.fps.toFixed(1)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* No Results */}
                {(!results?.results || results.results.length === 0) && (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        color: '#888',
                        fontSize: '1.1rem'
                    }}>
                        No benchmark results available
                    </div>
                )}

            </div>
        </div>
    );
};

export default BenchmarkResults;
