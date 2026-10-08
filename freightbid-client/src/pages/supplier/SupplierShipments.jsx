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
  Gavel
} from 'lucide-react';
import api from '../../api/axios';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Countdown from '../../components/common/Countdown';
import { formatINR, formatDateTime } from '../../utils/formatters';

export const SupplierShipments = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('ALL');
  const [search, setSearch] = useState('');

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
      render: (row) => <Badge status={row.status} size="sm" />
    },
    {
      header: 'Bids Count',
      key: 'bidsCount',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700">
          {row.bidsCount ?? 0}
        </span>
      )
    },
    {
      header: 'Lowest Bid',
      key: 'lowestBid',
      render: (row) => (
        <span className="text-xs font-bold text-emerald-600 font-mono">
          {row.lowestBid ? formatINR(row.lowestBid) : '—'}
        </span>
      )
    },
    {
      header: 'Window Remaining',
      key: 'biddingEnd',
      render: (row) => {
        if (row.status === 'OPEN') {
          const secs = Math.max(0, Math.floor((new Date(row.biddingEnd).getTime() - Date.now()) / 1000));
          return <Countdown secondsRemaining={secs} compact />;
        }
        return <span className="text-xs text-slate-400">{formatDateTime(row.biddingEnd)}</span>;
      }
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Link to={`/supplier/shipments/${row._id}`}>
            <Button variant="secondary" size="sm" className="text-xs">
              <Eye className="w-3.5 h-3.5 mr-1" />
              {row.status === 'OPEN' ? 'Live Room' : 'View Details'}
            </Button>
          </Link>

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Consignments</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your posted freight loads, monitor real-time bids, and award winning contracts.
          </p>
        </div>
        <Link to="/supplier/shipments/new">
          <Button variant="primary" icon={PlusCircle}>
            Create New Shipment
          </Button>
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2">
        {['ALL', 'OPEN', 'UPCOMING', 'CLOSED', 'AWARDED', 'IN_PROGRESS', 'DELIVERED', 'EXPIRED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              statusTab === tab
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab === 'ALL' ? 'All Loads' : tab}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or origin/destination city..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600"
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
    </div>
  );
};

export default SupplierShipments;
