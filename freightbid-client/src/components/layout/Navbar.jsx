import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Truck, LogOut, LayoutDashboard, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const Navbar = ({ onOpenMobileMenu = null }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    navigate('/', { replace: true });
    await logout();
  };

  const dashboardPath = user?.role === 'ADMIN'
    ? '/admin'
    : user?.role === 'SUPPLIER'
    ? '/supplier'
    : '/transporter';

  const themeBadges = {
    base: { label: 'Platform Core', bg: 'bg-[#EEF2FF]', text: 'text-[#3156D9]', border: 'border-[#C7D2FE]' },
    supplier: { label: 'Shipper Hub', bg: 'bg-[#EFF6FF]', text: 'text-[#2563EB]', border: 'border-[#BFDBFE]' },
    transporter: { label: 'Transporter Portal', bg: 'bg-[#E1F0E8]', text: 'text-[#075C40]', border: 'border-[#C5DEC8]' }
  };

  const currentBadge = themeBadges[theme] || themeBadges.base;
  const isHomePage = location.pathname === '/';

  return (
    <header
      className="sticky top-0 z-50 select-none transition-all duration-200"
      style={{
        background: 'rgba(245, 246, 243, 0.86)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${scrolled || !isHomePage ? '#DCE1D9' : 'transparent'}`
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[68px] flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button + LoadX Logo + Portal Badge */}
        <div className="flex items-center gap-3">
          {onOpenMobileMenu && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              aria-label="Open sidebar navigation"
              className="lg:hidden p-2 rounded-xl text-[#0F1B33] hover:bg-[#0F1B33]/5 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link to="/" className="inline-flex items-center gap-2.5 group text-decoration-none">
            <span
              className="w-9 h-9 rounded-[11px] bg-[#0F1B33] text-[#F4B21B] grid place-items-center shadow-xs transition-transform group-hover:scale-105 shrink-0"
              aria-hidden="true"
            >
              <Truck className="w-5 h-5 text-[#F4B21B]" />
            </span>
            <span
              className="text-[22px] font-extrabold tracking-[-0.03em] text-[#0F1B33]"
              style={{ fontFamily: "'Bricolage Grotesque', 'Segoe UI', system-ui, sans-serif" }}
            >
              LoadX
            </span>
          </Link>

          {!isHomePage && (
            <span
              className={`hidden sm:inline-flex ml-2 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${currentBadge.bg} ${currentBadge.text} ${currentBadge.border}`}
            >
              {currentBadge.label}
            </span>
          )}
        </div>

        {/* Center: Section Links (when on HomePage) */}
        {isHomePage && (
          <nav className="hidden md:flex items-center gap-7" aria-label="Page sections">
            <a href="#how-it-works" className="text-[#56647C] hover:text-[#0F1B33] font-medium text-[15px] transition-colors">
              How it works
            </a>
            <a href="#carriers" className="text-[#56647C] hover:text-[#0F1B33] font-medium text-[15px] transition-colors">
              Carriers
            </a>
            <a href="#reviews" className="text-[#56647C] hover:text-[#0F1B33] font-medium text-[15px] transition-colors">
              Reviews
            </a>
          </nav>
        )}

        {/* Right Side: Context-Aware Navigation Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {isAuthenticated ? (
            <>
              {/* Dashboard / Workspace Button */}
              <Link to={dashboardPath}>
                <button
                  type="button"
                  className="bg-[#0F1B33] hover:bg-[#0C7A57] text-white font-semibold text-xs sm:text-sm px-3.5 sm:px-4 py-2 rounded-full inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{isHomePage ? 'Dashboard' : 'Workspace'}</span>
                </button>
              </Link>

              {/* User Identity Pill (Name & Role) */}
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-semibold text-[#0F1B33] leading-tight">
                  {user?.name}
                </span>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-[#E1F0E8] text-[#075C40] border border-[#C5DEC8]">
                    {user?.role}
                  </span>
                  <span className="text-[11px] text-[#56647C] font-normal truncate max-w-[120px]">
                    {user?.companyName || user?.city}
                  </span>
                </div>
              </div>

              {/* User Avatar */}
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#E4E9F3] text-[#0F1B33] flex items-center justify-center font-bold text-xs ring-2 ring-[#0F1B33]/15 shrink-0"
              >
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="text-[#56647C] hover:text-[#D9462F] hover:bg-[#D9462F]/10 font-semibold text-xs sm:text-sm px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Logout from account"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login">
                <button
                  type="button"
                  className="text-[#0F1B33] hover:bg-[#0F1B33]/6 font-semibold text-xs sm:text-sm px-3.5 sm:px-4 py-2 rounded-full transition-colors cursor-pointer"
                >
                  Sign in
                </button>
              </Link>
              <Link to="/register">
                <button
                  type="button"
                  className="bg-[#0F1B33] hover:bg-[#0C7A57] text-white font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2 rounded-full transition-colors shadow-xs cursor-pointer"
                >
                  Register
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
