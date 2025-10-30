import React from 'react';

export default function LoginForm({ onSuccess, onClose }){
	const [username, setUsername] = React.useState('');
	const [password, setPassword] = React.useState('');
	const [error, setError] = React.useState('');
	const [loading, setLoading] = React.useState(false);
	const userRef = React.useRef(null);
	const passRef = React.useRef(null);

	React.useEffect(() => { userRef.current?.focus(); }, []);

	const submit = async (e) => {
		e?.preventDefault();
		setError('');
		setLoading(true);
		try{
			// Real request (commented for now):
			// const res = await fetch('/login', {
			// 	method: 'POST',
			// 	headers: { 'Content-Type': 'application/json' },
			// 	body: JSON.stringify({ username, password })
			// });
			// if (!res.ok) throw new Error('Invalid credentials');
			// const data = await res.json();

			// Mock session
			const now = Date.now();
			const mock = {
				token: 'mock_' + Math.random().toString(36).slice(2),
				expiresAt: now + 5 * 60 * 1000,
				user: { username }
			};
			onSuccess?.(mock);
		} catch (err){
			setError(err.message || 'Login failed');
		} finally {
			setLoading(false);
		}
	};

	return (
		<form className="login" onSubmit={submit}>
			<div className="login-row">
				<span className="login-prompt">username: </span>
				<input ref={userRef} className="login-input" value={username} onChange={(e)=>setUsername(e.target.value)} onKeyDown={(e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						passRef.current?.focus();
					}
				}} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
			</div>
			<div className="login-row">
				<span className="login-prompt">password: </span>
				<input ref={passRef} type="password" className="login-input" value={password} onChange={(e)=>setPassword(e.target.value)} onKeyDown={(e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						submit(e);
					}
				}} />
			</div>
			{error && <div className="login-error">{error}</div>}
			<div className="login-actions">
				<button type="submit" className="login-action" disabled={loading}>{loading ? '...' : 'login'}</button>
				<button type="button" className="login-action" onClick={onClose}>cancel</button>
			</div>
		</form>
	);
}


