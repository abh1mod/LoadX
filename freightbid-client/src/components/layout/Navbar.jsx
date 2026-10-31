import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, LogOut, LayoutDashboard, Menu, ShieldCheck, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../common/Button';

export const Navbar = ({ onOpenMobileMenu = null }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme } = useTheme();

  const dashboardPath = user?.role === 'ADMIN'
    ? '/admin'
    : user?.role === 'SUPPLIER'
    ? '/supplier'
    : '/transporter';

  const themeBadges = {
    base: { label: 'Platform Core', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    supplier: { label: 'Shipper Hub', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    transporter: { label: 'Transporter Portal', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }
  };

  const currentBadge = themeBadges[theme] || themeBadges.base;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-brand-border select-none shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger (only visible when authenticated and in dashboard layout) */}
            {onOpenMobileMenu && (
              <button
                type="button"
                onClick={onOpenMobileMenu}
                aria-label="Open sidebar navigation"
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {/* Logo & Brand */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs transition-transform group-hover:scale-105"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <Truck className="w-5 h-5" />
              </div>
              <div className="flex items-center">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Load<span style={{ color: 'var(--color-primary)' }}>X</span>
                </span>
                <span
                  className={`hidden sm:inline-flex ml-2.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${currentBadge.bg} ${currentBadge.text} ${currentBadge.border}`}
                >
                  {currentBadge.label}
                </span>
              </div>
            </Link>
          </div>

          {/* Right Navigation Controls */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link to={dashboardPath}>
                  <Button variant="primary" size="sm" icon={LayoutDashboard} className="shadow-xs text-xs sm:text-sm">
                    <span className="hidden sm:inline">Workspace</span>
                    <span className="sm:hidden">Dash</span>
                  </Button>
                </Link>

                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-900 leading-tight">
                    {user?.name}
                  </span>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {user?.role}
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal truncate max-w-[130px]">
                      {user?.companyName || user?.city}
                    </span>
                  </div>
                </div>

                {/* Avatar with theme ring */}
                <div
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs ring-2"
                  style={{ ringColor: 'var(--color-primary)' }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                  icon={LogOut}
                >
                  <span className="hidden md:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Register Company
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
