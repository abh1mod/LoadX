import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const DashboardLayout = ({ allowedRoles = [], theme: layoutTheme = null }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Sync layoutTheme if explicitly passed
  useEffect(() => {
    if (layoutTheme && layoutTheme !== theme) {
      setTheme(layoutTheme);
    }
  }, [layoutTheme, theme, setTheme]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-9 h-9 rounded-full border-3 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
          />
          <p className="text-xs text-brand-text-secondary font-medium">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to user's appropriate default dashboard
    if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user?.role === 'SUPPLIER') return <Navigate to="/supplier" replace />;
    if (user?.role === 'TRANSPORTER') return <Navigate to="/transporter" replace />;
    return <Navigate to="/" replace />;
  }

  const activeTheme = layoutTheme || theme || (
    user?.role === 'ADMIN' ? 'base' : user?.role === 'SUPPLIER' ? 'supplier' : 'transporter'
  );

  return (
    <div data-theme={activeTheme} className="min-h-screen bg-brand-bg flex flex-col transition-colors duration-150">
      <Navbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />

      {/* Main View Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar (w-64 = 256px) */}
        <div className="hidden lg:block shrink-0">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Drawer */}
            <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-10 flex">
              <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area: padding 24–32px (p-6 to lg:p-8) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
