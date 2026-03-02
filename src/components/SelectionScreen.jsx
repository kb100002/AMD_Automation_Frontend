import React from 'react';

const SelectionScreen = ({ onSelect }) => {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '4rem' }}>

            <div className="card" style={{ cursor: 'pointer', textAlign: 'center', transition: 'transform 0.2s' }}
                onClick={() => onSelect('kernel')}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#fff' }}>Kernel Validation</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                    General OS sleep state validation, kernel version checks, and configuration testing.
                </p>
                <div style={{ marginTop: '2rem', color: 'var(--accent-color)', fontWeight: 'bold' }}>Select &rarr;</div>
            </div>

            <div className="card" style={{ cursor: 'not-allowed', textAlign: 'center', opacity: 0.6, borderStyle: 'dashed' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#fff' }}>ROCm Validation</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                    GPU compute stack validation, driver compatibility, and ROCm specific test suites.
                </p>
                <div style={{ marginTop: '2rem', color: '#aaa', fontWeight: 'bold' }}>Coming Soon</div>
            </div>

        </div>
    );
};

export default SelectionScreen;
