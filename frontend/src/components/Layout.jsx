import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 20 20" fill="none"><path d="M3 10.5 10 4l7 6.5M5 9v7a1 1 0 0 0 1 1h3v-5h2v5h3a1 1 0 0 0 1-1V9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
  },
  {
    to: '/reports',
    label: 'Analytics',
    icon: (
      <svg viewBox="0 0 20 20" fill="none"><path d="M4 16.5V11M9 16.5V6M14 16.5v-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M2.5 16.5h15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
    ),
  },
  {
    to: '/leads',
    label: 'Leads',
    icon: (
      <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.6"/><path d="M4 17c0-3 2.7-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M14 4.5c1 .3 1.8 1.3 1.8 2.5s-.8 2.2-1.8 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
    ),
  },
  {
    to: '/contacts',
    label: 'Contacts',
    icon: (
      <svg viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.6"/><circle cx="8" cy="9" r="1.6" stroke="currentColor" strokeWidth="1.4"/><path d="M6 13.2c.5-1.1 1.3-1.7 2-1.7s1.5.6 2 1.7M12 8.5h4M12 11.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
    ),
  },
  {
    to: '/deals',
    label: 'Deals',
    icon: (
      <svg viewBox="0 0 20 20" fill="none"><path d="M3 11.5 8 6.5l3.5 3.5L17 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 5h4v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 15.5h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
    ),
  },
  {
    to: '/users',
    label: 'Team',
    icon: (
      <svg viewBox="0 0 20 20" fill="none"><circle cx="7" cy="7" r="2.6" stroke="currentColor" strokeWidth="1.6"/><circle cx="14" cy="8.5" r="2" stroke="currentColor" strokeWidth="1.4"/><path d="M2.8 16.5c.4-2.4 2.2-4 4.2-4s3.8 1.6 4.2 4M12.5 13c1.7.1 3 1.4 3.4 3.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
    ),
  },
  {
    to: '/billing',
    label: 'Billing',
    icon: (
      <svg viewBox="0 0 20 20" fill="none"><rect x="2.5" y="5" width="15" height="10" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M2.5 8.3h15" stroke="currentColor" strokeWidth="1.6"/><path d="M5.5 11.5h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
    ),
  },
  {
    to: '/integrations',
    label: 'Integrations',
    icon: (
      <svg viewBox="0 0 20 20" fill="none"><circle cx="6" cy="6" r="2.2" stroke="currentColor" strokeWidth="1.6"/><circle cx="14" cy="14" r="2.2" stroke="currentColor" strokeWidth="1.6"/><path d="M7.6 7.6 12.4 12.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
    ),
  },
];

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/reports': 'Analytics',
  '/leads': 'Leads',
  '/contacts': 'Contacts',
  '/deals': 'Deals',
  '/users': 'Team',
  '/billing': 'Billing',
  '/integrations': 'Integrations',
};

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const title = PAGE_TITLES[location.pathname] || 'CRM Core';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">CC</span>
          <span className="brand-text">CRM Core</span>
        </div>
        <nav>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <span className="user-avatar">{initials(user?.full_name)}</span>
            <span className="user-name">{user?.full_name}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      <div className="main-col">
        <header className="topbar">
          <h1 className="topbar-title">{title}</h1>
          <div className="topbar-actions">
            <div className="topbar-search">
              <svg viewBox="0 0 20 20" fill="none" width="15" height="15">
                <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
                <path d="M16 16l-3.2-3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <input placeholder="Search leads, contacts, deals…" />
            </div>
            <span className="user-avatar topbar-avatar">{initials(user?.full_name)}</span>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}