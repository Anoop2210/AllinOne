import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [form, setForm] = useState({
    companyName: '',
    adminFullName: '',
    adminEmail: '',
    adminPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>CRM Core</h1>
        <p className="subtitle">Start your 14-day free trial</p>
        {error && <div className="error-banner">{error}</div>}
        <label>Company Name</label>
        <input value={form.companyName} onChange={(e) => update('companyName', e.target.value)} required />
        <label>Your Full Name</label>
        <input value={form.adminFullName} onChange={(e) => update('adminFullName', e.target.value)} required />
        <label>Work Email</label>
        <input type="email" value={form.adminEmail} onChange={(e) => update('adminEmail', e.target.value)} required />
        <label>Password</label>
        <input
          type="password"
          value={form.adminPassword}
          onChange={(e) => update('adminPassword', e.target.value)}
          required
          minLength={8}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
        <p className="switch-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
