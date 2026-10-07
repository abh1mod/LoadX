import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Package,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  Truck,
  Building,
  RefreshCw,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import api from '../../api/axios';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';
import { formatDateTime } from '../../utils/formatters';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reseedLoading, setReseedLoading] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.data?.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleReseed = async () => {
    if (!window.confirm('Reset all sample data back to standard demo state? Existing test bids will be reset.')) {
      return;
    }
    setReseedLoading(true);
    try {
      const res = await api.post('/admin/reseed');
      if (res.data?.success) {
        toast.success('Database successfully reset to initial demo dataset!');
        fetchStats();
      }
    } catch (err) {
      toast.error('Reseed failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setReseedLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Command Center</h1>
          <p className="text-xs text-slate-500 mt-1">
            System overview, carrier verification queue, and reverse auction monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchStats}
            icon={RefreshCw}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            loading={reseedLoading}
            onClick={handleReseed}
          >
            Reset Seed Data
          </Button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Approvals"
          value={stats?.users?.pending ?? 0}
          subtitle="Users awaiting verification"
          color="amber"
          icon={ShieldAlert}
        />
        <StatCard
          title="Verified Members"
          value={stats?.users?.verified ?? 0}
          subtitle="Approved shippers & carriers"
          color="emerald"
          icon={ShieldCheck}
        />
        <StatCard
          title="Active Live Auctions"
          value={stats?.shipments?.open ?? 0}
          subtitle="Consignments in reverse bidding"
          color="indigo"
          icon={Package}
        />
        <StatCard
          title="Delivered Freight"
          value={stats?.shipments?.delivered ?? 0}
          subtitle="Completed logistics contracts"
          color="blue"
          icon={CheckCircle}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          title="User Account Distribution"
          subtitle="Current status across all registered enterprises"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-600">Pending Verification</span>
              <span className="text-sm font-bold text-amber-600">{stats?.users?.pending ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-600">Active & Verified</span>
              <span className="text-sm font-bold text-emerald-600">{stats?.users?.verified ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-600">Suspended / Blocked</span>
              <span className="text-sm font-bold text-rose-600">{stats?.users?.blocked ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50/50 border border-indigo-100">
              <span className="text-xs font-semibold text-indigo-900">Total Registered Profiles</span>
              <span className="text-sm font-extrabold text-indigo-700">{stats?.users?.total ?? 0}</span>
            </div>
          </div>
          <div className="mt-5">
            <Link to="/admin/users">
              <Button variant="secondary" size="sm" className="w-full">
                Review & Manage User Accounts
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </Card>

        <Card
          title="Shipment & Auction Lifecycle"
          subtitle="Status summary of consignments on LoadX"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-600">Open Bidding Auctions</span>
              <span className="text-sm font-bold text-indigo-600">{stats?.shipments?.open ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-600">Awarded & In-Transit</span>
              <span className="text-sm font-bold text-cyan-600">{stats?.shipments?.awarded ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-xs font-medium text-slate-600">Completed & Delivered</span>
              <span className="text-sm font-bold text-emerald-600">{stats?.shipments?.delivered ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50/50 border border-indigo-100">
              <span className="text-xs font-semibold text-indigo-900">Total Platform Shipments</span>
              <span className="text-sm font-extrabold text-indigo-700">{stats?.shipments?.total ?? 0}</span>
            </div>
          </div>
          <div className="mt-5">
            <Link to="/admin/shipments">
              <Button variant="secondary" size="sm" className="w-full">
                Browse All Shipments
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
