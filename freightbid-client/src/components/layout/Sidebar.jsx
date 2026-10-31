import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  PlusCircle,
  Gavel,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Truck,
  Building2,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const Sidebar = ({ onCloseMobile = null }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const role = user?.role;

  const adminLinks = [
    { to: '/admin', label: 'Platform Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'User Verification', icon: Users },
    { to: '/admin/shipments', label: 'Platform Shipments', icon: Package }
  ];

  const supplierLinks = [
    { to: '/supplier', label: 'Supplier Dashboard', icon: LayoutDashboard, end: true },
    { to: '/supplier/shipments/new', label: 'Create Shipment', icon: PlusCircle },
    { to: '/supplier/shipments', label: 'My Shipments', icon: Package }
  ];

  const transporterLinks = [
    { to: '/transporter', label: 'Available Loads', icon: Gavel, end: true },
    { to: '/transporter/my-bids', label: 'My Bids & Live Auctions', icon: TrendingUp },
    { to: '/transporter/awarded', label: 'Awarded Shipments', icon: CheckCircle2 }
  ];

  const links =
    role === 'ADMIN'
      ? adminLinks
      : role === 'SUPPLIER'
      ? supplierLinks
      : transporterLinks;

  const roleThemeDetails = {
    ADMIN: {
      portal: 'Base Platform',
      badge: 'Admin Console',
      icon: ShieldCheck,
      desc: 'System Governance'
    },
    SUPPLIER: {
      portal: 'Shipper Workspace',
      badge: 'Enterprise Shipper',
      icon: Building2,
      desc: 'Freight Dispatcher'
    },
    TRANSPORTER: {
      portal: 'Transporter Portal',
      badge: 'Carrier Fleet',
      icon: Truck,
      desc: 'Fleet Operations'
    }
  };

  const currentPortal = roleThemeDetails[role] || roleThemeDetails.ADMIN;
  const PortalIcon = currentPortal.icon;

  return (
    <aside
      className="w-64 shrink-0 flex flex-col justify-between h-full p-4 select-none border-r border-black/10 transition-colors duration-200"
      style={{
        backgroundColor: 'var(--color-sidebar)',
        color: 'var(--color-sidebar-text)'
      }}
    >
      <div>
        {/* Mobile Header Close */}
        {onCloseMobile && (
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 lg:hidden">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">Menu Navigation</span>
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Role Identity Workspace Card */}
        <div
          className="mb-5 p-3.5 rounded-xl border transition-colors shadow-sm"
          style={{
            backgroundColor: 'var(--color-sidebar-secondary)',
            borderColor: 'rgba(255, 255, 255, 0.08)'
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <PortalIcon className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wider block text-white/90">
                {currentPortal.portal}
              </span>
              <p className="text-[11px] text-white/60 truncate mt-0.5">
                {user?.companyName || user?.name || currentPortal.desc}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-1 mb-2">
          <p
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-sidebar-text-muted)' }}
          >
            Navigation
          </p>
        </div>

        <nav className="space-y-1">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                    isActive
                      ? 'text-white font-semibold shadow-sm'
                      : 'hover:text-white'
                  }`
                }
                style={({ isActive }) => ({
                  backgroundColor: isActive
                    ? 'var(--color-sidebar-active)'
                    : 'transparent',
                  color: isActive
                    ? '#ffffff'
                    : 'var(--color-sidebar-text-muted)'
                })}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                        isActive ? 'text-white' : ''
                      }`}
                      style={{
                        color: isActive ? '#ffffff' : 'inherit'
                      }}
                    />
                    <span className="truncate">{item.label}</span>
                    {isActive && (
                      <span
                        className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: 'var(--color-primary)' }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Identity */}
      <div
        className="pt-4 mt-6 border-t text-[11px]"
        style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold text-white/80">LoadX Platform</span>
          <span
            className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wide text-white/90"
            style={{ backgroundColor: 'var(--color-sidebar-secondary)' }}
          >
            {theme}
          </span>
        </div>
        <p className="mt-1" style={{ color: 'var(--color-sidebar-text-muted)' }}>
          B2B Logistics Marketplace
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
