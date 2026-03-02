import React from 'react';

const OSSelection = ({ onSelect, onBack }) => {
    const osOptions = [
        {
            id: 'ubuntu',
            name: 'Ubuntu',
            description: 'Debian-based Linux distribution.',
            color: '#E95420', // Ubuntu Orange
            gradient: 'linear-gradient(135deg, #E95420 0%, #772953 100%)'
        },
        {
            id: 'rhel',
            name: 'RHEL',
            description: 'Red Hat Enterprise Linux.',
            color: '#EE0000', // Red Hat Red
            gradient: 'linear-gradient(135deg, #EE0000 0%, #780000 100%)'
        },
        {
            id: 'Debian',
            name: 'Debian',
            description: 'Community Enterprise Operating System.',
            color: '#262577', // Debian Blue
            gradient: 'linear-gradient(135deg, #262577 0%, #93227F 100%)'
        }
    ];

    return (
        <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                <button onClick={onBack} className="btn-secondary" style={{ marginRight: '1rem', padding: '0.5rem 1rem' }}>&larr; Back</button>
                <h2>Select Target Operating System</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                {osOptions.map(os => (
                    <div
                        key={os.id}
                        className="card"
                        style={{
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.3s ease',
                            borderTop: `4px solid ${os.color}`
                        }}
                        onClick={() => onSelect(os.id)}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.boxShadow = `0 10px 20px rgba(0,0,0,0.3)`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{
                            width: '60px',
                            height: '60px',
                            margin: '0 auto 1rem',
                            borderRadius: '50%',
                            background: os.gradient,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#fff'
                        }}>
                            {os.name[0]}
                        </div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#fff' }}>{os.name}</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>{os.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OSSelection;
