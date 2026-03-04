import React, { useState } from 'react';

const ValidationSelection = ({ onContinue, onBack }) => {
    const [selections, setSelections] = useState({
        kernel_install: true,
        sleep_state: true,
        pts_testing: true
    });

    const handleToggle = (key) => {
        setSelections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleContinue = () => {
        const selectedList = Object.keys(selections).filter(key => selections[key]);
        onContinue(selectedList);
    };

    return (
        <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Select Validation Steps</h2>
            <p style={{ color: '#aaa', marginBottom: '2rem', textAlign: 'center' }}>
                Choose the operations you want to execute for this validation session.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                <label style={selectionItemStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <input
                            type="checkbox"
                            checked={selections.kernel_install}
                            onChange={() => handleToggle('kernel_install')}
                            style={checkboxStyle}
                        />
                        <div>
                            <div style={{ fontWeight: 'bold', color: '#fff' }}>Kernel Installation</div>
                            <div style={{ fontSize: '0.85rem', color: '#888' }}>Download, compile, and install Linux kernel from source.</div>
                        </div>
                    </div>
                </label>

                <label style={selectionItemStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <input
                            type="checkbox"
                            checked={selections.sleep_state}
                            onChange={() => handleToggle('sleep_state')}
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
                            checked={selections.pts_testing}
                            onChange={() => handleToggle('pts_testing')}
                            style={checkboxStyle}
                        />
                        <div>
                            <div style={{ fontWeight: 'bold', color: '#fff' }}>PTS Testing</div>
                            <div style={{ fontSize: '0.85rem', color: '#888' }}>Run Phoronix Test Suite benchmarks and collect results.</div>
                        </div>
                    </div>
                </label>
            </div>



            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
                <button onClick={onBack} className="btn-secondary" style={{ flex: 1 }}>Back</button>
                <button
                    onClick={handleContinue}
                    className="btn-primary"
                    style={{ flex: 2 }}
                    disabled={Object.values(selections).every(v => !v)}
                >
                    Proceed to Workspace
                </button>
            </div>
        </div>
    );
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

export default ValidationSelection;
