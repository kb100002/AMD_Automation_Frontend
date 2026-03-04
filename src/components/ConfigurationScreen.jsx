import React, { useState } from 'react';
import ConnectionManager from './ConnectionManager';
import { PTS_BENCHMARKS } from '../data/benchmarks';

const ConfigurationScreen = ({ onContinue, onBack, onLaunchCI, user, token, onLogout }) => {
    const [activeTab, setActiveTab] = useState('connections'); // 'connections' | 'validations'
    const [selectedConnections, setSelectedConnections] = useState([]);
    const [selectedGitUrl, setSelectedGitUrl] = useState('https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git');
    const [validationSelections, setValidationSelections] = useState({
        sleep_state: true,
        pts_testing: true
    });
    const [validationDelayDays, setValidationDelayDays] = useState(0);
    const [selectedBenchmark, setSelectedBenchmark] = useState('pts/unigine-heaven');
    const [notificationEmails, setNotificationEmails] = useState('');
    const [targetPassCount, setTargetPassCount] = useState(0);
    const [benchmarkSearch, setBenchmarkSearch] = useState('');

    const handleValidationToggle = (key) => {
        setValidationSelections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Remove auto-switch to validation tab
    // React.useEffect(() => {
    //     if (selectedConnections.length > 0 && activeTab === 'connections') {
    //         setActiveTab('validations');
    //     }
    // }, [selectedConnections, activeTab]);

    const handleProceed = () => {
        // Prepare list of selected validations
        const selectedList = Object.keys(validationSelections).filter(key => validationSelections[key]);

        // Pass both validations and connection info to parent
        onContinue({
            validations: selectedList,
            validation_delay_days: parseFloat(validationDelayDays) || 0,
            benchmarkName: selectedBenchmark,
            notification_emails: notificationEmails.split(',').map(e => e.trim()).filter(e => e),
            target_pass_count: parseInt(targetPassCount) || 0,
            connection: selectedConnections[0]
        });
    };

    return (
        <div className="card" style={{ maxWidth: '900px', margin: '2rem auto', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '80vh' }}>

            {/* Header / Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #444', justifyContent: 'space-between', background: '#1a1a1a' }}>
                <div style={{ display: 'flex' }}>
                    <button
                        onClick={() => setActiveTab('connections')}
                        style={{ ...tabStyle, borderBottom: activeTab === 'connections' ? '3px solid var(--accent-color)' : 'none', color: activeTab === 'connections' ? '#fff' : '#888' }}
                    >
                        🔌 Remote Connections
                    </button>
                    <button
                        onClick={() => setActiveTab('validations')}
                        style={{ ...tabStyle, borderBottom: activeTab === 'validations' ? '3px solid var(--accent-color)' : 'none', color: activeTab === 'validations' ? '#fff' : '#888' }}
                    >
                        ✅ Validation Steps
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', paddingRight: '1rem' }}>
                    <select
                        value={selectedGitUrl}
                        onChange={(e) => setSelectedGitUrl(e.target.value)}
                        style={{
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: '1px solid #4ca1af',
                            background: '#222',
                            color: '#fff',
                            fontSize: '0.85rem',
                            outline: 'none'
                        }}
                        title="Select Kernel Repository"
                    >
                        <option value="https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git">Mainline Kernel</option>
                        <option value="https://git.kernel.org/pub/scm/linux/kernel/git/next/linux-next.git">Linux Next</option>
                    </select>
                </div>
            </div>

            {/* Content Area */}
            <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>

                {/* CONNECTIONS TAB */}
                {activeTab === 'connections' && (
                    <div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h2 style={{ marginBottom: '0.5rem' }}>Manage Connections</h2>
                            <p style={{ color: '#aaa' }}>Select a saved connection to use for this session, or add a new one.</p>
                        </div>

                        <ConnectionManager
                            onSelectConnections={(conns) => {
                                setSelectedConnections(conns);
                            }}
                            selectedConnectionIds={selectedConnections.map(c => c.remote_ip || c)}
                            currentUsername={user?.username}
                            token={token}
                            onLogout={onLogout}
                        />

                        {selectedConnections.length > 0 && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: '#2a2a2a', borderLeft: '4px solid #27C93F', borderRadius: '4px' }}>
                                <strong>Selected ({selectedConnections.length}):</strong> {selectedConnections.map(c => c.remote_ip || c).join(', ')}
                            </div>
                        )}
                    </div>
                )}

                {/* VALIDATIONS TAB */}
                {activeTab === 'validations' && (
                    <div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h2 style={{ marginBottom: '0.5rem' }}>Select Operations</h2>
                            <p style={{ color: '#aaa' }}>Choose which validation steps to perform.</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '1rem' }}>
                                Choose which validations to run after build completion.
                            </div>

                            <label style={selectionItemStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={validationSelections.sleep_state}
                                        onChange={() => handleValidationToggle('sleep_state')}
                                        style={checkboxStyle}
                                    />
                                    <div>
                                        <div style={{ fontWeight: 'bold', color: '#fff' }}>Sleep State Validation</div>
                                        <div style={{ fontSize: '0.85rem', color: '#888' }}>Test S2Idle, Deep Sleep, and Hibernate transitions.</div>
                                    </div>
                                </div>
                            </label>

                            <label style={selectionItemStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={validationSelections.pts_testing}
                                        onChange={() => handleValidationToggle('pts_testing')}
                                        style={checkboxStyle}
                                    />
                                    <div>
                                        <div style={{ fontWeight: 'bold', color: '#fff' }}>PTS Testing</div>
                                        <div style={{ fontSize: '0.85rem', color: '#888' }}>Run Phoronix Test Suite benchmarks and collect results.</div>
                                    </div>
                                </div>
                                {validationSelections.pts_testing && (
                                    <div style={{ marginTop: '1rem', padding: '0.8rem', background: '#111', borderRadius: '4px', border: '1px solid #333' }} onClick={(e) => e.stopPropagation()}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '0.3rem' }}>Select Benchmark</label>
                                        <input
                                            type="text"
                                            placeholder="Search benchmarks..."
                                            value={benchmarkSearch}
                                            onChange={(e) => setBenchmarkSearch(e.target.value)}
                                            style={{ width: '100%', padding: '0.4rem', background: '#222', border: '1px solid #444', color: '#fff', fontSize: '0.85rem', borderRadius: '4px', marginBottom: '0.5rem' }}
                                        />
                                        <select
                                            value={selectedBenchmark}
                                            onChange={(e) => setSelectedBenchmark(e.target.value)}
                                            style={{ width: '100%', padding: '0.4rem', background: '#222', border: '1px solid #444', color: '#fff', fontSize: '0.85rem', borderRadius: '4px' }}
                                        >
                                            {PTS_BENCHMARKS.filter(b => b.id.toLowerCase().includes(benchmarkSearch.toLowerCase()) || b.name.toLowerCase().includes(benchmarkSearch.toLowerCase())).map(b => (
                                                <option key={b.id} value={b.id}>{b.id} - {b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </label>

                            <div style={{ marginTop: '1rem', padding: '1rem', background: '#222', borderRadius: '8px', border: '1px solid #333' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: '#aaa' }}>Validation Delay (Days)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={validationDelayDays}
                                    onChange={(e) => setValidationDelayDays(e.target.value)}
                                    placeholder="Enter days (e.g. 0.5 or 1)"
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem',
                                        background: '#111',
                                        border: '1px solid #444',
                                        color: '#fff',
                                        borderRadius: '4px',
                                        outline: 'none'
                                    }}
                                />
                                <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.5rem' }}>
                                    The system will wait for this many days before starting the validation steps.
                                </p>
                            </div>

                            <div style={{ marginTop: '1rem', padding: '1rem', background: '#222', borderRadius: '8px', border: '1px solid #333' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: '#aaa' }}>Notification Emails</label>
                                <input
                                    type="text"
                                    value={notificationEmails}
                                    onChange={(e) => setNotificationEmails(e.target.value)}
                                    placeholder="Enter emails (comma separated)"
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem',
                                        background: '#111',
                                        border: '1px solid #444',
                                        color: '#fff',
                                        borderRadius: '4px',
                                        outline: 'none'
                                    }}
                                />
                                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.4rem' }}>
                                    Reports will be sent to these addresses after each validation cycle.
                                </div>
                            </div>

                            <div style={{ marginTop: '1rem', padding: '1rem', background: '#222', borderRadius: '8px', border: '1px solid #333' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: '#aaa' }}>Target Pass Count (0 = Infinite)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={targetPassCount}
                                    onChange={(e) => setTargetPassCount(e.target.value)}
                                    placeholder="Enter target count"
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem',
                                        background: '#111',
                                        border: '1px solid #444',
                                        color: '#fff',
                                        borderRadius: '4px',
                                        outline: 'none'
                                    }}
                                />
                                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.4rem' }}>
                                    The monitor will automatically stop after reaching this many successful validations.
                                </div>
                            </div>

                            <div style={{ padding: '1rem', background: 'rgba(255, 204, 0, 0.1)', border: '1px solid #ffcc00', borderRadius: '4px', marginBottom: '1.5rem' }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#ffcc00', lineHeight: '1.4' }}>
                                    ⚠️ <strong>Caution:</strong> Please do not refresh the page. Once you start the CI, you cannot end till validation is completes.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer / Actions */}
            <div style={{ borderTop: '1px solid #444', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a1a1a' }}>
                <button onClick={onBack} className="btn-secondary">Back</button>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    {activeTab === 'connections' ? (
                        <button
                            onClick={() => setActiveTab('validations')}
                            className="btn-primary"
                            disabled={!selectedConnections.length}
                            style={{ opacity: !selectedConnections.length ? 0.5 : 1 }}
                        >
                            Next: Validation Steps &rarr;
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                const selectedList = Object.keys(validationSelections).filter(key => validationSelections[key]);
                                onLaunchCI(selectedConnections, selectedGitUrl, {
                                    validations: selectedList,
                                    validation_delay_days: parseFloat(validationDelayDays) || 0,
                                    benchmarkName: selectedBenchmark,
                                    notification_emails: notificationEmails.split(',').map(e => e.trim()).filter(e => e),
                                    target_pass_count: parseInt(targetPassCount) || 0
                                });
                            }}
                            className="btn-primary"
                            disabled={!selectedConnections.length}
                            style={{ opacity: !selectedConnections.length ? 0.5 : 1 }}
                        >
                            🧬 Kernel CI Monitor
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const tabStyle = {
    flex: 1,
    padding: '1rem',
    background: '#222',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '1rem',
    transition: 'all 0.2s ease'
};

const selectionItemStyle = {
    display: 'block',
    padding: '1.2rem',
    background: '#222',
    border: '1px solid #333',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
};

const checkboxStyle = {
    width: '20px',
    height: '20px',
    cursor: 'pointer',
    accentColor: 'var(--accent-color)'
};

export default ConfigurationScreen;
