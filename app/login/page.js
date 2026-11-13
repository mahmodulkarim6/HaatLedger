'use client';
import { useState } from 'react';

export default function Login() {
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (ev) => {
    ev.preventDefault();
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      window.location.assign('/');
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <div className="loginwrap">
      <form className="card login" onSubmit={submit}>
        <div className="brand"><span className="seed" />Haat<b>Ledger</b></div>
        <p className="sub">Admin sign in</p>
        <label htmlFor="pw">Password</label>
        <input id="pw" type="password" autoFocus required autoComplete="current-password" value={password} onChange={(x) => setPassword(x.target.value)} />
        {err && <div className="note bad loginerr" role="alert">{err}</div>}
        <button className="btn" disabled={busy}>{busy ? 'Signing in' : 'Sign in'}</button>
      </form>
    </div>
  );
}
