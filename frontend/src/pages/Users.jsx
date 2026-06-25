import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', roleCode: 'sales_rep', temporaryPassword: '' });
  const [error, setError] = useState('');

  async function load() {
    const res = await api.get('/users');
    setUsers(res.data.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleInvite(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/users/invite', form);
      setShowModal(false);
      setForm({ fullName: '', email: '', roleCode: 'sales_rep', temporaryPassword: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Invite failed');
    }
  }

  return (
    <div className="resource-page">
      <div className="resource-header">
        <h2>Team</h2>
        <button className="primary-btn" onClick={() => setShowModal(true)}>
          + Invite User
        </button>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.full_name}</td>
              <td>{u.email}</td>
              <td>{u.Role?.name}</td>
              <td>{u.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleInvite}>
            <h3>Invite Team Member</h3>
            {error && <div className="error-banner">{error}</div>}
            <div className="form-row">
              <label>Full Name</label>
              <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </div>
            <div className="form-row">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-row">
              <label>Role</label>
              <select value={form.roleCode} onChange={(e) => setForm({ ...form, roleCode: e.target.value })}>
                <option value="company_admin">Company Admin</option>
                <option value="manager">Manager</option>
                <option value="sales_rep">Sales Rep</option>
              </select>
            </div>
            <div className="form-row">
              <label>Temporary Password</label>
              <input
                type="text"
                value={form.temporaryPassword}
                onChange={(e) => setForm({ ...form, temporaryPassword: e.target.value })}
                required
              />
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="primary-btn">Send Invite</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
