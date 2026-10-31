import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  PlusCircle,
  Search,
  Filter,
  RefreshCw,
  Clock,
  RotateCcw,
  Edit,
  Eye,
  Gavel,
  StopCircle
} from 'lucide-react';
import api from '../../api/axios';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Countdown from '../../components/common/Countdown';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { formatINR, formatDateTime, parseISTDate } from '../../utils/formatters';

export const SupplierShipments = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('ALL');
  const [search, setSearch] = useState('');

  // End bidding modal state
  const [endBiddingTarget, setEndBiddingTarget] = useState(null);
  const [endBiddingLoading, setEndBiddingLoading] = useState(false);

  const navigate = useNavigate();

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusTab !== 'ALL') params.status = statusTab;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/shipments/mine', { params });
      if (res.data?.success) {
        setShipments(res.data.data.shipments);
      }
    } catch (err) {
      console.error('Failed to load shipments:', err);
    } finally {
      setLoading(false);
    }
  }, [statusTab, search]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const handleEndBiddingConfirm = async () => {
    if (!endBiddingTarget) return;
    setEndBiddingLoading(true);
    try {
      const res = await api.post(`/shipments/${endBiddingTarget._id}/end-bidding`);
      if (res.data?.success) {
        toast.success(res.data.message || 'Bidding ended successfully!');
        setEndBiddingTarget(null);
        fetchShipments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to end bidding');
    } finally {
      setEndBiddingLoading(false);
    }
  };

  const columns = [
    {
      header: 'Title / Route',
      key: 'title',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{row.title}</span>
          <span className="text-xs text-slate-500">
            {row.pickupLocation?.city} &rarr; {row.dropLocation?.city} • {row.cargoType} • {row.weight?.toLocaleString()} kg
          </span>
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      className: 'whitespace-nowrap',
      render: (row) => <Badge status={row.status} size="sm" />
    },
    {
      header: 'Bids Count',
      key: 'bidsCount',
      className: 'whitespace-nowrap',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
          {row.bidsCount ?? 0}
        </span>
      )
    },
    {
      header: 'Lowest Bid',
      key: 'lowestBid',
      className: 'whitespace-nowrap',
      render: (row) => (
        <span className="text-xs font-bold text-emerald-600 font-mono whitespace-nowrap">
          {row.lowestBid ? formatINR(row.lowestBid) : '—'}
        </span>
      )
    },
    {
      header: 'Window Remaining',
      key: 'biddingEnd',
      className: 'whitespace-nowrap',
      render: (row) => {
        if (row.status === 'OPEN') {
          const secs = Math.max(0, Math.floor(((parseISTDate(row.biddingEnd)?.getTime() || 0) - Date.now()) / 1000));
          return <Countdown secondsRemaining={secs} compact />;
        }
        return <span className="text-xs text-slate-400 whitespace-nowrap">{formatDateTime(row.biddingEnd)}</span>;
      }
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      className: 'whitespace-nowrap',
      render: (row) => (
        <div className="flex items-center justify-end gap-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
          <Link to={`/supplier/shipments/${row._id}`} className="inline-block whitespace-nowrap">
            <Button variant="secondary" size="sm" className="text-xs whitespace-nowrap">
              <Eye className="w-3.5 h-3.5 mr-1" />
              {row.status === 'OPEN' ? 'Live Room' : 'View Details'}
            </Button>
          </Link>

          {row.status === 'OPEN' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEndBiddingTarget(row)}
              className="text-xs text-rose-700 border-rose-300 hover:bg-rose-50 hover:border-rose-400 cursor-pointer whitespace-nowrap"
            >
              <StopCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
              End Bidding
            </Button>
          )}

          {row.status === 'UPCOMING' && (
            <Link to={`/supplier/shipments/${row._id}/edit`}>
              <Button variant="outline" size="sm" className="text-xs">
                <Edit className="w-3.5 h-3.5 mr-1" />
                Edit
              </Button>
            </Link>
          )}

          {row.status === 'EXPIRED' && (
            <Link to={`/supplier/shipments/${row._id}/repost`}>
              <Button variant="primary" size="sm" className="text-xs bg-amber-600 hover:bg-amber-700">
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Repost
              </Button>
            </Link>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-brand-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-brand-text-primary tracking-tight">My Consignments</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-primary-light text-brand-primary border border-brand-primary-border">
              Shipper Portal
            </span>
          </div>
          <p className="text-xs text-brand-text-secondary mt-1">
            Manage your posted freight loads, monitor real-time bids, and award winning contracts.
          </p>
        </div>
        <Link to="/supplier/shipments/new">
          <Button variant="primary" icon={PlusCircle} className="cursor-pointer">
            Create New Shipment
          </Button>
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 border-b border-brand-border overflow-x-auto pb-2">
        {['ALL', 'OPEN', 'UPCOMING', 'CLOSED', 'AWARDED', 'IN_PROGRESS', 'DELIVERED', 'EXPIRED'].map((tab) => {
          const isActive = statusTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'text-white shadow-xs'
                  : 'bg-white text-brand-text-secondary border border-brand-border hover:bg-brand-bg-secondary'
              }`}
              style={isActive ? { backgroundColor: 'var(--color-primary)' } : {}}
            >
              {tab === 'ALL' ? 'All Loads' : tab}
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-brand-border shadow-xs flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-brand-text-muted absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or origin/destination city..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-border)] focus:border-[var(--color-primary)] placeholder:text-brand-text-muted"
          />
        </div>
        <Button variant="secondary" size="sm" onClick={fetchShipments} icon={RefreshCw}>
          Refresh
        </Button>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={shipments}
        loading={loading}
        emptyMessage="No shipments found in this status category."
        onRowClick={(row) => navigate(`/supplier/shipments/${row._id}`)}
      />

      {/* End Bidding Confirmation Modal */}
      <Modal
        isOpen={Boolean(endBiddingTarget)}
        onClose={() => setEndBiddingTarget(null)}
        title="End Reverse Bidding Early?"
        subtitle={`Consignment: ${endBiddingTarget?.title}`}
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setEndBiddingTarget(null)}
              disabled={endBiddingLoading}
            >
              Keep Bidding Open
            </Button>
            <Button
              variant="danger"
              loading={endBiddingLoading}
              onClick={handleEndBiddingConfirm}
              className="cursor-pointer"
            >
              <StopCircle className="w-4 h-4 mr-1.5" />
              Yes, End Bidding Now
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5 text-xs text-brand-text-secondary leading-relaxed">
          <p>
            Are you sure you want to end bidding for <strong className="text-brand-text-primary">{endBiddingTarget?.title}</strong> immediately?
          </p>

          <div className="p-3.5 rounded-xl bg-brand-bg-secondary border border-brand-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-brand-text-muted">Total Bids Placed:</span>
              <strong className="text-brand-text-primary font-mono text-sm">{endBiddingTarget?.bidsCount ?? 0}</strong>
            </div>
            {endBiddingTarget?.lowestBid && (
              <div className="flex items-center justify-between">
                <span className="text-brand-text-muted">Current Best Offer:</span>
                <strong className="text-emerald-700 font-mono text-sm">{formatINR(endBiddingTarget.lowestBid)}</strong>
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
            <p className="font-semibold">What happens next:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-800">
              <li>The auction countdown will stop immediately.</li>
              <li>Transporters will no longer be able to place or revise their bids.</li>
              <li>
                {(endBiddingTarget?.bidsCount ?? 0) > 0
                  ? 'Consignment status transitions to CLOSED and you can award the contract to any bidder immediately.'
                  : 'Since no bids have been submitted yet, the consignment will transition to EXPIRED.'}
              </li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SupplierShipments;
