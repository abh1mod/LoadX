import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  PlusCircle,
  Gavel,
  CheckCircle2,
  ListOrdered,
  Building2,
  TrendingUp,
  FileCheck2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const { user } = useAuth();
  const role = user?.role;

  const adminLinks = [
    { to: '/admin', label: 'Platform Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'User Verification', icon: Users },
    { to: '/admin/shipments', label: 'All Platform Shipments', icon: Package }
  ];

  const supplierLinks = [
    { to: '/supplier', label: 'Supplier Dashboard', icon: LayoutDashboard, end: true },
    { to: '/supplier/shipments/new', label: 'Create Shipment', icon: PlusCircle },
    { to: '/supplier/shipments', label: 'My Shipments', icon: Package }
  ];

  const transporterLinks = [
    { to: '/transporter', label: 'Browse Shipments', icon: Gavel, end: true },
    { to: '/transporter/my-bids', label: 'My Bids & Live Auctions', icon: TrendingUp },
    { to: '/transporter/awarded', label: 'My Awarded Contracts', icon: CheckCircle2 }
  ];

  const links =
    role === 'ADMIN'
      ? adminLinks
      : role === 'SUPPLIER'
      ? supplierLinks
      : transporterLinks;

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200/80 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div>
        {/* Role Badge Card */}
        <div className="mb-6 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              {role} Workspace
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 truncate">
            {user?.companyName || user?.name}
          </p>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm shadow-indigo-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
        <p>LoadX v1.0.0</p>
        <p className="mt-0.5">Indian Freight Exchange</p>
      </div>
    </aside>
  );
};

export default Sidebar;
