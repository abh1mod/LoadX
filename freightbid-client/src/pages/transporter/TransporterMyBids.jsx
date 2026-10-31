import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, RefreshCw, Eye, ArrowRight, Gavel, Package, Trophy, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import { formatINR, formatDateTime } from '../../utils/formatters';

export const TransporterMyBids = () => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyBids = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/shipments/my-bids');
      if (res.data?.success) {
        setBids(res.data.bids || []);
      }
    } catch (err) {
      console.error('Failed to load my bids:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyBids();
  }, [fetchMyBids]);

  // Derived KPI metrics
  const stats = useMemo(() => {
    const total = bids.length;
    const won = bids.filter((b) => b.status === 'WON').length;
    const active = bids.filter((b) => b.status === 'ACTIVE').length;
    const totalVolume = bids.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    return { total, won, active, totalVolume };
  }, [bids]);

  const columns = [
    {
      header: 'Consignment Title / Route',
      key: 'shipment',
      render: (row) => (
        <div>
          <span className="font-semibold text-brand-text-primary block">{row.shipment?.title || 'Shipment'}</span>
          <span className="text-xs text-brand-text-secondary flex items-center gap-1.5 mt-0.5">
            <span>{row.shipment?.pickupLocation?.city}</span>
            <span className="text-brand-text-muted">&rarr;</span>
            <span>{row.dropLocation?.city || row.shipment?.dropLocation?.city}</span>
            <span className="text-brand-border">•</span>
            <span className="text-brand-text-muted">{row.shipment?.cargoType}</span>
          </span>
        </div>
      )
    },
    {
      header: 'Auction Status',
      key: 'shipmentStatus',
      className: 'whitespace-nowrap',
      render: (row) => <Badge status={row.shipment?.status} size="sm" />
    },
    {
      header: 'Your Rate (INR)',
      key: 'amount',
      className: 'whitespace-nowrap',
      render: (row) => (
        <span className="font-mono font-bold text-brand-text-primary text-sm whitespace-nowrap">
          {formatINR(row.amount)}
        </span>
      )
    },
    {
      header: 'Bid Outcome',
      key: 'status',
      className: 'whitespace-nowrap',
      render: (row) => {
        const outcomeColors = {
          ACTIVE: 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary-border)] font-semibold',
          WON: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
          LOST: 'bg-slate-100 text-slate-500 border-slate-200'
        };
        return (
          <span className={`text-[11px] px-2.5 py-0.5 rounded-full border shadow-2xs whitespace-nowrap ${outcomeColors[row.status] || ''}`}>
            {row.status}
          </span>
        );
      }
    },
    {
      header: 'Last Modified',
      key: 'lastAmountChangedAt',
      className: 'whitespace-nowrap',
      render: (row) => (
        <span className="text-xs text-brand-text-muted font-mono whitespace-nowrap">
          {formatDateTime(row.lastAmountChangedAt || row.updatedAt)}
        </span>
      )
    },
    {
      header: 'Auction Room',
      key: 'actions',
      align: 'right',
      className: 'whitespace-nowrap',
      render: (row) => (
        <Link to={`/transporter/shipments/${row.shipment?._id}`} className="inline-block whitespace-nowrap">
          <Button variant="secondary" size="sm" className="text-xs whitespace-nowrap">
            <Eye className="w-3.5 h-3.5 mr-1 text-[var(--color-primary)]" />
            Enter Room
          </Button>
        </Link>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-brand-card rounded-2xl border border-brand-border p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] text-[10px] font-bold uppercase tracking-wider border border-[var(--color-primary-border)]">
              Carrier Bidding Log
            </span>
          </div>
          <h1 className="text-2xl font-bold text-brand-text-primary tracking-tight">My Bids & Auction History</h1>
          <p className="text-xs text-brand-text-secondary mt-1">
            Track your reverse bids, auction outcomes, and contract status across all consignments.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchMyBids} icon={RefreshCw}>
          Refresh
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-brand-card p-4 rounded-xl border border-brand-border shadow-xs">
          <span className="text-[11px] uppercase font-bold text-brand-text-muted tracking-wider block">Total Bids</span>
          <p className="text-2xl font-extrabold text-brand-text-primary mt-1">{stats.total}</p>
        </div>
        <div className="bg-brand-card p-4 rounded-xl border border-brand-border shadow-xs">
          <span className="text-[11px] uppercase font-bold text-brand-text-muted tracking-wider block">Active Bids</span>
          <p className="text-2xl font-extrabold text-[var(--color-primary)] mt-1">{stats.active}</p>
        </div>
        <div className="bg-brand-card p-4 rounded-xl border border-brand-border shadow-xs">
          <span className="text-[11px] uppercase font-bold text-brand-text-muted tracking-wider block">Won Contracts</span>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{stats.won}</p>
        </div>
        <div className="bg-brand-card p-4 rounded-xl border border-brand-border shadow-xs">
          <span className="text-[11px] uppercase font-bold text-brand-text-muted tracking-wider block">Total Volume</span>
          <p className="text-2xl font-extrabold text-brand-text-primary font-mono mt-1">{formatINR(stats.totalVolume)}</p>
        </div>
      </div>

      <Table
        columns={columns}
        data={bids}
        loading={loading}
        emptyMessage="You haven't placed any bids yet. Browse freight loads to enter reverse auctions."
      />
    </div>
  );
};

export default TransporterMyBids;
