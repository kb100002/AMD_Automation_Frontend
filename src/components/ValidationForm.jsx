import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';


const ValidationForm = ({ module, onSubmit, onBack }) => {
    const [formData, setFormData] = useState({
        targetPlatform: 'baremetal',
        osType: 'Linux',
        kernelType: 'generic',
        kernelVersion: '',
        configPath: '',
        testSuite: 'all',
        validation_delay_days: 0
    });

    const [kernelTypes, setKernelTypes] = useState([]);
    const [kernelVersions, setKernelVersions] = useState([]);

    useEffect(() => {
        // Fetch kernel types on mount
        const fetchTypes = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/kernel-types`);
                const types = await response.json();
                setKernelTypes(types);
                // Set default if available
                if (types.length > 0) {
                    setFormData(prev => ({ ...prev, kernelType: types[0] }));
                }
            } catch (error) {
                console.error("Failed to fetch kernel types:", error);
            }
        };
        fetchTypes();
    }, []);

    useEffect(() => {
        // Fetch versions when kernelType changes
        const fetchVersions = async () => {
            if (!formData.kernelType) return;
            try {
                const response = await fetch(`${API_BASE_URL}/kernel-versions/${formData.kernelType}`);
                const versions = await response.json();
                setKernelVersions(versions);
                // Set default version if available
                if (versions.length > 0) {
                    setFormData(prev => ({ ...prev, kernelVersion: versions[0] }));
                } else {
                    setFormData(prev => ({ ...prev, kernelVersion: '' }));
                }
            } catch (error) {
                console.error("Failed to fetch kernel versions:", error);
            }
        };
        fetchVersions();
    }, [formData.kernelType]);


    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                <button onClick={onBack} className="btn-secondary" style={{ marginRight: '1rem', padding: '0.5rem 1rem' }}>&larr; Back</button>
                <h2>Configure {module === 'kernel' ? 'Kernel' : 'ROCm'} Validation</h2>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Target Platform</label>
                    <select name="targetPlatform" value={formData.targetPlatform || 'baremetal'} onChange={handleChange} style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', background: '#222', border: '1px solid #444', color: '#fff' }}>
                        <option value="baremetal">Bare Metal (Physical Hardware)</option>
                        <option value="virtualbox">VirtualBox (VM)</option>
                    </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>OS Type</label>
                    <select name="osType" value={formData.osType} onChange={handleChange}>
                        <option value="Linux">Linux (Ubuntu/Debian)</option>
                        <option value="RHEL">RHEL/Debian</option>
                        <option value="SLES">SLES</option>
                    </select>
                </div>


                {module === 'rocm' && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>ROCm Version</label>
                        <input
                            type="text"
                            name="rocmVersion"
                            placeholder="e.g. 6.0.0"
                            onChange={handleChange}
                        />
                    </div>
                )}

                {module === 'kernel' && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Sleep State Config</label>
                        <select name="testSuite" value={formData.testSuite} onChange={handleChange}>
                            <option value="s2idle">Suspend to Idle (s2idle)</option>
                            <option value="deep">Deep Sleep (mem)</option>
                            <option value="hibernate">Hibernate (disk)</option>
                            <option value="all">All States</option>
                        </select>
                    </div>
                )}

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Validation Delay (Days)</label>
                    <input
                        type="number"
                        name="validation_delay_days"
                        step="0.1"
                        min="0"
                        value={formData.validation_delay_days}
                        onChange={handleChange}
                        placeholder="e.g. 1"
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', background: '#222', border: '1px solid #444', color: '#fff' }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                    <button type="submit" className="btn-primary">Start Validation</button>
                </div>
            </form>
        </div>
    );
};

export default ValidationForm;
