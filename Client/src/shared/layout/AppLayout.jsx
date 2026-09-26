import { Link, NavLink, Outlet } from 'react-router';
import { useAuth } from '../../features/auth/state/authContext';

const navigation = [
  ['Dashboard', '/dashboard', '▦'], ['Products', '/products', '◈'], ['Warehouses', '/warehouses', '⌂'], ['Receipts', '/receipts', '↓'], ['Deliveries', '/deliveries', '↑'], ['Transfers', '/transfers', '⇄'], ['Adjustments', '/adjustments', '±'], ['Stock Ledger', '/ledger', '≡'],
];
export default function AppLayout() {
  const { user, logout } = useAuth();
  return <div className="app-shell"><aside className="sidebar"><Link to="/dashboard" className="brand"><span> S </span>StockSense</Link><nav>{navigation.map(([label, to, icon]) => <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><i>{icon}</i>{label}</NavLink>)}</nav><div className="sidebar-footer"><Link to="/profile" className="profile-link"><span className="avatar">{user?.name?.slice(0, 1).toUpperCase()}</span><span><b>{user?.name}</b><small>{user?.role}</small></span></Link><button className="text-button" onClick={logout}>Sign out</button></div></aside><main className="workspace"><header className="mobile-header"><Link to="/dashboard" className="brand"><span>S</span>StockSense</Link><Link to="/profile" className="avatar">{user?.name?.slice(0, 1).toUpperCase()}</Link></header><Outlet /></main></div>;
}
