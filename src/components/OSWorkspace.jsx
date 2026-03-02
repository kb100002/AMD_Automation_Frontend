import React, { useState, useEffect } from 'react';
import LogTerminal from './LogTerminal';
import BenchmarkResults from './BenchmarkResults';
import { PTS_BENCHMARKS } from '../data/benchmarks';

const OSWorkspace = ({ osId, module, onBack, onSubmit, logs, result, errorMsg, isRunning, initialValidations, initialValidationDelayDays, initialBenchmarkName, initialConnection, notificationEmails, targetPassCount, executeWithLogs, token, onLogout }) => {
    const [formData, setFormData] = useState({
        targetPlatform: 'baremetal',
        osType: osId === 'ubuntu' ? 'Linux' : osId === 'rhel' ? 'RHEL' : 'Debian',
        kernelType: 'generic',
        kernelVersion: '',
        kernelUrl: '',
        configPath: '',
        testSuite: 'all',
        validations: initialValidations || ['sleep_state', 'pts_testing'],
        validation_delay_days: initialValidationDelayDays || 0,
        benchmarkName: initialBenchmarkName || 'pts/unigine-heaven',
        notification_emails: notificationEmails || [],
        target_pass_count: targetPassCount || 0,
        // Remote connection details - Initialize from prop if available
        remote_ip: initialConnection?.remote_ip || '',
        username: initialConnection?.username || '',
        password: initialConnection?.password || ''
    });

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [showBenchmarkResults, setShowBenchmarkResults] = useState(false);

    const [kernelTypes, setKernelTypes] = useState([]);
    const [kernelVersions, setKernelVersions] = useState([]); // Array of {version, download_url}
    const [availableBenchmarks, setAvailableBenchmarks] = useState(PTS_BENCHMARKS.map(b => b.id));
    const [benchmarkSearch, setBenchmarkSearch] = useState('');

    // Filter benchmarks based on search
    const filteredBenchmarks = availableBenchmarks.filter(b =>
        b.toLowerCase().includes(benchmarkSearch.toLowerCase())
    );

    // Sync selection when filtering
    useEffect(() => {
        if (filteredBenchmarks.length > 0) {
            // If current benchmark is not in the filtered list, select the first filtered one
            if (!filteredBenchmarks.includes(formData.benchmarkName)) {
                setFormData(prev => ({ ...prev, benchmarkName: filteredBenchmarks[0] }));
            }
        }
    }, [benchmarkSearch, filteredBenchmarks, formData.benchmarkName]);


    useEffect(() => {
        // Fetch kernel types on mount
        const fetchTypes = async () => {
            try {
                const response = await fetch('https://amd-automation-1.onrender.com/kernel-types', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const types = await response.json();
                    setKernelTypes(types);
                    // Set default if available
                    if (types.length > 0) {
                        setFormData(prev => ({ ...prev, kernelType: types[0] }));
                    }
                } else if (response.status === 401 && onLogout) {
                    onLogout();
                }
            } catch (error) {
                console.error("Failed to fetch kernel types:", error);
            }
        };
        fetchTypes();
    }, []);

    // Parse logs to extract benchmark names
    useEffect(() => {
        if (!logs || logs.length === 0) return;

        const benchmarks = [];
        let inBenchmarkSection = false;

        for (const logObj of logs) {
            const log = logObj.message;
            if (log.includes("--- Available Benchmarks ---")) {
                inBenchmarkSection = true;
                continue;
            }
            if (log.includes("--- End of List ---")) {
                inBenchmarkSection = false;
                continue;
            }

            if (inBenchmarkSection && log.includes("/")) {
                const trimmed = log.trim();
                if (trimmed && !trimmed.startsWith("Phoronix Test Suite")) {
                    benchmarks.push(trimmed);
                }
            }
        }

        if (benchmarks.length > 0) {
            // Ensure pts/cpu is always in the list even if parsing from logs
            const finalBenchmarks = benchmarks.includes('pts/cpu')
                ? benchmarks
                : ['pts/cpu', ...benchmarks];

            setAvailableBenchmarks(finalBenchmarks);
            if (!formData.benchmarkName && finalBenchmarks.length > 0) {
                setFormData(prev => ({ ...prev, benchmarkName: finalBenchmarks[0] }));
            }
        }
    }, [logs]);

    const handleRunBenchmark = async () => {
        if (!formData.benchmarkName) {
            alert("Please select a benchmark first.");
            return;
        }

        await executeWithLogs('/run-benchmark', formData);
    };

    const handleKeyDown = (e) => {
        // If Enter is pressed while focused in benchmark section, run benchmark instead of form submit
        if (e.key === 'Enter') {
            const isBenchmarkSection = e.target.closest('.benchmark-section');
            if (isBenchmarkSection) {
                e.preventDefault();
                handleRunBenchmark();
            }
        }
    };

    const getOSStyles = () => {
        switch (osId) {
            case 'ubuntu':
                return {
                    header: 'linear-gradient(90deg, #E95420 0%, #772953 100%)',
                    name: 'Ubuntu Environment'
                };
            case 'rhel':
                return {
                    header: 'linear-gradient(90deg, #EE0000 0%, #990000 100%)',
                    name: 'Red Hat Enterprise Linux'
                };
            case 'Debian':
                return {
                    header: 'linear-gradient(90deg, #262577 0%, #93227F 100%)',
                    name: 'Debian Environment'
                };
            default:
                return { header: '#333', name: 'Unknown OS' };
        }
    };

    const styles = getOSStyles();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleVersionChange = (e) => {
        const selectedVer = e.target.value;
        const selectedObj = kernelVersions.find(v => v.version === selectedVer);
        setFormData({
            ...formData,
            kernelVersion: selectedVer,
            kernelUrl: selectedObj ? selectedObj.download_url : ''
        });
    };

    const handleRun = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleAIAnalysis = async () => {
        setIsAnalyzing(true);
        setAiAnalysis(null);
        try {
            const response = await fetch(`https://amd-automation-1.onrender.com/analyze-logs`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.analysis) {
                setAiAnalysis(data.analysis);
            } else if (data.error) {
                setAiAnalysis(`Error: ${data.error}`);
            } else if (response.status === 401 && onLogout) {
                onLogout();
            }
        } catch (error) {
            setAiAnalysis("Failed to connect to AI Analysis service.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleCancel = async () => {
        if (!window.confirm("Are you sure you want to cancel the current execution? This will attempt to terminate all remote operations.")) {
            return;
        }
        try {
            const response = await fetch(`https://amd-automation-1.onrender.com/cancel`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                console.log("Cancel requested:", data.message);
            } else if (response.status === 401 && onLogout) {
                onLogout();
            }
        } catch (error) {
            console.error("Failed to cancel execution:", error);
        }
    };

    return (
        <div className="os-workspace" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', gap: '1rem' }}>

            {/* OS Header Bar */}
            <div style={{
                background: styles.header,
                padding: '1rem 2rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'white',
                boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button onClick={onBack} style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginRight: '1rem'
                    }}>&larr; Back</button>
                    <h2 style={{ margin: 0 }}>{styles.name}</h2>
                </div>
                <div>
                    <span style={{ opacity: 0.8 }}>User: admin</span>
                </div>
            </div>

            {/* Error Banner */}
            {result === 'fail' && errorMsg && (
                <div style={{ background: '#ff4d4d', color: 'white', padding: '1rem', borderRadius: '4px', margin: '0 2rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>❌ Validation Failed: {errorMsg}</span>
                    <button onClick={() => window.location.reload()} style={{ background: 'rgba(0,0,0,0.2)', border: 'none', color: 'white', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer' }}>Dismiss</button>
                </div>
            )}

            <div style={{ display: 'flex', flex: 1, gap: '1rem' }}>

                {/* Left Panel: Configuration */}
                <div className="card" style={{ flex: '0 0 350px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                    <h3 style={{ borderBottom: '1px solid #444', paddingBottom: '0.5rem', marginBottom: '1rem' }}>System Configuration</h3>

                    <form onSubmit={handleRun} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        {/* Sleep State configuration */}

                        {formData.validations.includes('sleep_state') && module === 'kernel' && (
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem', color: '#aaa' }}>Sleep State</label>
                                <select name="testSuite" value={formData.testSuite} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '4px' }}>
                                    <option value="s2idle">Suspend to Idle</option>
                                    <option value="deep">Suspend to RAM (deep)</option>
                                    <option value="hibernate">Suspend to Disk (hibernate)</option>
                                    <option value="all">All States</option>
                                </select>
                            </div>
                        )}

                        {/* Remote Connection Info (Read-Only) */}
                        <div style={{ padding: '0.8rem', background: '#2a2a2a', borderRadius: '4px', border: '1px solid #444', marginTop: '0.5rem' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#ff6b6b' }}>Target System</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#ccc' }}>
                                <span style={{ background: '#111', padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px solid #333' }}>
                                    {formData.username}@{formData.remote_ip}
                                </span>
                                {(formData.remote_ip || formData.username) ? (
                                    <span style={{ color: '#27C93F', fontSize: '0.8rem' }}>● Configured</span>
                                ) : (
                                    <span style={{ color: '#ff6b6b', fontSize: '0.8rem' }}>⚠️ Not Configured</span>
                                )}
                            </div>
                            {/* Hidden inputs to ensure form submission still works if it relies on DOM elements, 
                                though React state usually handles it. Keeps it safe. */}
                            <input type="hidden" name="remote_ip" value={formData.remote_ip || ''} />
                            <input type="hidden" name="username" value={formData.username || ''} />
                            <input type="hidden" name="password" value={formData.password || ''} />
                        </div>

                        {/* Validation Delay */}
                        <div style={{ padding: '0.8rem', background: '#222', borderRadius: '4px', border: '1px solid #444' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#888', marginBottom: '0.3rem' }}>Validation Delay (Days)</label>
                            <input
                                type="number"
                                name="validation_delay_days"
                                step="0.1"
                                min="0"
                                value={formData.validation_delay_days}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    background: '#111',
                                    border: '1px solid #444',
                                    color: '#fff',
                                    borderRadius: '4px',
                                    fontSize: '0.9rem'
                                }}
                            />
                        </div>

                        {/* Benchmark Selection Section */}
                        {
                            formData.validations.includes('pts_testing') && (
                                <div
                                    className="benchmark-section"
                                    onKeyDown={handleKeyDown}
                                    style={{ padding: '0.8rem', background: '#2a2a2a', borderRadius: '4px', border: '1px solid #444', marginTop: '0.5rem' }}
                                >
                                    <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '0.95rem', color: '#27C93F' }}>Benchmark Selection</h4>

                                    <div style={{ marginBottom: '0.8rem' }}>
                                        {availableBenchmarks.length > 0 && (
                                            <div style={{ marginBottom: '0.5rem' }}>
                                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.3rem' }}>🔍 Search Benchmarks</label>
                                                <input
                                                    type="text"
                                                    placeholder="Type to filter benchmarks..."
                                                    value={benchmarkSearch}
                                                    onChange={(e) => setBenchmarkSearch(e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.5rem',
                                                        background: '#111',
                                                        border: '1px solid #444',
                                                        color: '#fff',
                                                        borderRadius: '4px',
                                                        fontSize: '0.85rem'
                                                    }}
                                                />
                                                {benchmarkSearch && (
                                                    <p style={{ fontSize: '0.7rem', color: '#888', marginTop: '0.3rem', marginBottom: 0 }}>
                                                        Showing {filteredBenchmarks.length} of {availableBenchmarks.length} benchmarks
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <select
                                            name="benchmarkName"
                                            value={formData.benchmarkName || 'pts/unigine-heaven'}
                                            onChange={handleChange}
                                            style={{ width: '100%', padding: '0.5rem', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px', marginBottom: '0.5rem' }}
                                        >
                                            {filteredBenchmarks.map(bId => {
                                                const b = PTS_BENCHMARKS.find(x => x.id === bId);
                                                return (
                                                    <option key={bId} value={bId}>
                                                        {bId} {b ? `- ${b.name}` : ''}
                                                    </option>
                                                );
                                            })}
                                            {filteredBenchmarks.length === 0 && availableBenchmarks.length > 0 && (
                                                <option value="" disabled>No benchmarks match your search</option>
                                            )}
                                        </select>

                                        <button
                                            type="button"
                                            onClick={handleRunBenchmark}
                                            disabled={!formData.benchmarkName || availableBenchmarks.length === 0 || isRunning}
                                            style={{
                                                width: '100%',
                                                padding: '0.6rem',
                                                background: (formData.benchmarkName && availableBenchmarks.length > 0 && !isRunning) ? '#27C93F' : '#555',
                                                border: 'none',
                                                color: 'white',
                                                borderRadius: '4px',
                                                cursor: (formData.benchmarkName && availableBenchmarks.length > 0 && !isRunning) ? 'pointer' : 'not-allowed',
                                                fontWeight: 'bold',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            🚀 Pass and Run Benchmark
                                        </button>
                                        {availableBenchmarks.length === 0 && (
                                            <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.5rem', marginBottom: 0 }}>
                                                Click "Execute Operations" to list available benchmarks
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )
                        }


                        <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                            <button
                                type="submit"
                                disabled={isRunning}
                                style={{
                                    width: '100%',
                                    padding: '0.8rem',
                                    background: isRunning ? '#555' : 'var(--accent-color)',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    cursor: isRunning ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isRunning ? 'Running...' : 'Execute Operations'}
                            </button>
                            {isRunning && (
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem',
                                        background: '#dc3545',
                                        border: 'none',
                                        borderRadius: '4px',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        marginTop: '0.8rem'
                                    }}
                                >
                                    🛑 Cancel Validation
                                </button>
                            )}
                        </div>
                    </form >
                </div >

                {/* Right Panel: Terminal */}
                < div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ background: '#111', padding: '0.5rem 1rem', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                            {osId === 'ubuntu' ? 'root@ubuntu-lab:~#' :
                                osId === 'rhel' ? '[root@rhel-server ~]#' :
                                    '[root@Debian-node ~]#'}
                        </span>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <button
                                onClick={handleAIAnalysis}
                                disabled={isAnalyzing || logs.length === 0}
                                style={{
                                    background: '#007bff',
                                    border: 'none',
                                    color: 'white',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    cursor: isAnalyzing ? 'wait' : 'pointer',
                                    fontWeight: 'bold',
                                    opacity: (isAnalyzing || logs.length === 0) ? 0.6 : 1
                                }}
                            >
                                {isAnalyzing ? 'Analyzing...' : 'AI Analyze Logs'}
                            </button>
                            <button
                                onClick={() => window.open(`https://amd-automation-1.onrender.com/download-report`, '_blank')}
                                style={{
                                    background: '#28a745',
                                    border: 'none',
                                    color: 'white',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Download Report
                            </button>
                            {formData.validations.includes('pts_testing') && (
                                <>
                                    <button
                                        onClick={() => setShowBenchmarkResults(true)}
                                        style={{
                                            background: '#ff6b6b',
                                            border: 'none',
                                            color: 'white',
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem',
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        📊 Results UI
                                    </button>
                                    <button
                                        onClick={() => window.open(`https://amd-automation-1.onrender.com/benchmark-report-html`, '_blank')}
                                        disabled={isRunning || !result}
                                        style={{
                                            background: '#17a2b8',
                                            border: 'none',
                                            color: 'white',
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem',
                                            cursor: (isRunning || !result) ? 'not-allowed' : 'pointer',
                                            fontWeight: 'bold',
                                            opacity: (isRunning || !result) ? 0.6 : 1
                                        }}
                                    >
                                        🌐 View HTML Report
                                    </button>
                                </>
                            )}
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FF5F56' }}></div>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FFBD2E' }}></div>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27C93F' }}></div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.3rem' }}>Notification Emails</label>
                                <input
                                    type="text"
                                    value={formData.notification_emails.join(', ')}
                                    onChange={(e) => {
                                        const emails = e.target.value.split(',').map(email => email.trim()).filter(email => email);
                                        setFormData(prev => ({ ...prev, notification_emails: emails }));
                                    }}
                                    placeholder="user1@example.com, user2@example.com"
                                    style={{ width: '100%', padding: '0.4rem', background: '#222', border: '1px solid #444', color: '#fff', fontSize: '0.85rem', borderRadius: '4px' }}
                                />
                            </div>
                        </div>
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <LogTerminal logs={logs} style={{ height: '100%', margin: 0, borderRadius: 0, border: 'none' }} />
                    </div>
                </div >

                {
                    aiAnalysis && (
                        <div className="card" style={{
                            flex: '0 0 300px',
                            overflowY: 'auto',
                            borderLeft: '4px solid #007bff',
                            background: '#1e1e1e'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #444', paddingBottom: '0.5rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#007bff' }}>AI Error Analysis</h3>
                                <button onClick={() => setAiAnalysis(null)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
                            </div>
                            <div style={{
                                fontSize: '0.9rem',
                                lineHeight: '1.5',
                                color: '#e0e0e0',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {aiAnalysis}
                            </div>
                        </div>
                    )
                }

            </div >

            {/* Benchmark Results Modal */}
            {
                showBenchmarkResults && (
                    <BenchmarkResults onClose={() => setShowBenchmarkResults(false)} token={token} />
                )
            }
        </div >
    );
};

export default OSWorkspace;
