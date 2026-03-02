import React, { useState } from 'react';

const LoginScreen = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = isLogin ? '/token' : '/register';
        const hostname = window.location.hostname;
        const url = `http://${hostname}:8000${endpoint}`;

        try {
            const body = isLogin
                ? new URLSearchParams({ username, password })
                : JSON.stringify({ username, password, email });

            const headers = isLogin
                ? { 'Content-Type': 'application/x-www-form-urlencoded' }
                : { 'Content-Type': 'application/json' };

            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: body,
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                let errorMessage = 'Authentication failed';

                if (data.detail) {
                    if (typeof data.detail === 'string') {
                        errorMessage = data.detail;
                    } else if (Array.isArray(data.detail)) {
                        errorMessage = data.detail.map(err => err.msg).join(', ');
                    } else if (typeof data.detail === 'object') {
                        errorMessage = JSON.stringify(data.detail);
                    }
                }
                throw new Error(errorMessage);
            }

            if (isLogin) {
                const data = await response.json();
                sessionStorage.setItem('token', data.access_token);
                onLogin(data.access_token);
            } else {
                // After register, automatically login
                const loginBody = new URLSearchParams({ username, password });
                const loginResponse = await fetch(`http://${hostname}:8000/token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: loginBody,
                });

                if (!loginResponse.ok) {
                    throw new Error('Registration successful but auto-login failed. Please sign in manually.');
                }

                const loginData = await loginResponse.json();
                sessionStorage.setItem('token', loginData.access_token);
                onLogin(loginData.access_token);
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.logoContainer}>
                <div style={styles.logo}>AMD <span>Automation</span></div>
            </div>
            <div style={styles.card}>
                <h2 style={styles.title}>{isLogin ? 'Sign In' : 'Create Account'}</h2>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={styles.input}
                        required
                    />
                    {!isLogin && (
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={styles.input}
                            required
                        />
                    )}
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={styles.input}
                        required
                    />
                    {error && <div style={styles.error}>{error}</div>}
                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
                    </button>
                </form>
                <div style={styles.footer}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        style={styles.linkButton}
                    >
                        {isLogin ? 'Register' : 'Login'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#1a1a1a',
        color: '#fff',
        position: 'relative',
    },
    logoContainer: {
        position: 'absolute',
        top: '20px',
        left: '20px',
    },
    logo: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#fff',
    },
    card: {
        backgroundColor: '#2d2d2d',
        padding: '2.5rem',
        borderRadius: '8px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
        width: '100%',
        maxWidth: '400px',
    },
    title: {
        textAlign: 'center',
        marginBottom: '2rem',
        color: '#fff',
        fontSize: '1.8rem',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.2rem',
    },
    input: {
        padding: '0.85rem',
        borderRadius: '4px',
        border: '1px solid #444',
        backgroundColor: '#3d3d3d',
        color: '#fff',
        outline: 'none',
        fontSize: '1rem',
    },
    button: {
        padding: '0.85rem',
        borderRadius: '4px',
        border: 'none',
        backgroundColor: '#ef233c',
        color: '#fff',
        cursor: 'pointer',
        fontWeight: 'bold',
        marginTop: '1rem',
        fontSize: '1rem',
        transition: 'background-color 0.2s',
    },
    error: {
        color: '#ff4d4d',
        fontSize: '0.9rem',
        textAlign: 'center',
    },
    footer: {
        marginTop: '2rem',
        textAlign: 'center',
        fontSize: '0.95rem',
        color: '#aaa',
    },
    linkButton: {
        background: 'none',
        border: 'none',
        color: '#ef233c',
        cursor: 'pointer',
        textDecoration: 'none',
        padding: 0,
        marginLeft: '4px',
        fontWeight: 'bold',
    }
};

export default LoginScreen;
