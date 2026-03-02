import React, { useState } from 'react';
import SelectionScreen from './components/SelectionScreen';
import ValidationForm from './components/ValidationForm';
import LogTerminal from './components/LogTerminal';
import StatusOverlay from './components/StatusOverlay';
import OSSelection from './components/OSSelection';
import OSWorkspace from './components/OSWorkspace';
import ConfigurationScreen from './components/ConfigurationScreen';
import KernelCIMonitor from './components/KernelCIMonitor';

import LoginScreen from './components/LoginScreen';

function App() {
    const [token, setToken] = useState(sessionStorage.getItem('token'));
    const [currentModule, setCurrentModule] = useState(null); // 'kernel' | 'rocm' | null
    const [selectedOS, setSelectedOS] = useState(null); // 'ubuntu' | 'rhel' | 'Debian'
    const [isConfigFinished, setIsConfigFinished] = useState(false);
    const [showCI, setShowCI] = useState(false);

    const [selectedValidations, setSelectedValidations] = useState([]);
    const [validationDelayDays, setValidationDelayDays] = useState(0);
    const [selectedConnections, setSelectedConnections] = useState([]);
    const [benchmarkName, setBenchmarkName] = useState('pts/unigine-heaven');
    const [logs, setLogs] = useState([]); // Array of { message, timestamp }
    const [result, setResult] = useState(null); // 'pass' | 'fail'
    const [errorMsg, setErrorMsg] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [benchmarkResult, setBenchmarkResult] = useState(null);
    const [backendStatus, setBackendStatus] = useState(true); // Mock status for now
    const [monitorGitUrl, setMonitorGitUrl] = useState('');
    const [user, setUser] = useState(null);
    const [showProfile, setShowProfile] = useState(false);

    React.useEffect(() => {
        if (token) {
            fetch(`https://amd-automation-1.onrender.com/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error('Failed to fetch user');
                })
                .then(data => setUser(data))
                .catch(err => {
                    console.error(err);
                    if (token) handleLogout();
                });
        }
    }, [token]);

    const handleLogin = (newToken) => {
        setToken(newToken);
    };

    const handleLogout = () => {
        setToken(null);
        sessionStorage.removeItem('token');
        resetApp();
    };

    const addLog = (message) => {
        setLogs(prev => [...prev, {
            message,
            timestamp: new Date().toLocaleTimeString()
        }]);
    };

    const handleModuleSelect = (module) => {
        setCurrentModule(module);
        setSelectedOS(null);
        setIsConfigFinished(false);
    };

    const handleOSSelect = (osId) => {
        setSelectedOS(osId);
        setIsConfigFinished(false);
    };

    const [notificationEmails, setNotificationEmails] = useState([]);
    const [targetPassCount, setTargetPassCount] = useState(0);

    const handleConfigContinue = (config) => {
        setSelectedValidations(config.validations);
        setValidationDelayDays(config.validation_delay_days || 0);
        setBenchmarkName(config.benchmarkName || 'pts/unigine-heaven');
        setNotificationEmails(config.notification_emails || []);
        setTargetPassCount(config.target_pass_count || 0);
        setSelectedConnections(config.connection ? [config.connection] : []);
        setIsConfigFinished(true);
        return config; // Return for use in other handlers
    };

    const wsRef = React.useRef(null);

    const executeWithLogs = async (endpoint, payload) => {
        setIsRunning(true);
        setLogs([]); // Clear logs for new run
        addLog(`Starting process: ${endpoint}...`);
        addLog('Connecting to log stream...');
        setResult(null);

        // Close existing connection if any
        if (wsRef.current) {
            wsRef.current.close();
        }

        // Connect to WebSocket using native WebSocket API
        const ws = new WebSocket(`wss://amd-automation-1.onrender.com/ws/logs`);
        wsRef.current = ws;

        ws.onopen = () => {
            addLog('Log stream connected.');
            // Trigger process via API
            fetch(`https://amd-automation-1.onrender.com${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            }).then(async res => {
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    addLog(`API Error (${res.status}): ${JSON.stringify(errorData)}`);
                    setIsRunning(false);
                    // Close WS if API rejected the request
                    if (ws.readyState === WebSocket.OPEN) ws.close();
                    if (res.status === 401) handleLogout();
                }
            }).catch(err => {
                addLog(`API Error: ${err.message}`);
                setIsRunning(false);
                if (ws.readyState === WebSocket.OPEN) ws.close();
            });
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'log') {
                addLog(data.message);
            } else if (data.type === 'status') {
                if (data.status === 'completed') {
                    setResult(data.result); // 'pass' or 'fail'
                    if (data.result === 'fail') setErrorMsg(data.error || 'Unknown error occurred');
                    setIsRunning(false);
                    // Don't close immediately to allow logs to finish if any
                    setTimeout(() => ws.close(), 500);
                }
            }
        };

        ws.onclose = (e) => {
            if (isRunning) {
                addLog('⚠️ Connection to server lost. The task may still be running on the remote machine.');
                setIsRunning(false);
            }
        };

        ws.onerror = (e) => {
            console.error("WebSocket Error:", e);
            addLog('❌ Log stream connection error.');
            setIsRunning(false);
        };
    };

    const handleFormSubmit = (formData) => {
        executeWithLogs('/validate', {
            module: currentModule,
            validations: selectedValidations,
            ...formData
        });
    };

    const resetApp = () => {
        setCurrentModule(null);
        setSelectedOS(null);
        setIsConfigFinished(false);
        setShowCI(false);
        setSelectedValidations([]);
        setSelectedConnections([]);
        setLogs([]);
        setResult(null);
        setErrorMsg('');
        setIsRunning(false);
    };

    if (!token) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    return (
        <div className="app-container">
            <header className="header" style={{ width: '100%', marginBottom: '1rem' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem' }}>
                    <div className="logo">AMD <span>Automation</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: backendStatus ? 'var(--success-color)' : 'var(--error-color)',
                                boxShadow: backendStatus ? '0 0 8px var(--success-color)' : '0 0 8px var(--error-color)'
                            }}></div>
                            <span>Backend: {backendStatus ? 'Connected' : 'Disconnected'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: backendStatus ? '#4caf50' : '#f44336',
                                    boxShadow: backendStatus ? '0 0 5px #4caf50' : '0 0 5px #f44336'
                                }}></div>
                                <span style={{ color: '#888', fontSize: '0.8rem' }}>{backendStatus ? 'Online' : 'Offline'}</span>
                            </div>

                            {user && (
                                <div style={{ position: 'relative' }}>
                                    <div
                                        onClick={() => setShowProfile(!showProfile)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.8rem',
                                            borderLeft: '1px solid #333',
                                            paddingLeft: '1.5rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>{user.username}</span>
                                            <span style={{ fontSize: '0.7rem', color: '#aaa' }}>user</span>
                                        </div>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            backgroundColor: '#333',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#fff',
                                            fontWeight: 'bold',
                                            fontSize: '0.9rem',
                                            border: showProfile ? '2px solid var(--accent-color)' : '1px solid #444'
                                        }}>
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                    </div>

                                    {showProfile && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            right: 0,
                                            marginTop: '1rem',
                                            backgroundColor: '#1a1a1a',
                                            border: '1px solid #333',
                                            borderRadius: '8px',
                                            padding: '1.5rem',
                                            minWidth: '240px',
                                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                                            zIndex: 1000
                                        }}>
                                            <div style={{ marginBottom: '1rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff' }}>User Profile</div>
                                                <div style={{ fontSize: '0.8rem', color: '#888' }}>Account Details</div>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Username</div>
                                                    <div style={{ fontSize: '0.9rem', color: '#fff' }}>{user.username}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Email</div>
                                                    <div style={{ fontSize: '0.9rem', color: '#fff' }}>{user.email || 'N/A'}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em' }}>User ID</div>
                                                    <div style={{ fontSize: '0.9rem', color: '#aaa' }}>#{user.id}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Status</div>
                                                    <div style={{ fontSize: '0.9rem', color: user.is_active ? '#4caf50' : '#f44336' }}>
                                                        {user.is_active ? 'Active' : 'Inactive'}
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleLogout}
                                                style={{
                                                    width: '100%',
                                                    marginTop: '1.5rem',
                                                    background: '#ef233c',
                                                    border: 'none',
                                                    color: 'white',
                                                    padding: '8px',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                Sign Out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Validation Result Overlay */}
            {result && (
                <StatusOverlay
                    result={result}
                    error={errorMsg}
                    logs={logs.map(l => l.message)}
                    onClose={resetApp}
                />
            )}

            {/* Main Content Area */}
            <main className="main-content">

                {/* 1. Module Selection Screen */}
                {!currentModule && !showCI && (
                    <SelectionScreen onSelect={handleModuleSelect} />
                )}

                {/* 2. OS Selection Screen */}
                {currentModule && !selectedOS && !showCI && (
                    <OSSelection module={currentModule} onSelect={handleOSSelect} onBack={() => setCurrentModule(null)} />
                )}

                {/* 3. ConfigurationScreen (Connection & Validation) */}
                {currentModule && selectedOS && !isConfigFinished && !showCI && (
                    <ConfigurationScreen
                        onBack={() => setSelectedOS(null)}
                        onContinue={handleConfigContinue}
                        onLaunchCI={(conns, gitUrl, config) => {
                            // Update state with any specific selections from the form
                            if (config) {
                                setSelectedValidations(config.validations);
                                setValidationDelayDays(config.validation_delay_days || 0);
                                setBenchmarkName(config.benchmarkName || 'pts/unigine-heaven');
                                setNotificationEmails(config.notification_emails || []);
                                setTargetPassCount(config.target_pass_count || 0);
                            }
                            setSelectedConnections(conns);
                            setMonitorGitUrl(gitUrl);
                            setShowCI(true);
                        }}
                        user={user}
                        token={token}
                        onLogout={handleLogout}
                    />
                )}

                {/* 4. Kernel CI Monitor */}
                {showCI && (
                    <KernelCIMonitor
                        onBack={() => setShowCI(false)}
                        selectedConnections={selectedConnections}
                        gitUrl={monitorGitUrl}
                        defaultBenchmark={benchmarkName}
                        defaultValidations={selectedValidations}
                        defaultEmails={notificationEmails}
                        defaultPassCount={targetPassCount}
                        defaultDelay={validationDelayDays}
                        token={token}
                        onLogout={handleLogout}
                    />
                )}

                {/* 5. OS Workspace (The "Action" Phase) */}
                {currentModule && selectedOS && isConfigFinished && !showCI && (
                    <OSWorkspace
                        osId={selectedOS}
                        module={currentModule}
                        onBack={() => setIsConfigFinished(false)}
                        onSubmit={handleFormSubmit}
                        logs={logs}
                        result={benchmarkResult}
                        errorMsg={errorMsg}
                        isRunning={isRunning}
                        initialValidations={selectedValidations}
                        initialValidationDelayDays={validationDelayDays}
                        initialBenchmarkName={benchmarkName}
                        initialConnection={selectedConnections[0]}
                        executeWithLogs={executeWithLogs}
                        token={token}
                        onLogout={handleLogout}
                    />
                )}
            </main>
        </div>
    );
};

export default App;
