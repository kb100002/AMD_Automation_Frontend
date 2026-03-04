
import React, { useState, useEffect, useRef } from 'react';
import { PTS_BENCHMARKS } from '../data/benchmarks';
import { API_BASE_URL } from '../config';


const KernelCIMonitor = ({ onBack, selectedConnections = [], gitUrl, defaultBenchmark, defaultValidations, defaultEmails, defaultPassCount, defaultDelay, token, onLogout }) => {
    // allStatus maps host -> { is_running, status, logs, config }
    const [allStatus, setAllStatus] = useState({});
    const [selectedHost, setSelectedHost] = useState(null);

    const DISABLE_STOP_STATUSES = [
        "Building Kernel",
        "Installing Kernel",
        "Updating Bootloader",
        "Checking dmesg",
        "Verifying Reboot",
        "Running Validation"
    ];

    // Per-host local config overrides (before starting)
    const [localConfigs, setLocalConfigs] = useState({});
    const [benchmarkSearch, setBenchmarkSearch] = useState('');

    const logsEndRef = useRef(null);
    const pollIntervalRef = useRef(null);

    useEffect(() => {
        if (selectedConnections.length === 1 && !selectedHost) {
            setSelectedHost(selectedConnections[0].remote_ip);
        }
    }, [selectedConnections, selectedHost]);



    useEffect(() => {
        fetchStatus();
        pollIntervalRef.current = setInterval(fetchStatus, 2000);
        return () => clearInterval(pollIntervalRef.current);
    }, []);

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: "auto" });
        }
    }, [selectedHost, allStatus[selectedHost]?.logs]);

    const fetchStatus = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/ci/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAllStatus(data);
            } else if (res.status === 401 && onLogout) {
                onLogout();
            }
        } catch (err) {
            console.error("Failed to fetch CI status:", err);
        }
    };

    // Initial config for a new connection
    const getDefaultConfig = (host) => ({
        git_url: gitUrl,
        branch: 'master',
        poll_interval: 300,
        build_dir: '/home/test/linux-kernel',
        ssh_host: host,
        benchmarkName: defaultBenchmark || 'pts/unigine-heaven',
        selected_validations: defaultValidations || ["sleep_state", "pts_testing"],
        notification_emails: defaultEmails || [],
        target_pass_count: defaultPassCount || 0,
        validation_delay_days: defaultDelay || 0,
    });

    const getTargetConfig = (host) => {
        const backendConfig = allStatus[host]?.config || {};
        const connectionInfo = selectedConnections.find(c => c.remote_ip === host) || {};

        return {
            ...getDefaultConfig(host),
            ...backendConfig,
            ...(localConfigs[host] || {}),
            ssh_user: connectionInfo.username || '',
            ssh_password: connectionInfo.password || ''
        };
    };

    const updateLocalConfig = (host, updates) => {
        setLocalConfigs(prev => ({
            ...prev,
            [host]: { ...(prev[host] || {}), ...updates }
        }));
    };

    const handleStart = async (host) => {
        const finalConfig = getTargetConfig(host);
        try {
            const res = await fetch(`${API_BASE_URL}/ci/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(finalConfig)
            });
            if (res.ok) {
                fetchStatus();
            } else if (res.status === 401 && onLogout) {
                onLogout();
            }
        } catch (err) {
            console.error("Failed to start CI:", err);
        }
    };

    const handleStop = async (host) => {
        const hostStatus = allStatus[host]?.status;
        if (DISABLE_STOP_STATUSES.includes(hostStatus)) {
            console.warn(`Cannot stop CI for ${host} while in status: ${hostStatus}`);
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/ci/stop?host=${host}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                // Stop the /ci/status polling
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                }
                fetchStatus(); // One final fetch to update UI
            } else if (res.status === 401 && onLogout) {
                onLogout();
            }
        } catch (err) {
            console.error("Failed to stop CI:", err);
        }
    };

    const handleDownloadLogs = async () => {
        if (!selectedHost) return;
        try {
            const res = await fetch(`${API_BASE_URL}/logs/${selectedHost}/download`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `logs_${selectedHost}.txt`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
        } catch (err) {
            console.error("Failed to download logs:", err);
        }
    };

    const [activeTab, setActiveTab] = useState('logs');

    const currentStatus = allStatus[selectedHost] || { is_running: false, status: 'Idle', logs: [], analysis_results: {} };
    const currentConfig = getTargetConfig(selectedHost);
    const isStopDisabled = DISABLE_STOP_STATUSES.includes(currentStatus.status);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '1rem', color: '#fff', overflow: 'hidden' }}>
            {/* Header */}
            <div style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button onClick={onBack} style={backButtonStyle}>&larr; Back</button>
                    <h2 style={{ margin: 0 }}>Multi-System Kernel CI</h2>
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                    Monitoring {selectedConnections.length} system(s)
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, gap: '1rem', overflow: 'hidden' }}>

                {/* Host Sidebar */}
                <div className="card" style={{ flex: '0 0 250px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0, color: '#aaa', fontSize: '0.8rem', textTransform: 'uppercase' }}>Fleet Control</h4>
                    </div>

                    <button
                        onClick={() => setSelectedHost(null)}
                        style={{
                            ...sidebarItemStyle,
                            background: selectedHost === null ? 'rgba(76, 161, 175, 0.2)' : 'transparent',
                            border: selectedHost === null ? '1px solid #4ca1af' : '1px solid transparent',
                            fontWeight: 'bold',
                            textAlign: 'center'
                        }}
                    >
                        📊 Fleet Dashboard
                    </button>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <button onClick={() => selectedConnections.forEach(c => handleStart(c.remote_ip))} style={{ ...miniButtonStyle, background: '#27C93F' }}>Start All</button>
                        <button
                            onClick={() => selectedConnections.forEach(c => {
                                if (!DISABLE_STOP_STATUSES.includes(allStatus[c.remote_ip]?.status)) {
                                    handleStop(c.remote_ip);
                                }
                            })}
                            style={{ ...miniButtonStyle, background: '#dc3545' }}
                        >
                            Stop All
                        </button>
                    </div>

                    <h4 style={{ margin: '0.5rem 0 0.5rem 0', color: '#aaa', fontSize: '0.8rem', textTransform: 'uppercase' }}>Remote Systems</h4>
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {selectedConnections.map(conn => {
                            const hostStatus = allStatus[conn.remote_ip];
                            const isActive = selectedHost === conn.remote_ip;
                            return (
                                <div
                                    key={conn.remote_ip}
                                    onClick={() => setSelectedHost(conn.remote_ip)}
                                    style={{
                                        ...sidebarItemStyle,
                                        background: isActive ? 'rgba(76, 161, 175, 0.2)' : 'transparent',
                                        border: isActive ? '1px solid #4ca1af' : '1px solid transparent',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{conn.description || conn.remote_ip}</div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{hostStatus?.status || 'Idle'}</div>
                                        </div>
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: hostStatus?.is_running ? '#27C93F' : '#555',
                                            boxShadow: hostStatus?.is_running ? '0 0 8px #27C93F' : 'none',
                                            flexShrink: 0
                                        }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {selectedHost ? (
                    <div style={{ display: 'flex', flex: 1, gap: '1rem', overflow: 'hidden' }}>
                        {/* Configuration Panel */}
                        <div className="card" style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                            <h3 style={{ borderBottom: '1px solid #444', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>Configuration</h3>

                            <div style={{ fontSize: '0.85rem', padding: '0.5rem', background: '#111', borderRadius: '4px', borderLeft: '3px solid #4ca1af' }}>
                                <strong>System:</strong> {selectedHost}
                            </div>

                            <ConfigField label="Git URL" value={currentConfig.git_url}
                                onChange={v => updateLocalConfig(selectedHost, { git_url: v })} disabled={currentStatus.is_running} />

                            <ConfigField label="Branch" value={currentConfig.branch}
                                onChange={v => updateLocalConfig(selectedHost, { branch: v })} disabled={currentStatus.is_running} />

                            <ConfigField label="Poll Interval (s)" value={currentConfig.poll_interval} type="number"
                                onChange={v => updateLocalConfig(selectedHost, { poll_interval: v })} disabled={currentStatus.is_running} />

                            <ConfigField label="Build Directory" value={currentConfig.build_dir}
                                onChange={v => updateLocalConfig(selectedHost, { build_dir: v })} disabled={currentStatus.is_running} />

                            <ConfigField label="Validation Delay (Days)" value={currentConfig.validation_delay_days} type="number"
                                onChange={v => updateLocalConfig(selectedHost, { validation_delay_days: v })} disabled={currentStatus.is_running} />

                            <ConfigField label="Target Pass Count (0=∞)" value={currentConfig.target_pass_count} type="number"
                                onChange={v => updateLocalConfig(selectedHost, { target_pass_count: v })} disabled={currentStatus.is_running} />

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.3rem' }}>Notification Emails</label>
                                <input
                                    type="text"
                                    value={(currentConfig.notification_emails || []).join(', ')}
                                    disabled={currentStatus.is_running}
                                    onChange={(e) => {
                                        const emails = e.target.value.split(',').map(email => email.trim()).filter(email => email);
                                        updateLocalConfig(selectedHost, { notification_emails: emails });
                                    }}
                                    placeholder="user1@example.com, user2@example.com"
                                    style={{ width: '100%', padding: '0.4rem', background: '#222', border: '1px solid #444', color: '#fff', fontSize: '0.85rem', borderRadius: '4px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.3rem' }}>Selected Validations</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#111', padding: '0.5rem', borderRadius: '4px' }}>
                                    {[
                                        { id: 'sleep_state', label: 'Sleep States' },
                                        { id: 'pts_testing', label: 'PTS Testing' }
                                    ].map(v => (
                                        <label key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={(currentConfig.selected_validations || []).includes(v.id)}
                                                disabled={currentStatus.is_running}
                                                onChange={(e) => {
                                                    const current = currentConfig.selected_validations || [];
                                                    const updated = e.target.checked
                                                        ? [...current, v.id]
                                                        : current.filter(id => id !== v.id);
                                                    updateLocalConfig(selectedHost, { selected_validations: updated });
                                                }}
                                            />
                                            {v.label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {(currentConfig.selected_validations || []).includes('pts_testing') && (
                                <div style={{ marginBottom: '1rem', padding: '0.8rem', background: '#111', borderRadius: '4px', border: '1px solid #333' }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '0.3rem' }}>PTS Benchmark</label>
                                    <input
                                        type="text"
                                        placeholder="Search benchmarks..."
                                        value={benchmarkSearch}
                                        onChange={(e) => setBenchmarkSearch(e.target.value)}
                                        style={{ width: '100%', padding: '0.4rem', background: '#222', border: '1px solid #444', color: '#fff', fontSize: '0.85rem', borderRadius: '4px', marginBottom: '0.5rem' }}
                                    />
                                    <select
                                        value={currentConfig.benchmarkName || 'pts/unigine-heaven'}
                                        onChange={(e) => updateLocalConfig(selectedHost, { benchmarkName: e.target.value })}
                                        style={{ width: '100%', padding: '0.4rem', background: '#222', border: '1px solid #444', color: '#fff', fontSize: '0.85rem', borderRadius: '4px' }}
                                        disabled={currentStatus.is_running}
                                    >
                                        {PTS_BENCHMARKS.filter(b => b.id.toLowerCase().includes(benchmarkSearch.toLowerCase()) || b.name.toLowerCase().includes(benchmarkSearch.toLowerCase())).map(b => (
                                            <option key={b.id} value={b.id}>{b.id} - {b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div style={{ padding: '0.8rem', background: 'rgba(255, 204, 0, 0.1)', border: '1px solid #ffcc00', borderRadius: '4px', marginBottom: '1rem' }}>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#ffcc00', lineHeight: '1.4' }}>
                                    ⚠️ <strong>Caution:</strong> Please do not refresh the page. Once you start the CI, you cannot end it after the kernel build starts until validation is complete.
                                </p>
                            </div>

                            <div style={{ marginTop: 'auto' }}>
                                {currentStatus.is_running ? (
                                    <button
                                        onClick={() => handleStop(selectedHost)}
                                        style={{
                                            ...stopButtonStyle,
                                            opacity: isStopDisabled ? 0.5 : 1,
                                            cursor: isStopDisabled ? 'not-allowed' : 'pointer'
                                        }}
                                        disabled={isStopDisabled}
                                        title={isStopDisabled ? "Cannot stop once kernel building starts" : "Stop Monitor"}
                                    >
                                        Stop Monitor
                                    </button>
                                ) : (
                                    <button onClick={() => handleStart(selectedHost)} style={startButtonStyle}>Start Monitoring</button>
                                )}
                            </div>
                        </div>

                        {/* Logs Panel */}
                        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => setActiveTab('logs')}
                                        style={{ ...tabStyle, color: activeTab === 'logs' ? '#fff' : '#888', borderBottom: activeTab === 'logs' ? '2px solid #4ca1af' : 'none' }}
                                    >
                                        📜 Execution Logs
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('analysis')}
                                        style={{ ...tabStyle, color: activeTab === 'analysis' ? '#fff' : '#888', borderBottom: activeTab === 'analysis' ? '2px solid #4ca1af' : 'none' }}
                                    >
                                        🔍 Log Analysis {((currentStatus.analysis_results?.critical?.length || 0) + (currentStatus.analysis_results?.build_errors?.length || 0)) > 0 &&
                                            <span style={{ background: '#ff6b6b', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '10px', fontSize: '0.7rem', marginLeft: '0.3rem' }}>!</span>}
                                    </button>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.9rem' }}>
                                    <button
                                        onClick={handleDownloadLogs}
                                        style={{ ...miniButtonStyle, background: '#4ca1af', padding: '0.3rem 0.6rem', border: '1px solid rgba(255,255,255,0.1)' }}
                                        title="Download All Logs as .txt"
                                    >
                                        ⬇️ Download Logs
                                    </button>
                                    <span style={{ color: '#aaa' }}>Status: <span style={{ color: '#fff', fontWeight: 'bold' }}>{currentStatus.status}</span></span>
                                </div>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                                {activeTab === 'logs' ? (
                                    <div style={logContainerStyle}>
                                        {currentStatus.logs.map((log, i) => (
                                            <div key={i} style={{
                                                marginBottom: '0.2rem',
                                                color: log.includes('SUCCESS') ? '#27C93F' :
                                                    (log.includes('Error') || log.includes('Fail') || log.includes('ERROR')) ? '#ff6b6b' :
                                                        log.includes('WARNING') ? '#ffcc00' : '#ccc'
                                            }}>
                                                {log}
                                            </div>
                                        ))}
                                        <div ref={logsEndRef} />
                                    </div>
                                ) : (
                                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {(!currentStatus.analysis_results || Object.keys(currentStatus.analysis_results).length === 0) ? (
                                            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                                                No analysis results yet. Analysis starts after validation steps.
                                            </div>
                                        ) : (
                                            <>
                                                {/* Critical Issues */}
                                                <div>
                                                    <h4 style={{ color: '#ff6b6b', marginBottom: '0.5rem' }}>Critical Issues / Hardware Alarms ({currentStatus.analysis_results.critical?.length || 0})</h4>
                                                    {currentStatus.analysis_results.critical?.length > 0 ? (
                                                        currentStatus.analysis_results.critical.map((c, i) => (
                                                            <div key={i} style={findingStyle}>
                                                                <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}>[{c.type}]</span> Line {c.line}: {c.text}
                                                            </div>
                                                        ))
                                                    ) : <div style={{ fontSize: '0.9rem', color: '#888' }}>No critical issues detected.</div>}
                                                </div>

                                                {/* Build Errors */}
                                                <div>
                                                    <h4 style={{ color: '#ffcc00', marginBottom: '0.5rem' }}>Compilation Errors ({currentStatus.analysis_results.build_errors?.length || 0})</h4>
                                                    {currentStatus.analysis_results.build_errors?.length > 0 ? (
                                                        currentStatus.analysis_results.build_errors.map((b, i) => (
                                                            <div key={i} style={findingStyle}>
                                                                <span style={{ color: '#ffcc00', fontWeight: 'bold' }}>[{b.type}]</span> Line {b.line}: {b.text}
                                                            </div>
                                                        ))
                                                    ) : <div style={{ fontSize: '0.9rem', color: '#888' }}>No build errors detected.</div>}
                                                </div>

                                                {/* AI Insights placeholder */}
                                                {currentStatus.analysis_results.ai_summary && (
                                                    <div style={{ padding: '1rem', background: 'rgba(76, 161, 175, 0.1)', border: '1px solid #4ca1af', borderRadius: '4px' }}>
                                                        <h4 style={{ color: '#4ca1af', marginTop: 0 }}>🤖 Claude AI Interpretation</h4>
                                                        <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{currentStatus.analysis_results.ai_summary}</div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Dashboard View */
                    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                        <div className="card" style={{ padding: '1.5rem' }}>
                            <h2 style={{ margin: '0 0 1rem 0' }}>Fleet Overview</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                                {selectedConnections.map(conn => {
                                    const hostStatus = allStatus[conn.remote_ip] || { is_running: false, status: 'Idle', logs: [] };
                                    return (
                                        <div key={conn.remote_ip} className="card" style={{
                                            background: '#222',
                                            padding: '1rem',
                                            border: '1px solid #444',
                                            cursor: 'pointer'
                                        }} onClick={() => setSelectedHost(conn.remote_ip)}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <h4 style={{ margin: 0 }}>{conn.description || conn.remote_ip}</h4>
                                                <div style={{
                                                    padding: '0.2rem 0.6rem',
                                                    borderRadius: '10px',
                                                    background: hostStatus.is_running ? '#27C93F' : '#444',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {hostStatus.is_running ? 'RUNNING' : 'IDLE'}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '1rem' }}>
                                                Current Status: <span style={{ color: '#fff' }}>{hostStatus.status}</span>
                                            </div>
                                            <div style={{ background: '#111', padding: '0.5rem', borderRadius: '4px', fontSize: '0.75rem', height: '100px', overflow: 'hidden', opacity: 0.7 }}>
                                                {hostStatus.logs.slice(-5).map((l, idx) => (
                                                    <div key={idx} style={{ marginBottom: '2px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{l}</div>
                                                ))}
                                                {hostStatus.logs.length === 0 && <div style={{ color: '#444', fontStyle: 'italic' }}>No logs yet...</div>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ConfigField = ({ label, value, onChange, disabled, type = "text" }) => (
    <div>
        <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '0.3rem' }}>{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            style={{ width: '100%', padding: '0.5rem', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px', opacity: disabled ? 0.6 : 1 }}
        />
    </div>
);

// Styles
const headerStyle = {
    background: 'linear-gradient(90deg, #2c3e50 0%, #4ca1af 100%)',
    padding: '1rem 2rem',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
};

const backButtonStyle = {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '1rem'
};

const miniButtonStyle = {
    flex: 1,
    padding: '0.4rem',
    border: 'none',
    color: '#fff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.75rem'
};

const sidebarItemStyle = {
    padding: '0.8rem',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
};

const startButtonStyle = {
    width: '100%',
    padding: '0.8rem',
    background: '#27C93F',
    border: 'none',
    color: '#fff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
};

const stopButtonStyle = {
    width: '100%',
    padding: '0.8rem',
    background: '#dc3545',
    border: 'none',
    color: '#fff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
};

const logContainerStyle = {
    flex: 1,
    background: '#111',
    borderRadius: '4px',
    padding: '1rem',
    overflowY: 'auto',
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    lineHeight: '1.4'
};

const tabStyle = {
    padding: '0.8rem 1.5rem',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
};

const findingStyle = {
    padding: '0.8rem',
    background: '#222',
    border: '1px solid #333',
    borderRadius: '4px',
    marginBottom: '0.5rem',
    fontSize: '0.85rem',
    fontFamily: 'monospace',
    lineHeight: '1.4'
};

export default KernelCIMonitor;
